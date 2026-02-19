import jwt, { SignOptions } from "jsonwebtoken";
import config from "../config";
import { JWTPayload } from "../interfaces/JWTPayload";

export function generateAccessToken(payload: JWTPayload): string {
    const options: SignOptions = { expiresIn: config.auth.accessTokenTtl as SignOptions["expiresIn"] };

    return jwt.sign(payload, config.auth.jwtSecret, options);
}

export function generateRefreshToken(payload: JWTPayload): string {
    const options: SignOptions = { expiresIn: config.auth.refreshTokenTtl as SignOptions["expiresIn"] };

    return jwt.sign(payload, config.auth.jwtSecret, options);
}

export function verifyToken(token: string): JWTPayload {
    return jwt.verify(token, config.auth.jwtSecret) as JWTPayload;
}
