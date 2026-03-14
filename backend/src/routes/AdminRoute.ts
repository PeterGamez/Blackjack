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
                let body: { name: string; description: string; image: string; path:string; tokens: number; coins: number; type: ProductInterface["type"]; isRecommend: boolean; isActive: boolean };
                try {
                    body = await c.req.json<typeof body>();
                } catch {
                    return c.json({ error: "Invalid or missing JSON body" }, 400);
                }
                const { name, description, image, tokens, coins, type, isRecommend, isActive } = body;

                if (!name || !description || !image || !tokens || !coins || !type || typeof isRecommend !== "boolean" || typeof isActive !== "boolean") {
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
