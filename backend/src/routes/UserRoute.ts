import { Hono } from "hono";
import Client from "../utils/Client";
import UserModel from "../models/UserModel";
import UserSkinModel from "../models/UserSkinModels";
import { UserInterface } from "../interfaces/Database";

export default (app: Hono, client: Client) => {
    app.get("/me", async (c) => {
        const payload = c.get("jwtPayload");
        const userId = payload.userId;

        const user = await UserModel.selectUser(userId);
        if (!user) {
            return c.json({ error: "User not found" }, 404);
        }

        const userSkin = await UserSkinModel.selectUserSkinByUserId(userId);

        const response: UserInterface & { skins: number[] } = {
            ...user,
            skins: userSkin.map((us) => us.skinId),
        };

        return c.json(response);
    });

    return app;
};
