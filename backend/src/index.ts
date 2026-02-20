import { Hono } from "hono";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import databaseHandler from "./handlers/databaseHandler";
import Client from "./utils/Client";
import route from "./route";
import { JWTPayload } from "./interfaces/JWTPayload";

const client = new Client();
const app = new Hono().basePath(client.config.api.path);

async function run() {
    client.log("App", "Starting server...");

    await databaseHandler(client);

    client.initModels();
    client.initServices();

    app.use(logger(client.customLogger.bind(client)));

    route(app, client);

    serve(
        {
            fetch: app.fetch,
            port: client.config.api.port,
        },
        () => {
            client.log("Hono", `Server running at http://localhost:${client.config.api.port}${client.config.api.path}`);
        }
    );
}

run();

declare module "hono" {
    interface ContextVariableMap {
        jwtPayload: JWTPayload;
    }
}
