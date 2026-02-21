import { Hono } from "hono";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import databaseHandler from "./handlers/databaseHandler";
import Server from "./utils/Server";
import route from "./route";
import { JWTPayload } from "./interfaces/JWTPayload";

const server = new Server();
const app = new Hono().basePath(server.config.api.path);

async function run() {
    server.log("App", "Starting server...");

    await databaseHandler(server);

    server.initModels();
    server.initServices();

    app.use(logger(server.customLogger.bind(server)));

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
