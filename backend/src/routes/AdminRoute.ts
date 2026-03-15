import { Hono } from "hono";
import type { BlankEnv, BlankSchema } from "hono/types";

import type Server from "../Server";
import type { CodeInterface, ProductInterface } from "../interfaces/Database";
import type { RouteInterface } from "../interfaces/Route";
import CodeModel from "../models/CodeModel";
import PackageModel from "../models/PackageModel";
import PaymentModel from "../models/PaymentModel";
import ProductModel from "../models/ProductModel";
import UserModel from "../models/UserModel";

export default class AdminRoute implements RouteInterface {
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

        this.app.patch("/user/:id", async (c) => {
            const userId = parseInt(c.req.param("id"));
            if (isNaN(userId)) {
                return c.json({ error: "Invalid user ID" }, 400);
            }

            let body: {
                username?: string;
                email?: string;
                role?: "user" | "admin";
                tokens?: number;
                coins?: number;
                isVerified?: boolean;
            };

            try {
                body = await c.req.json<typeof body>();
            } catch {
                return c.json({ error: "Invalid or missing JSON body" }, 400);
            }

            const hasNoUpdates =
                typeof body.username === "undefined" &&
                typeof body.email === "undefined" &&
                typeof body.role === "undefined" &&
                typeof body.tokens === "undefined" &&
                typeof body.coins === "undefined" &&
                typeof body.isVerified === "undefined";

            if (hasNoUpdates) {
                return c.json({ error: "No update fields provided" }, 400);
            }

            const targetUser = await UserModel.selectUser(userId);
            if (!targetUser) {
                return c.json({ error: "User not found" }, 404);
            }

            if (typeof body.username !== "undefined") {
                const username = body.username.trim();
                if (!username) {
                    return c.json({ error: "Invalid username" }, 400);
                }
                await UserModel.updateUser(userId, "username", username);
            }

            if (typeof body.email !== "undefined") {
                const email = body.email.trim();
                if (!email) {
                    return c.json({ error: "Invalid email" }, 400);
                }
                await UserModel.updateUser(userId, "email", email);
            }

            if (typeof body.role !== "undefined") {
                if (body.role !== "user" && body.role !== "admin") {
                    return c.json({ error: "Invalid role" }, 400);
                }
                await UserModel.updateUser(userId, "role", body.role);
            }

            if (typeof body.tokens !== "undefined") {
                if (!Number.isInteger(body.tokens) || body.tokens < 0) {
                    return c.json({ error: "Invalid tokens" }, 400);
                }
                await UserModel.updateUser(userId, "tokens", body.tokens);
            }

            if (typeof body.coins !== "undefined") {
                if (!Number.isInteger(body.coins) || body.coins < 0) {
                    return c.json({ error: "Invalid coins" }, 400);
                }
                await UserModel.updateUser(userId, "coins", body.coins);
            }

            if (typeof body.isVerified !== "undefined") {
                await UserModel.updateUser(userId, "isVerified", body.isVerified);
            }

            await this.server.Middleware.invalidateUserCache(userId);

            const updatedUser = await UserModel.selectUser(userId);

            return c.json({
                message: "User updated successfully",
                user: {
                    id: updatedUser.id,
                    username: updatedUser.username,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    tokens: updatedUser.tokens,
                    coins: updatedUser.coins,
                    isVerified: updatedUser.isVerified,
                },
            });
        });

        this.app.delete("/user/:id", async (c) => {
            const userId = parseInt(c.req.param("id"));
            if (isNaN(userId)) {
                return c.json({ error: "Invalid user ID" }, 400);
            }

            const authUser = await this.server.Middleware.getUser(c);
            if (authUser.id === userId) {
                return c.json({ error: "You cannot delete your own account" }, 400);
            }

            const user = await UserModel.selectUser(userId);
            if (!user) {
                return c.json({ error: "User not found" }, 404);
            }

            await UserModel.deleteUser(userId);
            await this.server.Middleware.invalidateUserCache(userId);

            return c.json({ message: "User deleted successfully" });
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

        this.app.get("/packages", async (c) => {
            const packages = await PackageModel.selectAllPackages();

            const response = packages.map((pkg) => ({
                id: pkg.id,
                image: pkg.image,
                price: pkg.price,
                tokens: pkg.tokens,
                isActive: pkg.isActive,
                updatedAt: pkg.updatedAt,
            }));

            return c.json(response);
        });

        this.app.post("/package", async (c) => {
            try {
                let body: { image: string; price: number; tokens: number; isActive: boolean };
                try {
                    body = await c.req.json<typeof body>();
                } catch {
                    return c.json({ error: "Invalid or missing JSON body" }, 400);
                }

                const { image, price, tokens, isActive } = body;

                if (!image || !price || !tokens || typeof isActive !== "boolean") {
                    return c.json({ error: "Missing required fields" }, 400);
                }

                const newPackageId = await PackageModel.createPackage(image, price, tokens, isActive);

                return c.json({ message: "Package created successfully", packageId: newPackageId });
            } catch (error) {
                this.server.error("AdminRoute", `Failed to create package:`);
                console.error(error);
                return c.json({ error: "Internal server error" }, 500);
            }
        });

        this.app.get("/products", async (c) => {
            const products = await ProductModel.selectAllProducts();

            const response = products.map((product) => ({
                id: product.id,
                name: product.name,
                description: product.description,
                image: product.image,
                path: product.path,
                tokens: product.tokens,
                coins: product.coins,
                type: product.type,
                isRecommend: product.isRecommend,
                isActive: product.isActive,
                updatedAt: product.updatedAt,
            }));

            return c.json(response);
        });

        this.app.post("/product", async (c) => {
            try {
                let body: { name: string; description: string; image: string; path: string; tokens: number; coins: number; type: ProductInterface["type"]; isRecommend: boolean; isActive: boolean };
                try {
                    body = await c.req.json<typeof body>();
                } catch {
                    return c.json({ error: "Invalid or missing JSON body" }, 400);
                }
                const { name, description, image, path, tokens, coins, type, isRecommend, isActive } = body;

                if (!name || !description || !image || !path || !tokens || !coins || !type || typeof isRecommend !== "boolean" || typeof isActive !== "boolean") {
                    return c.json({ error: "Missing required fields" }, 400);
                }

                await ProductModel.insertProduct(body);

                return c.json({ message: "Product created successfully" });
            } catch (error) {
                this.server.error("AdminRoute", `Failed to create product:`);
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
