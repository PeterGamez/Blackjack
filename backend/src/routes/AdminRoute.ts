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

        this.userRoutes();
        this.codeRoutes();
        this.packageRoutes();
        this.productRoutes();

        this.app.get("/payments", async (c) => {
            try {
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
            } catch (error) {
                this.server.error("AdminRoute", `Error fetching payments:`);
                console.error(error);
                return c.json({ error: "Internal server error" }, 500);
            }
        });
    }

    private userRoutes() {
        this.app.get("/users", async (c) => {
            try {
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
            } catch (error) {
                this.server.error("AdminRoute", `Error fetching users:`);
                console.error(error);
                return c.json({ error: "Internal server error" }, 500);
            }
        });

        this.app.get("/user/:id", async (c) => {
            try {
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
            } catch (error) {
                this.server.error("AdminRoute", `Error fetching user:`);
                console.error(error);
                return c.json({ error: "Internal server error" }, 500);
            }
        });

        this.app.patch("/user/:id", async (c) => {
            try {
                const userId = parseInt(c.req.param("id"));
                if (isNaN(userId)) {
                    return c.json({ error: "Invalid user ID" }, 400);
                }

                let body: { username?: string; email?: string; role?: UserInterface["role"]; tokens?: number; coins?: number };

                try {
                    body = await c.req.json();
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
            } catch (error) {
                this.server.error("AdminRoute", `Error updating user:`);
                console.error(error);
                return c.json({ error: "Internal server error" }, 500);
            }
        });
    }

    private codeRoutes() {
        this.app.get("/codes", async (c) => {
            try {
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
            } catch (error) {
                this.server.error("AdminRoute", `Error fetching codes:`);
                console.error(error);
                return c.json({ error: "Internal server error" }, 500);
            }
        });

        this.app.post("/code", async (c) => {
            try {
                let body: { code: string; amount: number; type: CodeInterface["type"]; maxUses: number; isActive: boolean; expiredDate: string };
                try {
                    body = await c.req.json();
                } catch {
                    return c.json({ error: "Invalid or missing JSON body" }, 400);
                }

                const { code, amount, type, maxUses, isActive, expiredDate } = body;

                if (!code || amount === undefined || !type || maxUses === undefined || isActive === undefined || !expiredDate) {
                    return c.json({ error: "Missing required fields" }, 400);
                }

                if (typeof amount !== "number" || amount <= 0) {
                    return c.json({ error: "amount must be a positive number" }, 400);
                }

                if (typeof maxUses !== "number" || maxUses <= 0) {
                    return c.json({ error: "maxUses must be a positive number" }, 400);
                }

                if (typeof isActive !== "boolean") {
                    return c.json({ error: "isActive must be a boolean" }, 400);
                }

                const existingCode = await CodeModel.selectCodeByCode(code);
                if (existingCode) {
                    return c.json({ error: "Code already exists" }, 400);
                }

                const newCodeId = await CodeModel.createCode(code, amount, type, maxUses, isActive, new Date(expiredDate));

                return c.json({ message: "Code created successfully", codeId: newCodeId });
            } catch (error) {
                this.server.error("AdminRoute", `Error creating code:`);
                console.error(error);
                return c.json({ error: "Internal server error" }, 500);
            }
        });

        this.app.get("/code/:id", async (c) => {
            try {
                const codeId = parseInt(c.req.param("id"));
                if (isNaN(codeId)) {
                    return c.json({ error: "Invalid code ID" }, 400);
                }

                const code = await CodeModel.selectCode(codeId);
                if (!code) {
                    return c.json({ error: "Code not found" }, 404);
                }

                const response = {
                    id: code.id,
                    code: code.code,
                    amount: code.amount,
                    type: code.type,
                    maxUses: code.maxUses,
                    isActive: code.isActive,
                    expiredDate: code.expiredDate,
                };

                return c.json(response);
            } catch (error) {
                this.server.error("AdminRoute", `Error fetching code:`);
                console.error(error);
                return c.json({ error: "Internal server error" }, 500);
            }
        });

        this.app.patch("/code/:id", async (c) => {
            try {
                const codeId = parseInt(c.req.param("id"));
                if (isNaN(codeId)) {
                    return c.json({ error: "Invalid code ID" }, 400);
                }

                let body: { code?: string; amount?: number; type?: CodeInterface["type"]; maxUses?: number; isActive?: boolean; expiredDate?: string };

                try {
                    body = await c.req.json();
                } catch {
                    return c.json({ error: "Invalid or missing JSON body" }, 400);
                }

                const { code, amount, type, maxUses, isActive, expiredDate } = body;

                if (!code && amount === undefined && !type && maxUses === undefined && isActive === undefined && !expiredDate) {
                    return c.json({ error: "No update fields provided" }, 400);
                }

                const targetCode = await CodeModel.selectCode(codeId);
                if (!targetCode) {
                    return c.json({ error: "Code not found" }, 404);
                }

                if (code) {
                    const existingCode = await CodeModel.selectCodeByCode(code);
                    if (existingCode && existingCode.id !== codeId) {
                        return c.json({ error: "Code already exists" }, 400);
                    }
                    await CodeModel.updateCode(codeId, "code", code);
                }
                if (amount !== undefined) {
                    if (typeof amount !== "number" || amount <= 0) {
                        return c.json({ error: "amount must be a positive number" }, 400);
                    }
                    await CodeModel.updateCode(codeId, "amount", amount);
                }
                if (type) {
                    await CodeModel.updateCode(codeId, "type", type);
                }
                if (maxUses !== undefined) {
                    if (typeof maxUses !== "number" || maxUses <= 0) {
                        return c.json({ error: "maxUses must be a positive number" }, 400);
                    }
                    await CodeModel.updateCode(codeId, "maxUses", maxUses);
                }
                if (isActive !== undefined) {
                    if (typeof isActive !== "boolean") {
                        return c.json({ error: "isActive must be a boolean" }, 400);
                    }
                    await CodeModel.updateCode(codeId, "isActive", isActive);
                }
                if (expiredDate) {
                    await CodeModel.updateCode(codeId, "expiredDate", new Date(expiredDate));
                }

                return c.json({ message: "Code updated successfully" });
            } catch (error) {
                this.server.error("AdminRoute", `Error updating code:`);
                console.error(error);
                return c.json({ error: "Internal server error" }, 500);
            }
        });
    }

    private packageRoutes() {
        this.app.get("/packages", async (c) => {
            try {
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
            } catch (error) {
                this.server.error("AdminRoute", `Error fetching packages:`);
                console.error(error);
                return c.json({ error: "Internal server error" }, 500);
            }
        });

        this.app.post("/package", async (c) => {
            try {
                let body: { image: string; price: number; tokens: number; isActive: boolean };
                try {
                    body = await c.req.json();
                } catch {
                    return c.json({ error: "Invalid or missing JSON body" }, 400);
                }

                const { image, price, tokens, isActive } = body;

                if (!image || price === undefined || tokens === undefined || isActive === undefined) {
                    return c.json({ error: "Missing required fields" }, 400);
                }

                if (typeof price !== "number" || price <= 0) {
                    return c.json({ error: "price must be a positive number" }, 400);
                }

                if (typeof tokens !== "number" || tokens <= 0) {
                    return c.json({ error: "tokens must be a positive number" }, 400);
                }

                if (typeof isActive !== "boolean") {
                    return c.json({ error: "isActive must be a boolean" }, 400);
                }

                const newPackageId = await PackageModel.createPackage(image, price, tokens, isActive);

                return c.json({ message: "Package created successfully", packageId: newPackageId });
            } catch (error) {
                this.server.error("AdminRoute", `Failed to create package:`);
                console.error(error);
                return c.json({ error: "Internal server error" }, 500);
            }
        });

        this.app.get("/package/:id", async (c) => {
            try {
                const packageId = parseInt(c.req.param("id"));
                if (isNaN(packageId)) {
                    return c.json({ error: "Invalid package ID" }, 400);
                }

                const pkg = await PackageModel.selectPackageById(packageId);
                if (!pkg) {
                    return c.json({ error: "Package not found" }, 404);
                }

                const response = {
                    id: pkg.id,
                    image: pkg.image,
                    price: pkg.price,
                    tokens: pkg.tokens,
                    isActive: pkg.isActive,
                    updatedAt: pkg.updatedAt,
                };

                return c.json(response);
            } catch (error) {
                this.server.error("AdminRoute", `Error fetching package:`);
                console.error(error);
                return c.json({ error: "Internal server error" }, 500);
            }
        });

        this.app.patch("/package/:id", async (c) => {
            try {
                const packageId = parseInt(c.req.param("id"));
                if (isNaN(packageId)) {
                    return c.json({ error: "Invalid package ID" }, 400);
                }

                let body: { image?: string; price?: number; tokens?: number; isActive?: boolean };

                try {
                    body = await c.req.json();
                } catch {
                    return c.json({ error: "Invalid or missing JSON body" }, 400);
                }

                const { image, price, tokens, isActive } = body;

                if (!image && price === undefined && tokens === undefined && isActive === undefined) {
                    return c.json({ error: "No update fields provided" }, 400);
                }

                if (price !== undefined && (typeof price !== "number" || price <= 0)) {
                    return c.json({ error: "price must be a positive number" }, 400);
                }

                if (tokens !== undefined && (typeof tokens !== "number" || tokens <= 0)) {
                    return c.json({ error: "tokens must be a positive number" }, 400);
                }

                if (isActive !== undefined && typeof isActive !== "boolean") {
                    return c.json({ error: "isActive must be a boolean" }, 400);
                }

                const pkg = await PackageModel.selectPackageById(packageId);
                if (!pkg) {
                    return c.json({ error: "Package not found" }, 404);
                }

                if (image) {
                    await PackageModel.updatePackage(packageId, "image", image);
                }
                if (price !== undefined) {
                    await PackageModel.updatePackage(packageId, "price", price);
                }
                if (tokens !== undefined) {
                    await PackageModel.updatePackage(packageId, "tokens", tokens);
                }
                if (isActive !== undefined) {
                    await PackageModel.updatePackage(packageId, "isActive", isActive);
                }

                return c.json({ message: "Package updated successfully" });
            } catch (error) {
                this.server.error("AdminRoute", `Error updating package:`);
                console.error(error);
                return c.json({ error: "Internal server error" }, 500);
            }
        });
    }

    private productRoutes() {
        this.app.get("/products", async (c) => {
            try {
                const products = await ProductModel.selectAllProducts();

                const response = products.map((product) => ({
                    id: product.id,
                    name: product.name,
                    description: product.description,
                    path: product.path,
                    tokens: product.tokens,
                    coins: product.coins,
                    type: product.type,
                    isRecommend: product.isRecommend,
                    isActive: product.isActive,
                    updatedAt: product.updatedAt,
                }));

                return c.json(response);
            } catch (error) {
                this.server.error("AdminRoute", `Error fetching products:`);
                console.error(error);
                return c.json({ error: "Internal server error" }, 500);
            }
        });

        this.app.post("/product", async (c) => {
            try {
                let body: { name: string; description: string; path: string; tokens: number; coins: number; type: ProductInterface["type"]; isRecommend: boolean; isActive: boolean };
                try {
                    body = await c.req.json();
                } catch {
                    return c.json({ error: "Invalid or missing JSON body" }, 400);
                }
                const { name, description, path, tokens, coins, type, isRecommend, isActive } = body;

                if (!name || !description || !path || tokens === undefined || coins === undefined || !type || typeof isRecommend !== "boolean" || typeof isActive !== "boolean") {
                    return c.json({ error: "Missing required fields" }, 400);
                }

                if (typeof tokens !== "number" || tokens < 0) {
                    return c.json({ error: "tokens must be a number >= 0" }, 400);
                }
                if (typeof coins !== "number" || coins < 0) {
                    return c.json({ error: "coins must be a number >= 0" }, 400);
                }
                if (tokens === 0 && coins === 0) {
                    return c.json({ error: "At least one of tokens or coins must be greater than 0" }, 400);
                }
                if (typeof isRecommend !== "boolean") {
                    return c.json({ error: "isRecommend must be a boolean" }, 400);
                }
                if (typeof isActive !== "boolean") {
                    return c.json({ error: "isActive must be a boolean" }, 400);
                }

                await ProductModel.insertProduct(name, description, path, tokens, coins, type, isRecommend, isActive);

                return c.json({ message: "Product created successfully" });
            } catch (error) {
                this.server.error("AdminRoute", `Failed to create product:`);
                console.error(error);
                return c.json({ error: "Internal server error" }, 500);
            }
        });

        this.app.get("/product/:id", async (c) => {
            try {
                const productId = parseInt(c.req.param("id"));
                if (isNaN(productId)) {
                    return c.json({ error: "Invalid product ID" }, 400);
                }

                const product = await ProductModel.selectProduct(productId);
                if (!product) {
                    return c.json({ error: "Product not found" }, 404);
                }

                const response = {
                    id: product.id,
                    name: product.name,
                    description: product.description,
                    path: product.path,
                    tokens: product.tokens,
                    coins: product.coins,
                    type: product.type,
                    isRecommend: product.isRecommend,
                    isActive: product.isActive,
                    updatedAt: product.updatedAt,
                };

                return c.json(response);
            } catch (error) {
                this.server.error("AdminRoute", `Error fetching product:`);
                console.error(error);
                return c.json({ error: "Internal server error" }, 500);
            }
        });

        this.app.patch("/product/:id", async (c) => {
            try {
                const productId = parseInt(c.req.param("id"));
                if (isNaN(productId)) {
                    return c.json({ error: "Invalid product ID" }, 400);
                }

                let body: { name?: string; description?: string; path?: string; tokens?: number; coins?: number; type?: ProductInterface["type"]; isRecommend?: boolean; isActive?: boolean };

                try {
                    body = await c.req.json();
                } catch {
                    return c.json({ error: "Invalid or missing JSON body" }, 400);
                }

                const { name, description, path, tokens, coins, type, isRecommend, isActive } = body;

                if (!name && !description && !path && tokens === undefined && coins === undefined && !type && isRecommend === undefined && isActive === undefined) {
                    return c.json({ error: "No update fields provided" }, 400);
                }

                if (typeof tokens === "number" && tokens < 0) {
                    return c.json({ error: "tokens must be a number >= 0" }, 400);
                }
                if (typeof coins === "number" && coins < 0) {
                    return c.json({ error: "coins must be a number >= 0" }, 400);
                }
                if (tokens === 0 && coins === 0) {
                    return c.json({ error: "At least one of tokens or coins must be greater than 0" }, 400);
                }
                if (isRecommend !== undefined && typeof isRecommend !== "boolean") {
                    return c.json({ error: "isRecommend must be a boolean" }, 400);
                }
                if (isActive !== undefined && typeof isActive !== "boolean") {
                    return c.json({ error: "isActive must be a boolean" }, 400);
                }

                const product = await ProductModel.selectProduct(productId);
                if (!product) {
                    return c.json({ error: "Product not found" }, 404);
                }

                const nextTokens = tokens ?? product.tokens;
                const nextCoins = coins ?? product.coins;
                if (nextTokens === 0 && nextCoins === 0) {
                    return c.json({ error: "At least one of tokens or coins must be greater than 0" }, 400);
                }

                if (name) {
                    await ProductModel.updateProduct(productId, "name", name);
                }
                if (description) {
                    await ProductModel.updateProduct(productId, "description", description);
                }
                if (path) {
                    await ProductModel.updateProduct(productId, "path", path);
                }
                if (tokens !== undefined) {
                    await ProductModel.updateProduct(productId, "tokens", tokens);
                }
                if (coins !== undefined) {
                    await ProductModel.updateProduct(productId, "coins", coins);
                }
                if (type) {
                    await ProductModel.updateProduct(productId, "type", type);
                }
                if (isRecommend !== undefined) {
                    await ProductModel.updateProduct(productId, "isRecommend", isRecommend);
                }
                if (isActive !== undefined) {
                    await ProductModel.updateProduct(productId, "isActive", isActive);
                }

                return c.json({ message: "Product updated successfully" });
            } catch (error) {
                this.server.error("AdminRoute", `Error updating product:`);
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
