import { Hono } from "hono";
import Server from "../utils/Server";
import UserModel from "../models/UserModel";
import UserSkinModel from "../models/UserSkinModels";
import { UserInterface } from "../interfaces/Database";

export default (app: Hono, server: Server) => {
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
