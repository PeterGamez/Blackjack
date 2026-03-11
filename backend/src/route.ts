import { Hono } from "hono";
import Server from "./utils/Server";
import AuthRoute from "./routes/AuthRoute";
import UserRoute from "./routes/UserRoute";
import CodeRoute from "./routes/CodeRoute";
import PaymentRoute from "./routes/PaymentRoute";
import ShopRoute from "./routes/ShopRoute";

export default async (app: Hono, server: Server) => {
    app.get("/", (c) => {
        return c.json({ message: "Hono + TypeScript Server" });
    });

    new AuthRoute(server).getApp(app);
    new UserRoute(server).getApp(app);
    new CodeRoute(server).getApp(app);
    new PaymentRoute(server).getApp(app);
    new ShopRoute(server).getApp(app);

    app.notFound((c) => {
        return c.json({ error: "Not Found" }, 404);
    });

    app.onError((err, c) => {
        server.error("Hono", "Unhandled error occurred");
        console.error(err);
        return c.json({ message: "Internal Server Error" }, 500);
    });
};
