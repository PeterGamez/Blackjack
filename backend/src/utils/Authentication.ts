import { Context } from "hono";
import { UserInterface } from "../interfaces/Database";
import UserModel from "../models/UserModel";

export class Authentication {
    public async auth(c: Context): Promise<UserInterface> {
        const payload = c.get("jwtPayload");
        const userId = payload.userId;

        const user = await UserModel.selectUser(userId);
        return user;
    }
}
