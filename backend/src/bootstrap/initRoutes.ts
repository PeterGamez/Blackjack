import type { Hono } from "hono";

import AdminRoute from "../routes/AdminRoute";
import AuthRoute from "../routes/AuthRoute";
import CodeRoute from "../routes/CodeRoute";
import IndexRoute from "../routes/IndexRoute";
import PaymentRoute from "../routes/PaymentRoute";
import ShopRoute from "../routes/ShopRoute";
import UserRoute from "../routes/UserRoute";
import type Server from "../utils/Server";

export function initRoutes(server: Server, app: Hono) {
    new IndexRoute(server).getApp(app);

    new AuthRoute(server).getApp(app);

    new CodeRoute(server).getApp(app);
    new PaymentRoute(server).getApp(app);
    new ShopRoute(server).getApp(app);
    new UserRoute(server).getApp(app);

    new AdminRoute(server).getApp(app);
}
