import type { SignOptions } from "jsonwebtoken";
import jwt from "jsonwebtoken";

import config from "../config";
import type { JWTPayload } from "../interfaces/Auth";
import type { UserInterface } from "../interfaces/Database";

export class JWT {
    public generateAccessToken(user: UserInterface): string {
        const payload: JWTPayload = {
            userId: user.id,
        };

        const options: SignOptions = {
            expiresIn: config.auth.accessTokenTtl as SignOptions["expiresIn"],
            algorithm: "HS256",
        };

        return jwt.sign(payload, config.auth.accessTokenSecret, options);
    }

    public generateRefreshToken(user: UserInterface): string {
        const payload: JWTPayload = {
            userId: user.id,
        };

        const options: SignOptions = {
            expiresIn: config.auth.refreshTokenTtl as SignOptions["expiresIn"],
            algorithm: "HS256",
        };

        return jwt.sign(payload, config.auth.refreshTokenSecret, options);
    }

    public verifyAccessToken(token: string): JWTPayload {
        try {
            return jwt.verify(token, config.auth.accessTokenSecret) as JWTPayload;
        } catch {
            return null;
        }
    }

    public verifyRefreshToken(token: string): JWTPayload {
        try {
            return jwt.verify(token, config.auth.refreshTokenSecret) as JWTPayload;
        } catch {
            return null;
        }
    }
}
