import { Hono } from "hono";
import CodeHistoryModel from "../models/CodeHistoryModel";
import CodeModel from "../models/CodeModel";
import type { RouteInterface } from "../interfaces/Route";
import type { BlankEnv, BlankSchema } from "hono/types";
import UserModel from "../models/UserModel";
import type Server from "../Server";

export default class CodeRoute implements RouteInterface {
    private readonly basePath = "/code";
    private app: Hono<BlankEnv, BlankSchema, typeof this.basePath>;
    private server: Server;

    constructor(server: Server) {
        this.app = new Hono();
        this.server = server;

        this.registerRoutes();
    }

    private registerRoutes() {
        this.app.use("*", this.server.Middleware.auth());

        this.app.post("/redeem", async (c) => {
            try {
                let body: { code: string };
                try {
                    body = await c.req.json<typeof body>();
                } catch {
                    return c.json({ error: "Invalid or missing JSON body" }, 400);
                }

                const user = await this.server.Middleware.getUser(c);
                if (!user) {
                    return c.json({ error: "User not found" }, 404);
                }

                const { code } = body;

                if (!code) {
                    return c.json({ error: "Missing code" }, 400);
                }

                const codeData = await CodeModel.selectCodeByCode(code);
                if (!codeData) {
                    return c.json({ error: "Code not found" }, 404);
                }
                if (!codeData.isActive) {
                    return c.json({ error: "Code is not active" }, 400);
                }
                if (codeData.expiredDate < new Date()) {
                    return c.json({ error: "Code has expired" }, 400);
                }

                const [isRedeem, redeemCount] = await Promise.all([
                    CodeHistoryModel.isRedeemCodeHistoryByCodeIdAndUserId(codeData.id, user.id),
                    CodeHistoryModel.selectCodeHistoryCountByCodeId(codeData.id),
                ]);

                if (isRedeem) {
                    return c.json({ error: "You have already redeemed this code" }, 400);
                }

                if (redeemCount >= codeData.maxUses) {
                    return c.json({ error: "Code has reached maximum uses" }, 400);
                }

                await Promise.all([CodeHistoryModel.createCodeHistory(codeData.id, user.id), UserModel.increaseBalance(user.id, codeData.type, codeData.amount)]);

                return c.json({ message: "Code redeemed successfully", amount: codeData.amount, type: codeData.type });
            } catch (error) {
                this.server.error("CodeRoute", `Error processing redeem request:`);
                console.error(error);
                return c.json({ error: "Internal server error" }, 500);
            }
        });
    }

    public getApp(app: Hono) {
        app.route(this.basePath, this.app);
        this.server.log("Route", `Registered route: ${this.basePath} [${this.app.routes.length} endpoints]`);
    }
}
