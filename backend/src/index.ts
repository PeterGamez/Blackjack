import { Hono } from "hono";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import databaseHandler from "./handlers/databaseHandler";
import Client from "./utils/Client";
import route from "./route";
import { JWTPayload } from "./interfaces/JWTPayload";
import SocketService from "./services/SocketService";

const client = new Client();
const app = new Hono().basePath(client.config.app.path);

async function run() {
    client.log("App", "Starting server...");

    await databaseHandler(client);

    app.use(logger(client.customLogger.bind(client)));

    route(app, client);

    serve(
        {
            fetch: app.fetch,
            port: client.config.port,
        },
        () => {
            client.log("Hono", `Server running at ${client.config.app.url}`);
        }
    );

    SocketService.init(client);
}

run();

declare module "hono" {
    interface ContextVariableMap {
        jwtPayload: JWTPayload;
    }
}
