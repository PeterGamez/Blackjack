import type { Server as HttpServer } from "node:http";
import { createServer } from "node:http";

import type { Socket } from "socket.io";
import { Server as IOServer } from "socket.io";

import type Server from "../Server";
import GameSocket from "../sockets/GameSocket";

export default class SocketService {
    public static io: IOServer;
    private static httpServer: HttpServer;
    private static server: Server;

    public static init(server: Server) {
        this.server = server;
        this.httpServer = createServer();

        this.io = new IOServer(this.httpServer, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
            },
        });

        GameSocket.init(this.io, server);

        this.registerEvents();

        this.httpServer.listen(server.config.socket.port, () => {
            server.log("Socket.IO", `Socket server running at http://localhost:${server.config.socket.port}`);
        });
    }

    private static registerEvents(): void {
        this.io.on("connection", (socket: Socket) => {
            this.server.log("Socket.IO", `Client connected: ${socket.id}`);
            GameSocket.register(socket);
        });
    }

    public static emit(event: string, ...args: unknown[]): void {
        this.io.emit(event, ...args);
    }

    public static close(): void {
        this.io?.close();
        this.httpServer?.close();
    }
}
