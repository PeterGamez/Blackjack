import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import databaseHandler from "./handlers/databaseHandler";
import Server from "./utils/Server";
import route from "./route";
import { JWTPayload } from "./interfaces/Auth";

const server = new Server();
const app = new Hono().basePath(server.config.api.path);

async function run() {
    server.log("App", "Starting server...");

    await databaseHandler(server);

    server.initModels();
    server.initServices();

    app.use(logger(server.customLogger.bind(server)));
    app.use(
        cors({
            origin: "*",
            allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allowHeaders: ["Content-Type", "Authorization"],
            credentials: true,
        })
    );

    route(app, server);

    serve(
        {
            fetch: app.fetch,
            port: server.config.api.port,
        },
        () => {
            server.log("Hono", `Server running at http://localhost:${server.config.api.port}${server.config.api.path}`);
        }
    );
}

run();

declare module "hono" {
    interface ContextVariableMap {
        jwtPayload: JWTPayload;
    }
}
