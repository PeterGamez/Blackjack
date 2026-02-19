import { Hono } from "hono";
import Client from "./utils/Client";
import auth from "./routes/auth";

export default async (app: Hono, client: Client) => {
    app.get("/", (c) => {
        return c.text("Hello Hono!");
    });

    auth(app, client);
};
