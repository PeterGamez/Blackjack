import { Server as IOServer, Socket } from "socket.io";
import RedisService from "../services/RedisService";
import UserModel from "../models/UserModel";
import type Server from "../utils/Server";
import type { Card, GameType, GameCurrency, GameState, GameStartPayload, GameActionPayload } from "../interfaces/Game";
import Blackjack from "../utils/Blackjack";
import { AckType } from "../interfaces/Type";

export default class GameSocket {
    private static io: IOServer;
    private static server: Server;

    private static readonly GAME_PREFIX = "socket:game:";
    private static readonly USER_GAME_PREFIX = "socket:user_game:";
    private static readonly SOCKET_CONN_PREFIX = "socket:conn:";
    private static readonly SOCKET_USER_SOCKET_PREFIX = "socket:user_socket:";

    public static init(io: IOServer, server: Server): void {
        this.io = io;
        this.server = server;
    }

    public static gameRoom(gameId: number): string {
        return `game:${gameId}`;
    }

    public static gameKey(gameId: number): string {
        return `${this.GAME_PREFIX}${gameId}`;
    }

    public static userGameKey(userId: number): string {
        return `${this.USER_GAME_PREFIX}${userId}`;
    }

    public static socketConnKey(socketId: string): string {
        return `${this.SOCKET_CONN_PREFIX}${socketId}`;
    }

    public static userSocketKey(userId: number): string {
        return `${this.SOCKET_USER_SOCKET_PREFIX}${userId}`;
    }

    public static async setSocketUser(socketId: string, userId: number): Promise<void> {
        const oldSocketId = await RedisService.get<string>(this.userSocketKey(userId));
        if (oldSocketId && oldSocketId !== socketId) {
            await RedisService.del(this.socketConnKey(oldSocketId));
        }
        await RedisService.set(this.socketConnKey(socketId), userId.toString());
        await RedisService.expire(this.socketConnKey(socketId), 24 * 60 * 60);
        await RedisService.set(this.userSocketKey(userId), socketId);
        await RedisService.expire(this.userSocketKey(userId), 24 * 60 * 60);
    }

    public static async getSocketUser(socketId: string): Promise<number | null> {
        const userId = await RedisService.get<string>(this.socketConnKey(socketId));
        return userId ? parseInt(userId) : null;
    }

    public static async getUserSocket(userId: number): Promise<string | null> {
        return await RedisService.get<string>(this.userSocketKey(userId));
    }

    public static async removeSocketUser(socketId: string): Promise<void> {
        const userId = await this.getSocketUser(socketId);
        if (userId !== null) {
            await RedisService.del(this.userSocketKey(userId));
        }
        await RedisService.del(this.socketConnKey(socketId));
    }

    public static async saveGameState(gameId: number, state: GameState): Promise<void> {
        const gameKey = this.gameKey(gameId);
        await RedisService.del(gameKey);
        await RedisService.hmset(gameKey, state as unknown as Record<string, string>);
        await RedisService.expire(gameKey, 86400);
    }

    public static async getGameState(gameId: number): Promise<GameState | null> {
        const gameKey = this.gameKey(gameId);
        const data = await RedisService.hgetall<Record<string, string>>(gameKey);
        if (!data || Object.keys(data).length === 0) {
            return null;
        }
        return {
            gameId: parseInt(data.gameId),
            userId: parseInt(data.userId),
            gameType: data.gameType as GameType,
            currency: data.currency as GameCurrency,
            status: data.status as "betting" | "playing" | "dealer-turn" | "game-over",
            playerBet: parseInt(data.playerBet),
            playerHand: data.playerHand,
            dealerHand: data.dealerHand,
            playerValue: parseInt(data.playerValue),
            dealerValue: parseInt(data.dealerValue),
            result: data.result as "win" | "lose" | "push" | "pending",
            reward: parseInt(data.reward),
            deck: data.deck,
            createdAt: parseInt(data.createdAt),
        };
    }

    public static async deleteGameState(gameId: number): Promise<void> {
        const gameKey = this.gameKey(gameId);
        await RedisService.del(gameKey);
    }

    public static async setUserCurrentGame(userId: number, gameId: number): Promise<void> {
        const userGameKey = this.userGameKey(userId);
        await RedisService.set(userGameKey, gameId.toString());
        await RedisService.expire(userGameKey, 86400);
    }

