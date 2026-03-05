import { Hono } from "hono";
import Server from "../utils/Server";
import UserModel from "../models/UserModel";
import PaymentModel from "../models/PaymentModel";
import { RouteInterface } from "../interfaces/Route";
import { createMiddleware } from "hono/factory";
import { BlankEnv, BlankSchema } from "hono/types";
import config from "../config";

interface SlipOKResponse {
    success: boolean;
    data?: {
        amount: number;
        transRef: string;
        receiverAccount: string;
        date: string;
    };
    message?: string;
}

interface TrueMoneyVoucherResponse {
    status: {
        code: string;
        message: string;
    };
    data?: {
        voucher: {
            amount_baht: number;
            redeemed: boolean;
            voucher_hash: string;
        };
    };
}

export default class PaymentRoute implements RouteInterface {
    private readonly basePath = "/payment";
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
        // GET /payment/packages - ดึงข้อมูลแพ็คเติม
        this.app.get("/packages", async (c) => {
            try {
                return c.json({
                    success: true,
                    packages: config.packages,
                });
            } catch (error) {
                this.server.error("PaymentRoute", `Get packages error: ${error}`);
                return c.json({ success: false, message: "Failed to get packages" }, 500);
            }
        });

        // POST /payment/verify-slip - ตรวจสอบสลิปผ่าน SlipOK
        this.app.post("/verify-slip", this.authMiddleware(), async (c) => {
            try {
                const payload = c.get("jwtPayload");
                const userId = payload.userId;

                const body = await c.req.json();
                const { slipImage, packageId } = body;

                if (!slipImage || !packageId) {
                    return c.json({ success: false, message: "slipImage and packageId are required" }, 400);
                }

                // หา package
                const pkg = config.packages.find((p) => p.id === packageId);
                if (!pkg || !pkg.active) {
                    return c.json({ success: false, message: "Invalid package" }, 400);
                }

                // ตรวจสอบสลิปผ่าน SlipOK API
                const slipOKUrl = `${config.payment.slipok.apiUrl}/${config.payment.slipok.branchId}`;
                const slipOKResponse = await fetch(slipOKUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-authorization": config.payment.slipok.apiKey,
                    },
                    body: JSON.stringify({
                        files: slipImage,
                        amount: pkg.price,
                    }),
                });

                const slipData = (await slipOKResponse.json()) as SlipOKResponse;

                if (!slipData.success || !slipData.data) {
                    return c.json({
                        success: false,
                        message: slipData.message || "Invalid slip verification",
                    }, 400);
                }

                // ตรวจสอบว่าสลิปนี้ถูกใช้แล้วหรือยัง
                const existingPayment = await PaymentModel.selectPaymentByReceipt(slipData.data.transRef);
                if (existingPayment) {
                    return c.json({ success: false, message: "This slip has already been used" }, 400);
                }

                // ตรวจสอบจำนวนเงิน
                if (slipData.data.amount < pkg.price) {
                    return c.json({
                        success: false,
                        message: `Insufficient amount. Expected ${pkg.price} but got ${slipData.data.amount}`,
                    }, 400);
                }

                // บันทึกการชำระเงิน
                await PaymentModel.createPayment(userId, slipData.data.transRef, pkg.tokens, "tokens");

                // เพิ่ม tokens ให้ user
                const user = await UserModel.selectUser(userId);
                const newBalance = user.tokens + pkg.tokens;
                await UserModel.updateUser(userId, "tokens", newBalance);

                this.server.log("PaymentRoute", `User ${userId} purchased package ${packageId} via slip`);

                return c.json({
                    success: true,
                    message: "Payment verified successfully",
                    tokens: pkg.tokens,
                    balance: newBalance,
                });
            } catch (error) {
                this.server.error("PaymentRoute", `Verify slip error: ${error}`);
                return c.json({ success: false, message: "Failed to verify slip" }, 500);
            }
        });

        // POST /payment/redeem-voucher - แลกอั่งเปา TrueMoney
        this.app.post("/redeem-voucher", this.authMiddleware(), async (c) => {
            try {
                const payload = c.get("jwtPayload");
                const userId = payload.userId;

                const body = await c.req.json();
                const { voucherCode, packageId, mobile } = body;

                if (!voucherCode || !packageId || !mobile) {
                    return c.json({ success: false, message: "voucherCode, packageId and mobile are required" }, 400);
                }

                // หา package
                const pkg = config.packages.find((p) => p.id === packageId);
                if (!pkg || !pkg.active) {
                    return c.json({ success: false, message: "Invalid package" }, 400);
                }

                // ตรวจสอบว่า voucher นี้ถูกใช้แล้วหรือยัง
                const existingPayment = await PaymentModel.selectPaymentByReceipt(voucherCode);
                if (existingPayment) {
                    return c.json({ success: false, message: "This voucher has already been used" }, 400);
                }

                // แลก voucher ผ่าน TrueMoney API
                const voucherUrl = `${config.payment.truemoney.apiUrl}${voucherCode}/redeem`;
                const trueMoneyResponse = await fetch(voucherUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        mobile,
                        voucher_hash: voucherCode,
                    }),
                });

                const voucherData = (await trueMoneyResponse.json()) as TrueMoneyVoucherResponse;

                if (voucherData.status.code !== "SUCCESS" || !voucherData.data) {
                    return c.json({
                        success: false,
                        message: voucherData.status.message || "Invalid voucher",
                    }, 400);
                }

                if (voucherData.data.voucher.redeemed) {
                    return c.json({ success: false, message: "This voucher has already been redeemed" }, 400);
                }

                // ตรวจสอบจำนวนเงิน
                if (voucherData.data.voucher.amount_baht < pkg.price) {
                    return c.json({
                        success: false,
                        message: `Insufficient amount. Expected ${pkg.price} but got ${voucherData.data.voucher.amount_baht}`,
                    }, 400);
                }

                // บันทึกการชำระเงิน
                await PaymentModel.createPayment(userId, voucherCode, pkg.tokens, "tokens");

                // เพิ่ม tokens ให้ user
                const user = await UserModel.selectUser(userId);
                const newBalance = user.tokens + pkg.tokens;
                await UserModel.updateUser(userId, "tokens", newBalance);

                this.server.log("PaymentRoute", `User ${userId} purchased package ${packageId} via voucher`);

                return c.json({
                    success: true,
                    message: "Voucher redeemed successfully",
                    tokens: pkg.tokens,
                    balance: newBalance,
                });
            } catch (error) {
                this.server.error("PaymentRoute", `Redeem voucher error: ${error}`);
                return c.json({ success: false, message: "Failed to redeem voucher" }, 500);
            }
        });

        // GET /payment/history - ดึงประวัติการชำระเงิน
        this.app.get("/history", this.authMiddleware(), async (c) => {
            try {
                const payload = c.get("jwtPayload");
                const userId = payload.userId;

                const payments = await PaymentModel.selectPaymentByUserId(userId);

                return c.json({
                    success: true,
                    payments,
                });
            } catch (error) {
                this.server.error("PaymentRoute", `Get payment history error: ${error}`);
                return c.json({ success: false, message: "Failed to get payment history" }, 500);
            }
        });
    }

    public getApp(app: Hono) {
        app.route(this.basePath, this.app);
    }
}
