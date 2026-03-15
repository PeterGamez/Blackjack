import { Hono } from "hono";
import type { BlankEnv, BlankSchema } from "hono/types";

import type Server from "../Server";
import type { CodeInterface, ProductInterface, UserInterface } from "../interfaces/Database";
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

            let body: { username?: string; email?: string; role?: UserInterface["role"]; tokens?: number; coins?: number };

            try {
                body = await c.req.json<typeof body>();
            } catch {
                return c.json({ error: "Invalid or missing JSON body" }, 400);
            }

            const { username, email, role, tokens, coins } = body;

            if (!username && !email && !role && tokens === undefined && coins === undefined) {
                return c.json({ error: "No update fields provided" }, 400);
            }

            const user = await UserModel.selectUser(userId);
            if (!user) {
                return c.json({ error: "User not found" }, 404);
            }

            if (username) {
                await UserModel.updateUser(userId, "username", username);
            }
            if (email) {
                await UserModel.updateUser(userId, "email", email);
            }
            if (role) {
                await UserModel.updateUser(userId, "role", role);
            }
            if (tokens !== undefined) {
                await UserModel.updateUser(userId, "tokens", tokens);
            }
            if (coins !== undefined) {
                await UserModel.updateUser(userId, "coins", coins);
            }

            return c.json({ message: "User updated successfully" });
        });

        this.app.delete("/user/:id", async (c) => {
            const userId = parseInt(c.req.param("id"));
            if (isNaN(userId)) {
                return c.json({ error: "Invalid user ID" }, 400);
            }

            const authUser = await this.server.Middleware.getUser(c);
            if (authUser.role == "admin") {
                return c.json({ error: "Admins cannot delete users" }, 403);
            }

            const user = await UserModel.selectUser(userId);
            if (!user) {
                return c.json({ error: "User not found" }, 404);
            }

            await UserModel.deleteUser(userId);

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

        this.app.patch("/code/:id", async (c) => {
            const codeId = parseInt(c.req.param("id"));
            if (isNaN(codeId)) {
                return c.json({ error: "Invalid code ID" }, 400);
            }

            let body: {
                code?: string;
                amount?: number;
                type?: CodeInterface["type"];
                maxUses?: number;
                isActive?: boolean;
                expiredDate?: string;
            };

            try {
                body = await c.req.json<typeof body>();
            } catch {
                return c.json({ error: "Invalid or missing JSON body" }, 400);
            }

            const hasNoUpdates =
                typeof body.code === "undefined" &&
                typeof body.amount === "undefined" &&
                typeof body.type === "undefined" &&
                typeof body.maxUses === "undefined" &&
                typeof body.isActive === "undefined" &&
                typeof body.expiredDate === "undefined";

            if (hasNoUpdates) {
                return c.json({ error: "No update fields provided" }, 400);
            }

            const targetCode = await CodeModel.selectCodeById(codeId);
            if (!targetCode) {
                return c.json({ error: "Code not found" }, 404);
            }

            const updatePayload: {
                code?: string;
                amount?: number;
                type?: CodeInterface["type"];
                maxUses?: number;
                isActive?: boolean;
                expiredDate?: Date;
            } = {};

            if (typeof body.code !== "undefined") {
                const newCode = body.code.trim();
                if (!newCode) {
                    return c.json({ error: "Invalid code" }, 400);
                }

                if (newCode !== targetCode.code) {
                    const existingCode = await CodeModel.selectCodeByCode(newCode);
                    if (existingCode && existingCode.id !== codeId) {
                        return c.json({ error: "Code already exists" }, 400);
                    }
                }

                updatePayload.code = newCode;
            }

            if (typeof body.amount !== "undefined") {
                if (!Number.isInteger(body.amount) || body.amount <= 0) {
                    return c.json({ error: "Invalid amount" }, 400);
                }
                updatePayload.amount = body.amount;
            }

            if (typeof body.type !== "undefined") {
                if (body.type !== "coins" && body.type !== "tokens") {
                    return c.json({ error: "Invalid type" }, 400);
                }
                updatePayload.type = body.type;
            }

            if (typeof body.maxUses !== "undefined") {
                if (!Number.isInteger(body.maxUses) || body.maxUses <= 0) {
                    return c.json({ error: "Invalid maxUses" }, 400);
                }
                updatePayload.maxUses = body.maxUses;
            }

            if (typeof body.isActive !== "undefined") {
                updatePayload.isActive = body.isActive;
            }

            if (typeof body.expiredDate !== "undefined") {
                const parsedDate = new Date(body.expiredDate);
                if (isNaN(parsedDate.getTime())) {
                    return c.json({ error: "Invalid expiredDate" }, 400);
                }
                updatePayload.expiredDate = parsedDate;
            }

            await CodeModel.updateCode(codeId, updatePayload);

            const updatedCode = await CodeModel.selectCodeById(codeId);

            return c.json({
                message: "Code updated successfully",
                code: {
                    id: updatedCode.id,
                    code: updatedCode.code,
                    amount: updatedCode.amount,
                    type: updatedCode.type,
                    maxUses: updatedCode.maxUses,
                    isActive: updatedCode.isActive,
                    expiredDate: updatedCode.expiredDate,
                },
            });
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