    public static async getUserCurrentGame(userId: number): Promise<number | null> {
        const userGameKey = this.userGameKey(userId);
        const gameId = await RedisService.get<string>(userGameKey);
        return gameId ? parseInt(gameId) : null;
    }

    public static emitToGame(gameId: number, event: string, data: unknown): void {
        this.io.to(this.gameRoom(gameId)).emit(event, data);
    }

    public static broadcastToGame(gameId: number, excludeSocketId: string, event: string, data: unknown): void {
        this.io.to(this.gameRoom(gameId)).except(excludeSocketId).emit(event, data);
    }

    public static async join(socket: Socket, gameId: number): Promise<void> {
        socket.join(this.gameRoom(gameId));
        this.server.log("GameSocket", `${socket.id} joined game ${gameId}`);
    }

    public static async leave(socket: Socket, gameId: number): Promise<void> {
        socket.leave(this.gameRoom(gameId));
        this.server.log("GameSocket", `${socket.id} left game ${gameId}`);
    }

    private static getCurrency(gameType: GameType): GameCurrency {
        return gameType === "rank_player" ? "tokens" : "coins";
    }

    private static async resolveDealer(gameState: GameState): Promise<{
        playerHand: Card[];
        dealerHand: Card[];
        playerValue: number;
        dealerValue: number;
        result: "win" | "lose" | "push";
        reward: number;
        currency: GameCurrency;
        balance: number;
    }> {
        return Blackjack.resolveDealer(gameState, this.saveGameState.bind(this));
    }

