import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { initModels, initRoutes, initServices } from "./bootstrap";
import GameController from "./game/GameController";
import { databaseHandler } from "./handlers";
import type { JWTPayload } from "./interfaces/Auth";
import type { UserInterface } from "./interfaces/Database";
import Server from "./Server";

const server = new Server();
const app = new Hono().basePath(server.config.api.path);

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
    initServices(server);
    GameController.init(server);

    serve(
        {
            fetch: app.fetch,
            port: server.config.api.port,
        },
        () => {
            server.log("Hono", `Server running at http://localhost:${server.config.api.port}${server.config.api.path == "/" ? "" : server.config.api.path}`);
        }
    );
}

run();

declare module "hono" {
    interface ContextVariableMap {
        jwtPayload: JWTPayload;
        authUser: UserInterface;
    }
}
