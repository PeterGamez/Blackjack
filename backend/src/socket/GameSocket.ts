import { Server as IOServer, Socket } from "socket.io";
import RedisService from "../services/RedisService";
import Server from "../utils/Server";

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
        socket.on("game:start", async (payload: { gameId: number; userId: number; gameType: "vsDealer" | "vsPlayer"; bet: number }, ack) => {
            const { gameId, userId, gameType, bet } = payload;
            if (!gameId || !userId) {
                ack?.({ ok: false, message: "gameId and userId are required" });
                return;
            }

            await this.join(socket, gameId);
            await this.setUserCurrentGame(userId, gameId);

            const gameState: GameState = {
                gameId,
                userId,
                gameType,
                status: "playing",
                playerBet: bet,
                playerHand: "[]",
                dealerHand: "[]",
                playerValue: 0,
                dealerValue: 0,
                result: "pending",
                reward: 0,
                deck: "[]",
                createdAt: Date.now(),
            };

            await this.saveGameState(gameId, gameState);
            this.emitToGame(gameId, "game:started", gameState);
            ack?.({ ok: true });
        });

        socket.on("game:hit", async (payload: { gameId: number; userId: number; playerHand: string; deck: string; playerValue: number }, ack) => {
            const { gameId, userId, playerHand, deck, playerValue } = payload;
            if (!gameId || !userId) {
                ack?.({ ok: false, message: "gameId and userId are required" });
                return;
            }

            const gameState = await this.getGameState(gameId);
            if (!gameState || gameState.userId !== userId) {
                ack?.({ ok: false, message: "Game not found or unauthorized" });
                return;
            }

            gameState.playerHand = playerHand;
            gameState.playerValue = playerValue;
            gameState.deck = deck;

            await this.saveGameState(gameId, gameState);
            this.emitToGame(gameId, "game:player-hit", { playerHand, playerValue });

            if (playerValue > 21) {
                gameState.result = "lose";
                gameState.status = "game-over";
                await this.saveGameState(gameId, gameState);
                this.emitToGame(gameId, "game:bust", { playerValue });
            }

            ack?.({ ok: true });
        });

        socket.on("game:stand", async (payload: { gameId: number; userId: number; deck: string; playerHand: string; dealerHand: string; playerValue: number; dealerValue: number; result: "win" | "lose" | "push"; reward: number }, ack) => {
            const { gameId, userId, playerHand, dealerHand, playerValue, dealerValue, result, reward, deck } = payload;
            if (!gameId || !userId) {
                ack?.({ ok: false, message: "gameId and userId are required" });
                return;
            }

            const gameState = await this.getGameState(gameId);
            if (!gameState || gameState.userId !== userId) {
                ack?.({ ok: false, message: "Game not found or unauthorized" });
                return;
            }

            gameState.playerHand = playerHand;
            gameState.dealerHand = dealerHand;
            gameState.playerValue = playerValue;
            gameState.dealerValue = dealerValue;
            gameState.result = result;
            gameState.reward = reward;
            gameState.status = "game-over";
            gameState.deck = deck;

            await this.saveGameState(gameId, gameState);
            this.emitToGame(gameId, "game:finished", gameState);

            ack?.({ ok: true });
        });

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