    public static register(socket: Socket): void {
        socket.on("game:start", async (payload: GameStartPayload, ack?: AckType) => {
            const { userId, gameType, bet } = payload;
            if (!userId || !bet || bet <= 0) {
                ack?.({ ok: false, message: "userId and bet are required" });
                return;
            }
            if (gameType !== "quick_ai") {
                ack?.({ ok: false, message: "Game mode not available" });
                return;
            }
            const currency = this.getCurrency(gameType);
            try {
                const user = await UserModel.selectUser(userId);
                if (!user || user[currency] < bet) {
                    ack?.({ ok: false, message: `Insufficient ${currency}` });
                    return;
                }

                const rawId = await RedisService.Redis.incr("socket:game:id");
                const gameId = typeof rawId === "number" ? rawId : parseInt(rawId as string);

                const deck = Blackjack.createDeck();
                const playerHand: Card[] = [deck[0], deck[2]];
                const dealerHand: Card[] = [deck[1], deck[3]];
                const remainingDeck = deck.slice(4);
                const playerValue = Blackjack.calcValue(playerHand);
                const dealerValue = Blackjack.calcValue(dealerHand);
                const isBlackjack = playerValue === 21;
                const isDealerBlackjack = dealerValue === 21;

                let status: GameState["status"] = "playing";
                let result: GameState["result"] = "pending";
                let reward = 0;

                if (isBlackjack || isDealerBlackjack) {
                    status = "game-over";
                    if (isBlackjack && isDealerBlackjack) {
                        result = "push";
                        reward = bet;
                    } else if (isBlackjack) {
                        result = "win";
                        reward = Math.floor(bet * 2.5); // Blackjack pays 3:2
                    } else {
                        result = "lose";
                        reward = 0;
                    }
                }

                const gameState: GameState = {
                    gameId,
                    userId,
                    gameType,
                    currency,
                    status,
                    playerBet: bet,
                    playerHand: JSON.stringify(playerHand),
                    dealerHand: JSON.stringify(dealerHand),
                    playerValue,
                    dealerValue: Blackjack.calcValue([dealerHand[0]]),
                    result,
                    reward,
                    deck: JSON.stringify(remainingDeck),
                    createdAt: Date.now(),
                };

                const newBalance = user[currency] - bet + reward;
                await this.saveGameState(gameId, gameState);
                await this.setUserCurrentGame(userId, gameId);
                await this.setSocketUser(socket.id, userId);
                await UserModel.decreaseBalance(userId, currency, bet);
                await this.join(socket, gameId);

                ack?.({
                    ok: true,
                    gameId,
                    playerHand,
                    dealerHand: status === "game-over" ? dealerHand : [dealerHand[0]],
                    playerValue,
                    dealerValue: status === "game-over" ? dealerValue : Blackjack.calcValue([dealerHand[0]]),
                    bet,
                    currency,
                    balance: newBalance,
                    blackjack: isBlackjack,
                    dealerBlackjack: isDealerBlackjack,
                    result: status === "game-over" ? result : undefined,
                    reward: status === "game-over" ? reward : undefined,
                });
            } catch (err) {
                this.server.error("GameSocket", `game:start error: ${err}`);
                ack?.({ ok: false, message: "Server error" });
            }
        });

        socket.on("game:hit", async (payload: GameActionPayload, ack?: AckType) => {
            const { gameId, userId } = payload;
            if (!gameId || !userId) {
                ack?.({ ok: false, message: "gameId and userId are required" });
                return;
            }
            try {
                const gameState = await this.getGameState(gameId);
                if (!gameState || gameState.userId !== userId) {
                    ack?.({ ok: false, message: "Game not found or unauthorized" });
                    return;
                }
                if (gameState.status === "game-over") {
                    ack?.({ ok: false, message: "Game is already over" });
                    return;
                }

                const playerHand: Card[] = JSON.parse(gameState.playerHand);
                const deck: Card[] = JSON.parse(gameState.deck);
                if (deck.length === 0) {
                    ack?.({ ok: false, message: "Deck is empty" });
                    return;
                }

                playerHand.push(deck.shift()!);
                const playerValue = Blackjack.calcValue(playerHand);

                gameState.playerHand = JSON.stringify(playerHand);
                gameState.playerValue = playerValue;
                gameState.deck = JSON.stringify(deck);

                if (playerValue > 21) {
                    gameState.result = "lose";
                    gameState.status = "game-over";
                    gameState.reward = 0;
                    await this.saveGameState(gameId, gameState);
                    this.emitToGame(gameId, "game:bust", { playerHand, playerValue });
                    ack?.({ ok: true, playerHand, playerValue, bust: true });
                    return;
                }

                if (playerValue === 21) {
                    const resolved = await this.resolveDealer(gameState);
                    const finishedPayload = { gameId, ...resolved };
                    this.emitToGame(gameId, "game:finished", finishedPayload);
                    ack?.({ ok: true, ...finishedPayload, bust: false });
                    return;
                }

                await this.saveGameState(gameId, gameState);
                this.emitToGame(gameId, "game:player-hit", { playerHand, playerValue });
                ack?.({ ok: true, playerHand, playerValue, bust: false });
            } catch (err) {
                this.server.error("GameSocket", `game:hit error: ${err}`);
                ack?.({ ok: false, message: "Server error" });
            }
        });

        socket.on("game:stand", async (payload: GameActionPayload, ack?: AckType) => {
            const { gameId, userId } = payload;
            if (!gameId || !userId) {
                ack?.({ ok: false, message: "gameId and userId are required" });
                return;
            }
            try {
                const gameState = await this.getGameState(gameId);
                if (!gameState || gameState.userId !== userId) {
                    ack?.({ ok: false, message: "Game not found or unauthorized" });
                    return;
                }
                if (gameState.status === "game-over") {
                    ack?.({ ok: false, message: "Game is already over" });
                    return;
                }

                const resolved = await this.resolveDealer(gameState);
                const finishedPayload = { gameId, ...resolved };
                this.emitToGame(gameId, "game:finished", finishedPayload);
                ack?.({ ok: true, ...finishedPayload });
            } catch (err) {
                this.server.error("GameSocket", `game:stand error: ${err}`);
                ack?.({ ok: false, message: "Server error" });
            }
        });

        socket.on("game:leave", async (payload: GameActionPayload, ack?: AckType) => {
            const { gameId, userId } = payload;
            if (!gameId || !userId) {
                ack?.({ ok: false, message: "gameId and userId are required" });
                return;
            }
            await this.leave(socket, gameId);
            ack?.({ ok: true });
        });

        socket.on("disconnect", async () => {
            this.server.log("GameSocket", `Client disconnected: ${socket.id}`);
            await this.removeSocketUser(socket.id);
        });
    }
}
