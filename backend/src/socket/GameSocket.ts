import { Server as IOServer, Socket } from "socket.io";
import RedisService from "../services/RedisService";
import Server from "../utils/Server";
import UserModel from "../models/UserModel";

interface Card {
    suit: string;
    rank: string;
    value: number;
}

const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

const createDeck = (): Card[] => {
    const deck: Card[] = [];
    for (let i = 0; i < 6; i++) {
        for (const suit of SUITS) {
            for (const rank of RANKS) {
                const value = rank === "A" ? 11 : ["J", "Q", "K"].includes(rank) ? 10 : parseInt(rank);
                deck.push({ suit, rank, value });
            }
        }
    }
    return deck.sort(() => Math.random() - 0.5);
};

const calcValue = (hand: Card[]): number => {
    let value = 0;
    let aces = 0;
    for (const card of hand) {
        value += card.value;
        if (card.rank === "A") aces++;
    }
    while (value > 21 && aces > 0) { value -= 10; aces--; }
    return value;
};

interface GameState {
    gameId: number;
    userId: number;
    gameType: "vsDealer" | "vsPlayer";
    status: "betting" | "playing" | "dealer-turn" | "game-over";
    playerBet: number;
    playerHand: string;
    dealerHand: string;
    playerValue: number;
    dealerValue: number;
    result: "win" | "lose" | "push" | "pending";
    reward: number;
    deck: string;
    createdAt: number;
}

export default class GameSocket {
    private static io: IOServer;
    private static server: Server;

    private static readonly GAME_PREFIX = "socket:game:";
    private static readonly USER_GAME_PREFIX = "socket:user_game:";

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

    public static async saveGameState(gameId: number, state: GameState): Promise<void> {
        const gameKey = this.gameKey(gameId);
        await RedisService.del(gameKey);
        await RedisService.hmset(gameKey, state as unknown as Record<string, string>);
        await RedisService.expire(gameKey, 86400); // 24 hours
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
            gameType: data.gameType as "vsDealer" | "vsPlayer",
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

    public static register(socket: Socket): void {
        /* game:start — creates game, deals cards, deducts bet */
        socket.on("game:start", async (payload: { userId: number; gameType: "vsDealer" | "vsPlayer"; bet: number }, ack) => {
            const { userId, gameType, bet } = payload;
            if (!userId || !bet || bet <= 0) {
                ack?.({ ok: false, message: "userId and bet are required" });
                return;
            }
            try {
                const user = await UserModel.selectUser(userId);
                if (!user || user.coins < bet) {
                    ack?.({ ok: false, message: "Insufficient coins" });
                    return;
                }

                const rawId = await RedisService.Redis.incr("socket:game:id");
                const gameId = typeof rawId === "number" ? rawId : parseInt(rawId as string);

                const deck = createDeck();
                const playerHand: Card[] = [deck[0], deck[2]];
                const dealerHand: Card[] = [deck[1], deck[3]];
                const remainingDeck = deck.slice(4);
                const playerValue = calcValue(playerHand);

                const gameState: GameState = {
                    gameId,
                    userId,
                    gameType,
                    status: "playing",
                    playerBet: bet,
                    playerHand: JSON.stringify(playerHand),
                    dealerHand: JSON.stringify(dealerHand),
                    playerValue,
                    dealerValue: calcValue([dealerHand[0]]),
                    result: "pending",
                    reward: 0,
                    deck: JSON.stringify(remainingDeck),
                    createdAt: Date.now(),
                };

                await this.saveGameState(gameId, gameState);
                await this.setUserCurrentGame(userId, gameId);
                await UserModel.updateUser(userId, "coins", user.coins - bet);
                await this.join(socket, gameId);

                ack?.({
                    ok: true,
                    gameId,
                    playerHand,
                    dealerHand: [dealerHand[0]], // hide second dealer card
                    playerValue,
                    bet,
                    coins: user.coins - bet,
                });
            } catch (err) {
                this.server.error("GameSocket", `game:start error: ${err}`);
                ack?.({ ok: false, message: "Server error" });
            }
        });

        /* game:hit — draws one card for the player */
        socket.on("game:hit", async (payload: { gameId: number; userId: number }, ack) => {
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

                const playerHand: Card[] = JSON.parse(gameState.playerHand);
                const deck: Card[] = JSON.parse(gameState.deck);
                if (deck.length === 0) {
                    ack?.({ ok: false, message: "Deck is empty" });
                    return;
                }

                playerHand.push(deck.shift()!);
                const playerValue = calcValue(playerHand);

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

                await this.saveGameState(gameId, gameState);
                this.emitToGame(gameId, "game:player-hit", { playerHand, playerValue });
                ack?.({ ok: true, playerHand, playerValue, bust: false });
            } catch (err) {
                this.server.error("GameSocket", `game:hit error: ${err}`);
                ack?.({ ok: false, message: "Server error" });
            }
        });

        /* game:stand — dealer plays, computes result, rewards coins */
        socket.on("game:stand", async (payload: { gameId: number; userId: number }, ack) => {
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

                const playerHand: Card[] = JSON.parse(gameState.playerHand);
                const dealerHand: Card[] = JSON.parse(gameState.dealerHand);
                const deck: Card[] = JSON.parse(gameState.deck);

                // Dealer draws until >= 17
                while (calcValue(dealerHand) < 17 && deck.length > 0) {
                    dealerHand.push(deck.shift()!);
                }

                const playerValue = calcValue(playerHand);
                const dealerValue = calcValue(dealerHand);

                let result: "win" | "lose" | "push";
                let reward = 0;

                if (dealerValue > 21 || playerValue > dealerValue) {
                    result = "win";
                    reward = gameState.playerBet * 2;
                } else if (dealerValue > playerValue) {
                    result = "lose";
                    reward = 0;
                } else {
                    result = "push";
                    reward = gameState.playerBet;
                }

                gameState.playerHand = JSON.stringify(playerHand);
                gameState.dealerHand = JSON.stringify(dealerHand);
                gameState.playerValue = playerValue;
                gameState.dealerValue = dealerValue;
                gameState.result = result;
                gameState.reward = reward;
                gameState.status = "game-over";
                gameState.deck = JSON.stringify(deck);

                await this.saveGameState(gameId, gameState);

                const user = await UserModel.selectUser(userId);
                let newCoins = user?.coins ?? 0;
                if (reward > 0 && user) {
                    newCoins = user.coins + reward;
                    await UserModel.updateUser(userId, "coins", newCoins);
                }

                const finishedPayload = { gameId, playerHand, dealerHand, playerValue, dealerValue, result, reward, coins: newCoins };
                this.emitToGame(gameId, "game:finished", finishedPayload);
                ack?.({ ok: true, ...finishedPayload });
            } catch (err) {
                this.server.error("GameSocket", `game:stand error: ${err}`);
                ack?.({ ok: false, message: "Server error" });
            }
        });

        /* game:leave */
        socket.on("game:leave", async (payload: { gameId: number; userId: number }, ack) => {
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
        });
    }
}
