import type { Server as IOServer, Socket } from "socket.io";

import type { GameActionPayload, GameStartPayload } from "../interfaces/Game";
import type { AckType } from "../interfaces/Type";
import GameService from "../services/GameService";
import GameStateService from "../services/GameStateService";
import type Server from "../utils/Server";

export default class GameSocket {
    private static io: IOServer;
    private static server: Server;

    public static init(io: IOServer, server: Server): void {
        this.io = io;
        this.server = server;
    }

    public static emitToGame(gameId: number, event: string, data: unknown): void {
        this.io.to(GameStateService.gameRoom(gameId)).emit(event, data);
    }

    public static broadcastToGame(gameId: number, excludeSocketId: string, event: string, data: unknown): void {
        this.io.to(GameStateService.gameRoom(gameId)).except(excludeSocketId).emit(event, data);
    }

    public static async join(socket: Socket, gameId: number): Promise<void> {
        socket.join(GameStateService.gameRoom(gameId));
        this.server.log("GameSocket", `${socket.id} joined game ${gameId}`);
    }

    public static async leave(socket: Socket, gameId: number): Promise<void> {
        socket.leave(GameStateService.gameRoom(gameId));
        this.server.log("GameSocket", `${socket.id} left game ${gameId}`);
    }

    public static register(socket: Socket): void {
        socket.on("game:start", async (payload: GameStartPayload, ack?: AckType) => {
            const { userId, gameType, bet } = payload;
            if (!userId || !bet || bet <= 0) {
                ack?.({ ok: false, message: "userId and bet are required" });
                return;
            }
            try {
                const result = await GameService.startGame(userId, gameType, bet, socket.id);
                if (result.ok === false) {
                    ack?.({ ok: false, message: result.message });
                    return;
                }
                await this.join(socket, result.gameId);
                if (result.gameOver) {
                    ack?.({
                        ok: true,
                        gameId: result.gameId,
                        playerHand: result.playerHand,
                        dealerHand: result.dealerHand,
                        playerValue: result.playerValue,
                        dealerValue: result.dealerValue,
                        bet: result.bet,
                        currency: result.currency,
                        balance: result.balance,
                        blackjack: result.blackjack,
                        dealerBlackjack: result.dealerBlackjack,
                        result: result.result,
                        reward: result.reward,
                    });
                } else {
                    ack?.({
                        ok: true,
                        gameId: result.gameId,
                        playerHand: result.playerHand,
                        dealerHand: result.dealerHand,
                        playerValue: result.playerValue,
                        dealerValue: result.dealerValue,
                        bet: result.bet,
                        currency: result.currency,
                        balance: result.balance,
                    });
                }
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
                const result = await GameService.hitGame(gameId, userId);
                if (result.ok === false) {
                    ack?.({ ok: false, message: result.message });
                    return;
                }
                if (result.outcome === "bust") {
                    this.emitToGame(gameId, "game:bust", { playerHand: result.playerHand, playerValue: result.playerValue });
                    ack?.({ ok: true, playerHand: result.playerHand, playerValue: result.playerValue, bust: true });
                } else if (result.outcome === "finished") {
                    const { ok: _ok, outcome: _outcome, ...finishedPayload } = result;
                    this.emitToGame(gameId, "game:finished", finishedPayload);
                    ack?.({ ok: true, ...finishedPayload, bust: false });
                } else {
                    this.emitToGame(gameId, "game:player-hit", { playerHand: result.playerHand, playerValue: result.playerValue });
                    ack?.({ ok: true, playerHand: result.playerHand, playerValue: result.playerValue, bust: false });
                }
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
                const result = await GameService.standGame(gameId, userId);
                if (result.ok === false) {
                    ack?.({ ok: false, message: result.message });
                    return;
                }
                const { ok: _ok, ...finishedPayload } = result;
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
            await GameStateService.removeSocketUser(socket.id);
        });
    }
}
