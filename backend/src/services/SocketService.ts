import { createServer, Server as HttpServer } from "http";
import { Server as IOServer, Socket } from "socket.io";
import Server from "../utils/Server";
import RoomService from "../socket/RoomSocket";

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

        RoomService.init(this.io, server);

        this.registerEvents();

        this.httpServer.listen(server.config.socket.port, () => {
            server.log("Socket.IO", `Socket server running on port ${server.config.socket.port}`);
        });
    }

    private static registerEvents(): void {
        this.io.on("connection", (socket: Socket) => {
            this.server.log("Socket.IO", `Client connected: ${socket.id}`);
            RoomService.register(socket);
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
