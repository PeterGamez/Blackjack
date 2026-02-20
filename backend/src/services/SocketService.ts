import { createServer, Server as HttpServer } from "http";
import { Server as IOServer, Socket } from "socket.io";
import Client from "../utils/Client";
import RoomService from "../socket/RoomSocket";

export default class SocketService {
    public static io: IOServer;
    private static httpServer: HttpServer;
    private static client: Client;

    public static init(client: Client) {
        this.client = client;
        this.httpServer = createServer();

        this.io = new IOServer(this.httpServer, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
            },
        });

        RoomService.init(this.io, client);

        this.registerEvents();

        this.httpServer.listen(client.config.socket.port, () => {
            client.log("Socket.IO", `Socket server running on port ${client.config.socket.port}`);
        });
    }

    private static registerEvents(): void {
        this.io.on("connection", (socket: Socket) => {
            this.client.log("Socket.IO", `Client connected: ${socket.id}`);
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
