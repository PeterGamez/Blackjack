import { Hono } from "hono";
import Server from "../utils/Server";
import { RouteInterface } from "../interfaces/Route";
import { createMiddleware } from "hono/factory";
import { BlankEnv, BlankSchema } from "hono/types";

export default class CodeRoute implements RouteInterface {
    private readonly basePath = "/code";
    private app: Hono<BlankEnv, BlankSchema, typeof this.basePath>;
    private server: Server;

    constructor(server: Server) {
        this.app = new Hono();
        this.server = server;

        this.registerRoutes();
    }

    private authMiddleware() {
        return createMiddleware(async (c, next) => {
            const authHeader = c.req.header("Authorization");

            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const token = authHeader.split(" ")[1];

            try {
                const payload = this.server.JWT.verifyToken(token);
                if (!payload) {
                    return c.json({ error: "Invalid or expired token" }, 401);
                }

                c.set("jwtPayload", payload);

                await next();
            } catch {
                return c.json({ error: "Invalid or expired token" }, 401);
            }
        });
    }

    private registerRoutes() {
        this.app.use("*", this.authMiddleware());
        this.app.post("/redeem", async (c) => {
            try {
                let body: { code: string };
                try {
                    body = await c.req.json();
                } catch {
                    return c.json({ error: "Invalid JSON body" }, 400);
                }

                const code = body.code;
                return c.json(code);
            } catch (error) {
                this.server.error("CodeRoute", `Error processing redeem request: `);
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
