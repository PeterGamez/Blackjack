import { Hono } from "hono";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import databaseHandler from "./handlers/databaseHandler";
import Client from "./utils/Client";
import route from "./route";

const app = new Hono();
const client = new Client();

async function run() {
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
}

run();
