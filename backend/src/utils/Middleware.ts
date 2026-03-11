import { createMiddleware } from "hono/factory";
import Server from "./Server";
import { UserInterface } from "../interfaces/Database";
import UserModel from "../models/UserModel";
import { Context } from "hono";

export class Middleware {
    private server: Server;

    constructor(server: Server) {
        this.server = server;
    }

    public auth() {
        return createMiddleware(async (c, next) => {
            const authHeader = c.req.header("Authorization");

            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const token = authHeader.split(" ")[1];

            const payload = this.server.JWT.verifyToken(token);
            if (!payload) {
                return c.json({ error: "Invalid or expired token" }, 401);
            }

            c.set("jwtPayload", payload);

            await next();
        });
    }

    public async getUser(c: Context): Promise<UserInterface> {
        const payload = c.get("jwtPayload");
        const userId = payload.userId;

        const user = await UserModel.selectUser(userId);
        return user;
    }
}
