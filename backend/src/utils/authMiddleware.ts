import { createMiddleware } from "hono/factory";
import Server from "./Server";

export function authMiddleware(server: Server) {
    return createMiddleware(async (c, next) => {
        const authHeader = c.req.header("Authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return c.json({ error: "Unauthorized" }, 401);
        }

        const token = authHeader.split(" ")[1];

        const payload = server.JWT.verifyToken(token);
        if (!payload) {
            return c.json({ error: "Invalid or expired token" }, 401);
        }

        c.set("jwtPayload", payload);

        await next();
    });
}
