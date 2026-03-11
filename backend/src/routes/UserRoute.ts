import { Hono } from "hono";
import Server from "../utils/Server";
import UserSkinModel from "../models/UserSkinModels";
import { UserInterface } from "../interfaces/Database";
import { RouteInterface } from "../interfaces/Route";
import { BlankEnv, BlankSchema } from "hono/types";
import UserModel from "../models/UserModel";
import { authMiddleware } from "../utils/authMiddleware";

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
        this.app.use("*", authMiddleware(this.server));
        this.app.get("/me", async (c) => {
            const userId = c.get("jwtPayload").userId;
            const [user, userSkin] = await Promise.all([
                UserModel.selectUser(userId),
                UserSkinModel.selectUserSkinByUserId(userId),
            ]);

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
