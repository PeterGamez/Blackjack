import { Hono } from "hono";
import Server from "../utils/Server";
import UserSkinModel from "../models/UserSkinModels";
import { UserInterface } from "../interfaces/Database";
import { RouteInterface } from "../interfaces/Route";
import { createMiddleware } from "hono/factory";
import { BlankEnv, BlankSchema } from "hono/types";

export default class UserRoute implements RouteInterface {
    private readonly basePath = "/user";
    private app: Hono<BlankEnv, BlankSchema, typeof this.basePath>;
    private server: Server;

    constructor(server: Server) {
        this.app = new Hono();
        this.server = server;

        this.registerRoutes();
    }

    private authMiddleware() {
        return createMiddleware(async (c, next) => {
            const authHeader = c.req.header("Authorization");

            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const token = authHeader.split(" ")[1];

            try {
                const payload = this.server.JWT.verifyToken(token);
                if (!payload) {
                    return c.json({ error: "Invalid or expired token" }, 401);
                }

                c.set("jwtPayload", payload);

                await next();
            } catch {
                return c.json({ error: "Invalid or expired token" }, 401);
            }
        });
    }

    private registerRoutes() {
        this.app.use("*", this.authMiddleware());
        this.app.get("/me", async (c) => {
            const user = await this.server.Authentication.auth(c);
            if (!user) {
                return c.json({ error: "User not found" }, 404);
            }

            const userSkin = await UserSkinModel.selectUserSkinByUserId(user.id);

            const response: UserInterface & { skins: number[] } = {
                ...user,
                skins: userSkin.map((us) => us.skinId),
            };

            return c.json(response);
        });
    }

    public getApp(app: Hono) {
        app.route(this.basePath, this.app);
        this.server.log("Route", `Registered route: ${this.basePath} [${this.app.routes.length} endpoints]`);
    }
}
