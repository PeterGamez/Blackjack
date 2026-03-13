import { Hono } from "hono";
import Server from "../utils/Server";
import { RouteInterface } from "../interfaces/Route";
import { BlankEnv, BlankSchema } from "hono/types";
import UserModel from "../models/UserModel";
import CodeModel from "../models/CodeModel";
import { CodeInterface } from "../interfaces/Database";
import PaymentModel from "../models/PaymentModel";

export default class CodeRoute implements RouteInterface {
    private readonly basePath = "/admin";
    private app: Hono<BlankEnv, BlankSchema, typeof this.basePath>;
    private server: Server;

    constructor(server: Server) {
        this.app = new Hono();
        this.server = server;

        this.registerRoutes();
    }

    private registerRoutes() {
        this.app.use("*", this.server.Middleware.auth());
        this.app.use("*", this.server.Middleware.adminOnly());

        this.app.get("/users", async (c) => {
            const users = await UserModel.selectAllUser();

            const response = users.map((user) => ({
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                tokens: user.tokens,
                coins: user.coins,
                isVerified: user.isVerified,
            }));

            return c.json(response);
        });

        this.app.get("/user/:id", async (c) => {
            const userId = parseInt(c.req.param("id"));
            if (isNaN(userId)) {
                return c.json({ error: "Invalid user ID" }, 400);
            }

            const user = await UserModel.selectUser(userId);
            if (!user) {
                return c.json({ error: "User not found" }, 404);
            }

            const response = {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                tokens: user.tokens,
                coins: user.coins,
                isVerified: user.isVerified,
            };

            return c.json(response);
        });

        this.app.get("/codes", async (c) => {
            const codes = await CodeModel.selectAllCodes();

            const response = codes.map((code) => ({
                id: code.id,
                code: code.code,
                amount: code.amount,
                type: code.type,
                maxUses: code.maxUses,
                isActive: code.isActive,
                expiredDate: code.expiredDate,
            }));

            return c.json(response);
        });

        this.app.post("/code", async (c) => {
            let body: { code: string; amount: number; type: CodeInterface["type"]; maxUses: number; expiredDate: string };
            try {
                body = await c.req.json<typeof body>();
            } catch {
                return c.json({ error: "Invalid or missing JSON body" }, 400);
            }

            const { code, amount, type, maxUses, expiredDate } = body;

            if (!code || !amount || !type || !maxUses || !expiredDate) {
                return c.json({ error: "Missing required fields" }, 400);
            }

            const existingCode = await CodeModel.selectCodeByCode(code);
            if (existingCode) {
                return c.json({ error: "Code already exists" }, 400);
            }

            const newCodeId = await CodeModel.createCode(code, amount, type, maxUses, new Date(expiredDate));

            return c.json({ message: "Code created successfully", codeId: newCodeId });
        });

        this.app.get("/payments", async (c) => {
            const payments = await PaymentModel.selectAllPayments();

            const response = payments.map((payment) => ({
                id: payment.id,
                userId: payment.userId,
                receiptRef: payment.receiptRef,
                type: payment.type,
                amount: payment.amount,
                createdAt: payment.createdAt,
            }));

            return c.json(response);
        });
    }

    public getApp(app: Hono) {
        app.route(this.basePath, this.app);
        this.server.log("Route", `Registered route: ${this.basePath} [${this.app.routes.length} endpoints]`);
    }
}
