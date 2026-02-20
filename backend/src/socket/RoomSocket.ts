import { Server as IOServer, Socket } from "socket.io";
import type { RoomMessagePayload, RoomServerEvents } from "../interfaces/Socket";
import RedisService from "../services/RedisService";
import Client from "../utils/Client";

export default class RoomSocket {
    private static io: IOServer;
    private static client: Client;

    private static readonly ROOM_PREFIX = "socket:room:";

    public static init(io: IOServer, client: Client): void {
        this.io = io;
        this.client = client;
    }

    public static roomKey(tableId: string): string {
        return `table:${tableId}`;
    }

    public static redisKey(tableId: string): string {
        return `${this.ROOM_PREFIX}${tableId}`;
    }

    public static async getMembers(tableId: string): Promise<string[]> {
        return await RedisService.smembers(this.redisKey(tableId));
    }

    public static async isMember(tableId: string, socketId: string): Promise<boolean> {
        return await RedisService.sismember(this.redisKey(tableId), socketId);
    }

    public static emitToRoom<E extends keyof RoomServerEvents>(tableId: string, event: E, ...args: Parameters<RoomServerEvents[E]>): void {
        (
            this.io.to(this.roomKey(tableId)) as unknown as {
                emit: (...a: unknown[]) => void;
            }
        ).emit(event, ...args);
    }

    public static broadcastToRoom<E extends keyof RoomServerEvents>(tableId: string, excludeSocketId: string, event: E, ...args: Parameters<RoomServerEvents[E]>): void {
        const room = this.io.to(this.roomKey(tableId)) as unknown as {
            except: (id: string) => { emit: (...a: unknown[]) => void };
        };
        room.except(excludeSocketId).emit(event, ...args);
    }

    public static async join(socket: Socket, tableId: string): Promise<void> {
        socket.join(this.roomKey(tableId));

        await RedisService.sadd(this.redisKey(tableId), socket.id);
        const members = await RedisService.smembers(this.redisKey(tableId));

        this.client.log("RoomService", `${socket.id} joined room ${tableId}`);

        this.emitToRoom(tableId, "room:state", { tableId, members });
        this.broadcastToRoom(tableId, socket.id, "room:player-joined", {
            tableId,
            socketId: socket.id,
        });
    }

    public static async leave(socket: Socket, tableId: string): Promise<void> {
        socket.leave(this.roomKey(tableId));

        await RedisService.srem(this.redisKey(tableId), socket.id);
        const remaining = await RedisService.scard(this.redisKey(tableId));

        if (remaining === 0) {
            await RedisService.del(this.redisKey(tableId));
        }

        this.client.log("RoomService", `${socket.id} left room ${tableId}`);

        const members = await RedisService.smembers(this.redisKey(tableId));

        if (remaining > 0) {
            this.emitToRoom(tableId, "room:state", { tableId, members });
        }
        this.emitToRoom(tableId, "room:player-left", { tableId, socketId: socket.id });
    }

    public static async leaveAll(socket: Socket): Promise<void> {
        const keys = await RedisService.Redis.keys(`${this.ROOM_PREFIX}*`);
        for (const key of keys) {
            const isMember = await RedisService.sismember(key, socket.id);
            if (isMember) {
                const tableId = key.slice(this.ROOM_PREFIX.length);
                await this.leave(socket, tableId);
            }
        }
    }
    public static register(socket: Socket): void {
        socket.on("room:join", async (tableId: string, ack) => {
            if (!tableId) {
                ack?.({ ok: false, message: "tableId is required" });
                return;
            }
            await this.join(socket, tableId);
            ack?.({ ok: true });
        });

        socket.on("room:leave", async (tableId: string, ack) => {
            if (!tableId) {
                ack?.({ ok: false, message: "tableId is required" });
                return;
            }
            await this.leave(socket, tableId);
            ack?.({ ok: true });
        });

        socket.on("room:message", async (payload: RoomMessagePayload, ack) => {
            const { tableId, data } = payload ?? {};
            if (!tableId) {
                ack?.({ ok: false, message: "tableId is required" });
                return;
            }
            if (!(await this.isMember(tableId, socket.id))) {
                ack?.({ ok: false, message: "You are not in this room" });
                return;
            }
            this.io.to(this.roomKey(tableId)).except(socket.id).emit("room:data", { tableId, from: socket.id, data });
            ack?.({ ok: true });
        });

        socket.on("disconnect", async () => {
            this.client.log("RoomService", `Client disconnected: ${socket.id}`);
            await this.leaveAll(socket);
        });
    }
}
