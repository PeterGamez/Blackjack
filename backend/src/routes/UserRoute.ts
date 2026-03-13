import { Hono } from "hono";
import type { BlankEnv, BlankSchema } from "hono/types";

import type { GameHistoryInterface } from "../interfaces/Database";
import type { RouteInterface } from "../interfaces/Route";
import GameHistoryModel from "../models/GameHistoryModel";
import PaymentModel from "../models/PaymentModel";
import UserModel from "../models/UserModel";
import UserInventoryModel from "../models/UserInventoryModels";
import type Server from "../Server";

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

            const userInventory = await UserInventoryModel.selectAllUserInventoryByUserId(user.id);

            const response = {
                username: user.username,
                email: user.email,
                role: user.role,
                tokens: user.tokens,
                coins: user.coins,
                inventory: userInventory.map((item) => item.productId),
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

        this.app.get("/payment-history", async (c) => {
            const user = await this.server.Middleware.getUser(c);
            if (!user) {
                return c.json({ error: "User not found" }, 404);
            }

            const paymentHistory = await PaymentModel.selectAllPaymentsByUserId(user.id);

            const response = paymentHistory.map((payment) => ({
                receiptRef: payment.receiptRef,
                type: payment.type,
                amount: payment.amount,
                createdAt: payment.createdAt,
            }));

            return c.json(response);
        });

        this.app.get("/game-history", async (c) => {
            const user = await this.server.Middleware.getUser(c);
            if (!user) {
                return c.json({ error: "User not found" }, 404);
            }

            const gameHistory = await GameHistoryModel.selectAllGameHistoryByUserId(user.id);

            const response = gameHistory.map((game) => {
                const isPlayer = game.playerId === user.id;

                let result: GameHistoryInterface["result"];

                if (game.result === "draw") {
                    result = "draw";
                } else if (game.result === "blackjack") {
                    result = isPlayer ? "win" : "lose";
                } else if (isPlayer) {
                    result = game.result;
                } else {
                    result = game.result === "win" ? "lose" : "win";
                }

                const reward = isPlayer ? game.playerPayout : game.dealerPayout;

                const myScore = isPlayer ? game.playerScore : game.dealerScore;
                const opponentScore = isPlayer ? game.dealerScore : game.playerScore;

                return {
                    role: isPlayer ? "player" : "dealer",
                    result: result,
                    score: myScore,
                    opponentScore: opponentScore,
                    bet: game.bet,
                    mode: game.mode,
                    reward: reward,
                    createdAt: game.createdAt,
                };
            });

            return c.json(response);
        });
    }

    public getApp(app: Hono) {
        app.route(this.basePath, this.app);
        this.server.log("Route", `Registered route: ${this.basePath} [${this.app.routes.length} endpoints]`);
    }
}
