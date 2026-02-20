import { createServer, Server as HttpServer } from "http";
import { Server as IOServer, Socket } from "socket.io";
import Client from "../utils/Client";

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

        this.registerEvents();

        this.httpServer.listen(client.config.socketPort, () => {
            client.log("Socket.IO", `Socket server running on port ${client.config.socketPort}`);
        });
    }

    private static registerEvents(): void {
        this.io.on("connection", (socket: Socket) => {
            this.client.log("Socket.IO", `Client connected: ${socket.id}`);

            socket.on("client-message", (data) => {
                this.client.log("Socket.IO", `Received message from ${socket.id}: ${data}`);
                socket.emit("server-message", `Echo: ${data}`);
            });
            socket.on("disconnect", () => {
                this.client.log("Socket.IO", `Client disconnected: ${socket.id}`);
            });
        });
    }

    public static emit(event: string, ...args: unknown[]): void {
        this.io.emit(event, ...args);
    }

    public static to(room: string) {
        return this.io.to(room);
    }

    public static close(): void {
        this.io?.close();
        this.httpServer?.close();
    }
}
