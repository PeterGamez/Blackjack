import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import Server from "./Server";
import { initModels, initRoutes } from "./bootstrap";
import GameController from "./game/GameController";
import { databaseHandler } from "./handlers";
import type { JWTPayload } from "./interfaces/Auth";
import type { UserInterface } from "./interfaces/Database";
import RedisService from "./services/RedisService";
import SocketService from "./services/SocketService";

const server = new Server();
const app = new Hono().basePath(server.config.path);

async function run() {
    server.log("App", "Starting server...");

    await databaseHandler(server);

    app.use(logger(server.customLogger.bind(server)));
    app.use(
        cors({
            origin: "*",
            allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            allowHeaders: ["Content-Type", "Authorization"],
            credentials: true,
        })
    );

    initRoutes(server, app);
    initModels(server);

    RedisService.init(server.Redis);

    GameController.init(server);

    const httpServer = serve(
        {
            fetch: app.fetch,
            port: server.config.port,
        },
        () => {
            server.log("Hono", `Server running at http://localhost:${server.config.port}${server.config.path == "/" ? "" : server.config.path}`);
        }
    );

    SocketService.init(server, httpServer);
}

run();

declare module "hono" {
    interface ContextVariableMap {
        jwtPayload: JWTPayload;
        authUser: UserInterface;
    }
}
