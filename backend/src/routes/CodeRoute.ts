import { Hono } from "hono";
import Server from "../utils/Server";
import UserModel from "../models/UserModel";
import CodeModel from "../models/CodeModel";
import CodeHistoryModel from "../models/CodeHistoryModel";
import { RouteInterface } from "../interfaces/Route";
import { createMiddleware } from "hono/factory";
import { BlankEnv, BlankSchema } from "hono/types";

export default class CodeRoute implements RouteInterface {
    private readonly basePath = "/code";
    private app: Hono<BlankEnv, BlankSchema, typeof this.basePath>;
    private server: Server;

    constructor(server: Server) {
        this.app = new Hono();
        this.server = server;

        this.registerRoutes();
    }

    private authMiddleware() {
        return createMiddleware(async (c, next) => {
            const authHeader = c.req.header("Authorization");

            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const token = authHeader.split(" ")[1];

            try {
                const payload = this.server.JWT.verifyToken(token);
                if (!payload) {
                    return c.json({ error: "Invalid or expired token" }, 401);
                }

                c.set("jwtPayload", payload);

                await next();
            } catch {
                return c.json({ error: "Invalid or expired token" }, 401);
            }
        });
    }

    private registerRoutes() {
        // POST /code/redeem - แลกโค๊ด
        this.app.post("/redeem", this.authMiddleware(), async (c) => {
            try {
                const payload = c.get("jwtPayload");
                const userId = payload.userId;

                const body = await c.req.json();
                const { code } = body;

                if (!code) {
                    return c.json({ success: false, message: "Code is required" }, 400);
                }

                // ตรวจสอบว่ามี code นี้หรือไม่
                const codeData = await CodeModel.selectCodeByCode(code);
                if (!codeData) {
                    return c.json({ success: false, message: "Invalid code" }, 400);
                }

                // ตรวจสอบว่า code ยังใช้งานได้หรือไม่
                if (!codeData.isActive) {
                    return c.json({ success: false, message: "This code is no longer active" }, 400);
                }

                // ตรวจสอบวันหมดอายุ
                if (codeData.expiredDate) {
                    const expiredDate = new Date(codeData.expiredDate);
                    const now = new Date();
                    if (now > expiredDate) {
                        return c.json({ success: false, message: "This code has expired" }, 400);
                    }
                }

                // ตรวจสอบว่า user ใช้ code นี้แล้วหรือยัง
                const hasUsed = await CodeHistoryModel.checkUserUsedCode(codeData.id, userId);
                if (hasUsed) {
                    return c.json({ success: false, message: "You have already used this code" }, 400);
                }

                // ตรวจสอบจำนวนครั้งที่ใช้แล้ว
                const usageCount = await CodeModel.getCodeUsageCount(codeData.id);
                if (usageCount >= codeData.maxUses) {
                    return c.json({ success: false, message: "This code has reached its usage limit" }, 400);
                }

                // แลกโค๊ด
                const user = await UserModel.selectUser(userId);
                const currencyType = codeData.type; // "tokens" หรือ "coins"
                const newBalance = user[currencyType] + codeData.amount;

                await UserModel.updateUser(userId, currencyType, newBalance);
                await CodeHistoryModel.createCodeHistory(codeData.id, userId);

                // ถ้าใช้ครบจำนวนแล้ว ปิด code
                const newUsageCount = usageCount + 1;
                if (newUsageCount >= codeData.maxUses) {
                    await CodeModel.updateCodeStatus(codeData.id, false);
                }

                this.server.log("CodeRoute", `User ${userId} redeemed code: ${code} (${codeData.amount} ${currencyType})`);

                return c.json({
                    success: true,
                    message: "Code redeemed successfully",
                    amount: codeData.amount,
                    currencyType,
                    balance: newBalance,
                });
            } catch (error) {
                this.server.error("CodeRoute", `Redeem code error: ${error}`);
                return c.json({ success: false, message: "Failed to redeem code" }, 500);
            }
        });

        // GET /code/history - ดึงประวัติการแลกโค๊ด
        this.app.get("/history", this.authMiddleware(), async (c) => {
            try {
                const payload = c.get("jwtPayload");
                const userId = payload.userId;

                const codeHistory = await CodeHistoryModel.selectCodeHistoryByUserId(userId);

                return c.json({
                    success: true,
                    history: codeHistory,
                });
            } catch (error) {
                this.server.error("CodeRoute", `Get code history error: ${error}`);
                return c.json({ success: false, message: "Failed to get code history" }, 500);
            }
        });
    }

    public getApp(app: Hono) {
        app.route(this.basePath, this.app);
    }
}
