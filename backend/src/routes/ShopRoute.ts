import { Hono } from "hono";
import Server from "../utils/Server";
import { RouteInterface } from "../interfaces/Route";
import { BlankEnv, BlankSchema } from "hono/types";
import ProductModel from "../models/ProductModel";

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
    }

    public getApp(app: Hono) {
        app.route(this.basePath, this.app);
        this.server.log("Route", `Registered route: ${this.basePath} [${this.app.routes.length} endpoints]`);
    }
}
