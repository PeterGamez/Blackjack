import { Hono } from "hono";
import Client from "./utils/Client";

export default async (app: Hono, client: Client) => {
    app.get("/", (c) => {
        return c.text("Hello Hono!");
    });
};
