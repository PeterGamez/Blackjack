import { Hono } from "hono";
import type { BlankEnv, BlankSchema } from "hono/types";

import type Server from "../Server";
import type { RouteInterface } from "../interfaces/Route";
import ProductModel from "../models/ProductModel";
import UserInventoryModel from "../models/UserInventoryModels";
import UserModel from "../models/UserModel";

export default class ShopRoute implements RouteInterface {
    private readonly basePath = "/shop";
    private app: Hono<BlankEnv, BlankSchema, typeof this.basePath>;
    private server: Server;

    constructor(server: Server) {
        this.app = new Hono();
        this.server = server;

        this.registerRoutes();
    }

    private registerRoutes() {
        this.app.use("*", this.server.Middleware.auth());

        this.app.get("/list", async (c) => {
            try {
                const products = await ProductModel.selectAllActiveProducts();

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
                }));

                return c.json(response);
            } catch (error) {
                this.server.error("ShopRoute", `Error fetching product list:`);
                console.error(error);
                return c.json({ error: "Internal server error" }, 500);
            }
        });

        this.app.post("/buy", async (c) => {
            try {
                let body: { productId: number; payment: "tokens" | "coins" };
                try {
                    body = await c.req.json();
                } catch {
                    return c.json({ error: "Invalid or missing JSON body" }, 400);
                }

                const { productId, payment } = body;

                if (!productId || !payment) {
                    return c.json({ error: "Missing productId or payment" }, 400);
                }

                const [user, product] = await Promise.all([this.server.Middleware.getUser(c), ProductModel.selectProduct(productId)]);

                if (!user) {
                    return c.json({ error: "User not found" }, 404);
                }

                if (!product) {
                    return c.json({ error: "Product not found" }, 404);
                }

                if (!product.isActive) {
                    return c.json({ error: "Product is not active" }, 400);
                }

                if (payment === "tokens") {
                    if (product.tokens == 0) {
                        return c.json({ error: "Product is not available for tokens payment" }, 400);
                    }
                    if (user.tokens < product.tokens) {
                        return c.json({ error: "Insufficient tokens" }, 400);
                    }

                    await UserModel.decreaseBalance(user.id, "tokens", product.tokens);
                } else if (payment === "coins") {
                    if (product.coins == 0) {
                        return c.json({ error: "Product is not available for coins payment" }, 400);
                    }
                    if (user.coins < product.coins) {
                        return c.json({ error: "Insufficient coins" }, 400);
                    }

                    await UserModel.decreaseBalance(user.id, "coins", product.coins);
                } else {
                    return c.json({ error: "Invalid payment method" }, 400);
                }

                await UserInventoryModel.createUserInventory(user.id, product.id);

                return c.json({ message: "Product purchased successfully" });
            } catch (err) {
                this.server.error("ShopRoute", `Error processing/buy request:`);
                console.error(err);
                return c.json({ error: "Internal server error" }, 500);
            }
        });
    }

    public getApp(app: Hono) {
        app.route(this.basePath, this.app);
        this.server.log("Route", `Registered route: ${this.basePath} [${this.app.routes.length} endpoints]`);
    }
}
