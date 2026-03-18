import { JWTPayload as HonoJWTPayload } from "hono/utils/jwt/types";

export interface JWTPayload extends HonoJWTPayload {
    userId: number;
}
