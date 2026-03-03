import jwt, { SignOptions } from "jsonwebtoken";
import config from "../config";
import { JWTPayload } from "../interfaces/Auth";
import { UserInterface } from "../interfaces/Database";

export default class JWT {
    public generateAccessToken(user: UserInterface): string {
        const payload: JWTPayload = {
            userId: user.id,
        };

        const options: SignOptions = {
            expiresIn: config.auth.accessTokenTtl as SignOptions["expiresIn"],
            algorithm: "HS256",
        };

        return jwt.sign(payload, config.auth.jwtSecret, options);
    }

    public generateRefreshToken(user: UserInterface): string {
        const payload: JWTPayload = {
            userId: user.id,
        };

        const options: SignOptions = {
            expiresIn: config.auth.refreshTokenTtl as SignOptions["expiresIn"],
            algorithm: "HS256",
        };

        return jwt.sign(payload, config.auth.jwtSecret, options);
    }

    public verifyToken(token: string): JWTPayload {
        return jwt.verify(token, config.auth.jwtSecret) as JWTPayload;
    }
}
