import type { Context } from "hono";
import { createMiddleware } from "hono/factory";

import type { UserInterface } from "../interfaces/Database";
import UserModel from "../models/UserModel";
import RedisService from "../services/RedisService";
import type Server from "../Server";

export default class Middleware {
    private readonly USER_CACHE_PREFIX = "user:";
    private readonly USER_CACHE_TTL = 60;
    private server: Server;

    constructor(server: Server) {
        this.server = server;
    }

    public auth() {
        return createMiddleware(async (c, next): Promise<Response> => {
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

    public adminOnly() {
        return createMiddleware(async (c, next): Promise<Response> => {
            const user = await this.getUser(c);
            if (!user) {
                return c.json({ error: "User not found" }, 404);
            }

            if (user.role !== "admin") {
                return c.json({ error: "Forbidden" }, 403);
            }

            await next();
        });
    }

    public async getUser(c: Context): Promise<UserInterface> {
        const cachedUser = c.get("authUser");
        if (cachedUser) {
            return cachedUser;
        }

        const payload = c.get("jwtPayload");
        const { userId } = payload;

        const redisCachedUser = await RedisService.get<string>(`${this.USER_CACHE_PREFIX}${userId}`);
        if (redisCachedUser) {
            const userFromRedis = JSON.parse(redisCachedUser) as UserInterface;
            c.set("authUser", userFromRedis);
            return userFromRedis;
        } else {
            const user = await UserModel.selectUser(userId);
            c.set("authUser", user);

            await RedisService.set(`${this.USER_CACHE_PREFIX}${userId}`, JSON.stringify(user));
            await RedisService.expire(`${this.USER_CACHE_PREFIX}${userId}`, this.USER_CACHE_TTL);

            return user;
        }
    }
}
