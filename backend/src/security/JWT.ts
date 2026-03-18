import { sign, verify } from "hono/jwt";

import config from "../config";
import type { JWTPayload } from "../interfaces/Auth";
import type { UserInterface } from "../interfaces/Database";

export class JWT {
    public async generateAccessToken(user: UserInterface): Promise<string> {
        const now = Math.floor(Date.now() / 1000);
        const payload: JWTPayload = {
            userId: user.id,
            exp: now + this.formatTtl(config.auth.accessTokenTtl),
            iat: now,
        };

        return await sign(payload, config.auth.accessTokenSecret, "HS256");
    }

    public async generateRefreshToken(user: UserInterface): Promise<string> {
        const now = Math.floor(Date.now() / 1000);
        const payload = {
            userId: user.id,
            exp: now + this.formatTtl(config.auth.refreshTokenTtl),
            iat: now,
        };

        return await sign(payload, config.auth.refreshTokenSecret, "HS256");
    }

    public async verifyAccessToken(token: string): Promise<JWTPayload> {
        try {
            return (await verify(token, config.auth.accessTokenSecret, "HS256")) as JWTPayload;
        } catch {
            return null;
        }
    }

    public async verifyRefreshToken(token: string): Promise<JWTPayload> {
        try {
            return (await verify(token, config.auth.refreshTokenSecret, "HS256")) as JWTPayload;
        } catch {
            return null;
        }
    }

    private formatTtl(ttl: string): number {
        const match = ttl.match(/^(\d+)([smhd])$/);
        if (!match) {
            throw new Error("Invalid TTL format");
        }

        const value = parseInt(match[1]);
        const unit = match[2];

        switch (unit) {
            case "s":
                return value;
            case "m":
                return value * 60;
            case "h":
                return value * 3600;
            case "d":
                return value * 86400;
            default:
                throw new Error("Invalid TTL unit");
        }
    }
}
