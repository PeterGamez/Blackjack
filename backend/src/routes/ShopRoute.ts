import { Hono } from "hono";
import Server from "../utils/Server";
import { RouteInterface } from "../interfaces/Route";
import { BlankEnv, BlankSchema } from "hono/types";
import ProductModel from "../models/ProductModel";
import UserModel from "../models/UserModel";
import UserInventoryModel from "../models/UserInventoryModels";

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
            const products = await ProductModel.selectAllProducts();

            return c.json(products);
        });

        this.app.post("/buy", async (c) => {
            try {
                let body: { productId: number; payment: "tokens" | "coins" };
                try {
                    body = await c.req.json();
                } catch (err) {
                    return c.json({ error: "Invalid or missing JSON body" }, 400);
                }

                const productId = body.productId;
                const payment = body.payment;

                if (!productId || !payment) {
                    return c.json({ error: "Missing productId or payment" }, 400);
                }

                const user = await this.server.Middleware.getUser(c);

                if (!user) {
                    return c.json({ error: "User not found" }, 404);
                }

                const product = await ProductModel.selectProduct(body.productId);
                if (!product) {
                    return c.json({ error: "Product not found" }, 404);
                }

                if (!product.isActive) {
                    return c.json({ error: "Product is not active" }, 400);
                }

                if (payment === "tokens") {
                    if (user.tokens < product.tokens) {
                        return c.json({ error: "Insufficient tokens" }, 400);
                    }

                    await UserModel.decreaseBalance(user.id, "tokens", product.tokens);
                } else if (payment === "coins") {
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
