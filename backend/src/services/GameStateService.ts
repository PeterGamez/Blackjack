import RedisService from "./RedisService";
import type { GameState, GameType, GameCurrency } from "../interfaces/Game";

export default class GameStateService {
    private static readonly GAME_PREFIX = "socket:game:";
    private static readonly USER_GAME_PREFIX = "socket:user_game:";
    private static readonly SOCKET_CONN_PREFIX = "socket:conn:";
    private static readonly SOCKET_USER_SOCKET_PREFIX = "socket:user_socket:";

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
        const data = await RedisService.hgetall<Record<string, string>>(this.gameKey(gameId));
        if (!data || Object.keys(data).length === 0) return null;
        return {
            gameId: parseInt(data.gameId),
            userId: parseInt(data.userId),
            gameType: data.gameType as GameType,
            currency: data.currency as GameCurrency,
            status: data.status as GameState["status"],
            playerBet: parseInt(data.playerBet),
            playerHand: data.playerHand,
            dealerHand: data.dealerHand,
            playerValue: parseInt(data.playerValue),
            dealerValue: parseInt(data.dealerValue),
            result: data.result as GameState["result"],
            reward: parseInt(data.reward),
            deck: data.deck,
            createdAt: parseInt(data.createdAt),
        };
    }

    public static async deleteGameState(gameId: number): Promise<void> {
        await RedisService.del(this.gameKey(gameId));
    }

    public static async setUserCurrentGame(userId: number, gameId: number): Promise<void> {
        await RedisService.set(this.userGameKey(userId), gameId.toString());
        await RedisService.expire(this.userGameKey(userId), 86400);
    }

    public static async getUserCurrentGame(userId: number): Promise<number | null> {
        const gameId = await RedisService.get<string>(this.userGameKey(userId));
        return gameId ? parseInt(gameId) : null;
    }
}
