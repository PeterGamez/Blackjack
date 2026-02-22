import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import Server from "./utils/Server";
import AuthRoute from "./routes/AuthRoute";
import UserRoute from "./routes/UserRoute";
import AdminRoute from "./routes/AdminRoute";
import UserModel from "./models/UserModel";

const authMiddleware = (server: Server) => {
    return createMiddleware(async (c, next) => {
        const authHeader = c.req.header("Authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return c.json({ error: "Unauthorized" }, 401);
        }

        const token = authHeader.split(" ")[1];

        try {
            const payload = server.JWT.verifyToken(token);
            if (!payload) {
                return c.json({ error: "Invalid or expired token" }, 401);
            }

            c.set("jwtPayload", payload);

            await next();
        } catch {
            return c.json({ error: "Invalid or expired token" }, 401);
        }
    });
};

export default async (app: Hono, server: Server) => {
    app.get("/", (c) => {
        return c.json({ message: "Hono + TypeScript Server" });
    });

    app.route("/auth", AuthRoute(new Hono(), server));

    app.use("/*", authMiddleware(server));

    app.route("/user", UserRoute(new Hono(), server));
    app.route("/admin", AdminRoute(new Hono(), server));

    // GET /leaderboard — public top players
    app.get("/leaderboard", async (c) => {
        const sortBy = (c.req.query("sortBy") as "cash" | "coins") || "cash";
        const limit = parseInt(c.req.query("limit") || "10");

        if (!["cash", "coins"].includes(sortBy)) {
            return c.json({ error: "Invalid sortBy. Must be 'cash' or 'coins'" }, 400);
        }

        const users = await UserModel.selectAllUsersOrderBy(sortBy, limit);
        const sanitized = users.map(({ id, username, cash, coins }) => ({ id, username, cash, coins }));
        return c.json(sanitized);
    });

    app.notFound((c) => {
        return c.json({ error: "Not Found" }, 404);
    });

    app.onError((err, c) => {
        server.error("Hono", "Unhandled error occurred");
        console.error(err);
        return c.json({ message: "Internal Server Error" }, 500);
    });
};
