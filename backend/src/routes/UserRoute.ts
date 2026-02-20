import { Hono } from "hono";
import Client from "../utils/Client";
import UserModel from "../models/UserModel";

export default (app: Hono, client: Client) => {
    app.get("/me", async (c) => {
        const payload = c.get("jwtPayload");
        const userId = payload.userId;

        const user = await UserModel.selectUser(userId);
        if (!user) {
            return c.json({ error: "User not found" }, 404);
        }

        return c.json(user);
    });

    return app;
};
