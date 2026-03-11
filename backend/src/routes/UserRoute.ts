import { Hono } from "hono";
import Server from "../utils/Server";
import UserSkinModel from "../models/UserSkinModels";
import { UserInterface } from "../interfaces/Database";
import { RouteInterface } from "../interfaces/Route";
import { BlankEnv, BlankSchema } from "hono/types";
import UserModel from "../models/UserModel";

export default class UserRoute implements RouteInterface {
    private readonly basePath = "/user";
    private app: Hono<BlankEnv, BlankSchema, typeof this.basePath>;
    private server: Server;

    constructor(server: Server) {
        this.app = new Hono();
        this.server = server;

        this.registerRoutes();
    }

    private registerRoutes() {
        this.app.use("*", this.server.Middleware.auth());

        this.app.get("/me", async (c) => {
            const user = await this.server.Middleware.getUser(c);
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

        this.app.patch("/me", async (c) => {
            const user = await this.server.Middleware.getUser(c);
            if (!user) {
                return c.json({ error: "User not found" }, 404);
            }

            let body: { password?: string };
            try {
                body = await c.req.parseBody();
            } catch {
                return c.json({ error: "Invalid request body" }, 400);
            }

            const { password } = body;

            if (!password) {
                return c.json({ error: "Missing fields to update" }, 400);
            }

            if (password) {
                const hashedPassword = await this.server.Password.hash(password);
                await UserModel.updateUser(user.id, "password", hashedPassword);
            }

            return c.json({ ok: true });
        });
    }

    public getApp(app: Hono) {
        app.route(this.basePath, this.app);
        this.server.log("Route", `Registered route: ${this.basePath} [${this.app.routes.length} endpoints]`);
    }
}
