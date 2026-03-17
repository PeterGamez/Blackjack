import { Hono } from "hono";
import type { BlankEnv, BlankSchema } from "hono/types";

import type Server from "../Server";
import type { GameHistoryInterface } from "../interfaces/Database";
import type { RouteInterface } from "../interfaces/Route";
import GameHistoryModel from "../models/GameHistoryModel";
import PaymentModel from "../models/PaymentModel";
import UserInventoryModel from "../models/UserInventoryModels";
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

            const userInventory = await UserInventoryModel.selectAllUserInventoryByUserId(user.id);

            const response = {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                tokens: user.tokens,
                coins: user.coins,
                cardId: user.cardId,
                chipId: user.chipId,
                tableId: user.tableId,
                inventory: userInventory.map((item) => {
                    return {
                        productId: item.productId,
                        type: item.type,
                    };
                }),
            };

            return c.json(response);
        });

        this.app.patch("/me", async (c) => {
            const user = await this.server.Middleware.getUser(c);
            if (!user) {
                return c.json({ error: "User not found" }, 404);
            }

            let body: { cardId?: number; chipId?: number; tableId?: number };
            try {
                body = await c.req.json();
            } catch {
                return c.json({ error: "Invalid request body" }, 400);
            }

            const { cardId, chipId, tableId } = body;

            if (cardId === undefined && chipId === undefined && tableId === undefined) {
                return c.json({ error: "No update fields provided" }, 400);
            }

            if (cardId !== undefined) {
                await UserModel.updateUser(user.id, "cardId", cardId === 0 ? null : cardId);
            }
            if (chipId !== undefined) {
                await UserModel.updateUser(user.id, "chipId", chipId === 0 ? null : chipId);
            }
            if (tableId !== undefined) {
                await UserModel.updateUser(user.id, "tableId", tableId === 0 ? null : tableId);
            }

            return c.json({ ok: true });
        });

        this.app.delete("/me", async (c) => {
            try {
                let body: { password: string };
                try {
                    body = await c.req.json();
                } catch {
                    return c.json({ error: "Invalid request body" }, 400);
                }

                const { password } = body;
                if (!password) {
                    return c.json({ error: "Password is required" }, 400);
                }

                const user = await this.server.Middleware.getUser(c);
                if (!user) {
                    return c.json({ error: "User not found" }, 404);
                }

                const passwordMatch = await this.server.Password.compare(password, user.password);
                if (!passwordMatch) {
                    return c.json({ error: "Incorrect password" }, 401);
                }

                await UserModel.deleteUser(user.id);
                return c.json({ ok: true });
            } catch (error) {
                this.server.error("UserRoute", `Error deleting user: ${(error as Error).message}`);
                return c.json({ error: "Internal server error" }, 500);
            }
        });

        this.app.post("/password", async (c) => {
            try {
                let body: { currentPassword: string; newPassword: string };
                try {
                    body = await c.req.json();
                } catch {
                    return c.json({ error: "Invalid request body" }, 400);
                }

                const { currentPassword, newPassword } = body;
                if (!currentPassword || !newPassword) {
                    return c.json({ error: "Current password and new password are required" }, 400);
                }

                const user = await this.server.Middleware.getUser(c);
                if (!user) {
                    return c.json({ error: "User not found" }, 404);
                }

                const passwordMatch = await this.server.Password.compare(currentPassword, user.password);
                if (!passwordMatch) {
                    return c.json({ error: "Incorrect current password" }, 401);
                }

                const hashedNewPassword = await this.server.Password.hash(newPassword);
                await UserModel.updateUser(user.id, "password", hashedNewPassword);

                return c.json({ ok: true });
            } catch (error) {
                this.server.error("UserRoute", `Error parsing request body: ${(error as Error).message}`);
                return c.json({ error: "Invalid request body" }, 400);
            }
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
                const result = this.resolveGameResult(game.result, isPlayer);
                const reward = isPlayer ? game.playerPayout : game.dealerPayout;
                const score = isPlayer ? game.playerScore : game.dealerScore;
                const opponentScore = isPlayer ? game.dealerScore : game.playerScore;

                return {
                    role: isPlayer ? "player" : "dealer",
                    result,
                    score,
                    opponentScore,
                    bet: game.bet,
                    mode: game.mode,
                    reward,
                    createdAt: game.createdAt,
                };
            });

            return c.json(response);
        });
    }

    private resolveGameResult(result: GameHistoryInterface["result"], isPlayer: boolean): GameHistoryInterface["result"] {
        if (result === "draw") return "draw";
        if (result === "blackjack") return isPlayer ? "blackjack" : "lose";
        if (isPlayer) return result;
        return result === "win" ? "lose" : "win";
    }

    public getApp(app: Hono) {
        app.route(this.basePath, this.app);
        this.server.log("Route", `Registered route: ${this.basePath} [${this.app.routes.length} endpoints]`);
    }
}
