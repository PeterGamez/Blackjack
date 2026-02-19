import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import Client from "./utils/Client";
import AuthRoute from "./routes/AuthRoute";
import UserRoute from "./routes/UserRoute";

const authMiddleware = (client: Client) =>
    createMiddleware(async (c, next) => {
        const authHeader = c.req.header("Authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return c.json({ error: "Unauthorized" }, 401);
        }

        const token = authHeader.split(" ")[1];

        try {
            const payload = client.JWT.verifyToken(token);
            if (!payload) {
                return c.json({ error: "Invalid or expired token" }, 401);
            }

            c.set("jwtPayload", payload);

            await next();
        } catch {
            return c.json({ error: "Invalid or expired token" }, 401);
        }
    });

export default async (app: Hono, client: Client) => {
    app.get("/", (c) => {
        return c.json({ message: "Hono + TypeScript Server" });
    });

    AuthRoute(app, client);

    app.use("/*", authMiddleware(client));
    UserRoute(app, client);
};
