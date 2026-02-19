import jwt, { SignOptions } from "jsonwebtoken";
import config from "../config";
import { JWTPayload } from "../interfaces/JWTPayload";

export class JWT {
    public generateAccessToken(payload: JWTPayload): string {
        const options: SignOptions = { expiresIn: config.auth.accessTokenTtl as SignOptions["expiresIn"] };
        return jwt.sign(payload, config.auth.jwtSecret, options);
    }

    public generateRefreshToken(payload: JWTPayload): string {
        const options: SignOptions = { expiresIn: config.auth.refreshTokenTtl as SignOptions["expiresIn"] };
        return jwt.sign(payload, config.auth.jwtSecret, options);
    }

    public verifyToken(token: string): JWTPayload {
        return jwt.verify(token, config.auth.jwtSecret) as JWTPayload;
    }
}
