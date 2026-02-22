import { Hono } from "hono";
import Server from "../utils/Server";
import UserModel from "../models/UserModel";
import UserSkinModel from "../models/UserSkinModels";
import CodeModel from "../models/CodeModel";
import CodeHistoryModel from "../models/CodeHistoryModel";
import PaymentModel from "../models/PaymentModel";
import GameHistoryModel from "../models/GameHistoryModel";
import { UserInterface } from "../interfaces/Database";

export default (app: Hono, server: Server) => {
    // GET /user/me
    app.get("/me", async (c) => {
        try {
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
        } catch (error) {
            server.error("USER", "Get me error:");
            console.error(error);
            return c.json({ error: "Failed to get user" }, 500);
        }
    });

    // PUT /user/me — update username
    app.put("/me", async (c) => {
        try {
            const payload = c.get("jwtPayload");
            const userId = payload.userId;
            const body = (await c.req.json()) as { username?: string; email?: string };

            const { username, email } = body;

            if (!username && !email) {
                return c.json({ error: "No fields to update" }, 400);
            }

            if (username) {
                const trimmed = username.trim().toLowerCase();
                const existing = await UserModel.selectUserByUsernameOrEmail(trimmed);
                if (existing && existing.id !== userId) {
                    return c.json({ error: "Username already taken" }, 409);
                }
                await UserModel.updateUser(userId, "username", trimmed);
            }

            if (email) {
                const trimmed = email.trim().toLowerCase();
                const existing = await UserModel.selectUserByUsernameOrEmail(trimmed);
                if (existing && existing.id !== userId) {
                    return c.json({ error: "Email already taken" }, 409);
                }
                await UserModel.updateUser(userId, "email", trimmed);
            }

            server.log("USER", `User ${userId} updated profile`);
            return c.json({ message: "Profile updated successfully" });
        } catch (error) {
            server.error("USER", "Update profile error:");
            console.error(error);
            return c.json({ error: "Failed to update profile" }, 500);
        }
    });

    // PUT /user/me/password — change password
    app.put("/me/password", async (c) => {
        try {
            const payload = c.get("jwtPayload");
            const userId = payload.userId;
            const body = (await c.req.json()) as { currentPassword: string; newPassword: string };

            const { currentPassword, newPassword } = body;

            if (!currentPassword || !newPassword) {
                return c.json({ error: "Missing currentPassword or newPassword" }, 400);
            }

            const user = await UserModel.selectUser(userId);
            if (!user) {
                return c.json({ error: "User not found" }, 404);
            }

            const isValid = await server.Password.compare(currentPassword, user.password);
            if (!isValid) {
                return c.json({ error: "Current password is incorrect" }, 401);
            }

            const hashed = await server.Password.hash(newPassword);
            await UserModel.updateUser(userId, "password", hashed);

            server.log("USER", `User ${userId} changed password`);
            return c.json({ message: "Password changed successfully" });
        } catch (error) {
            server.error("USER", "Change password error:");
            console.error(error);
            return c.json({ error: "Failed to change password" }, 500);
        }
    });

    // POST /user/code/redeem — redeem a voucher code
    app.post("/code/redeem", async (c) => {
        try {
            const payload = c.get("jwtPayload");
            const userId = payload.userId;
            const body = (await c.req.json()) as { code: string };

            const code = body.code?.trim();
            if (!code) {
                return c.json({ error: "Missing code" }, 400);
            }

            const codeRecord = await CodeModel.selectCodeByCode(code);
            if (!codeRecord) {
                return c.json({ error: "Invalid code" }, 404);
            }

            if (!codeRecord.isActive) {
                return c.json({ error: "Code is not active" }, 400);
            }

            if (new Date(codeRecord.expiredDate) < new Date()) {
                return c.json({ error: "Code has expired" }, 400);
            }

            const history = await CodeHistoryModel.selectCodeHistoryByUserId(userId);
            const alreadyUsed = history.some((h) => h.codeId === codeRecord.id);
            if (alreadyUsed) {
                return c.json({ error: "You have already redeemed this code" }, 409);
            }

            await CodeHistoryModel.createCodeHistory(codeRecord.id, userId);
            await CodeModel.incrementUsageCount(codeRecord.id);
            await UserModel.updateUser(userId, codeRecord.type, (await UserModel.selectUser(userId))[codeRecord.type] + codeRecord.amount);

            server.log("USER", `User ${userId} redeemed code ${code} (+${codeRecord.amount} ${codeRecord.type})`);
            return c.json({
                message: `Code redeemed successfully. +${codeRecord.amount} ${codeRecord.type}`,
                amount: codeRecord.amount,
                type: codeRecord.type,
            });
        } catch (error) {
            server.error("USER", "Redeem code error:");
            console.error(error);
            return c.json({ error: "Failed to redeem code" }, 500);
        }
    });

    // POST /user/payment — submit a payment/deposit
    app.post("/payment", async (c) => {
        try {
            const payload = c.get("jwtPayload");
            const userId = payload.userId;
            const body = (await c.req.json()) as { receiptRef: string; amount: number; currencyType: "cash" | "coins" };

            const { receiptRef, amount, currencyType } = body;

            if (!receiptRef || !amount || !currencyType) {
                return c.json({ error: "Missing required fields" }, 400);
            }

            if (!["cash", "coins"].includes(currencyType)) {
                return c.json({ error: "Invalid currencyType. Must be 'cash' or 'coins'" }, 400);
            }

            if (amount <= 0) {
                return c.json({ error: "Amount must be greater than 0" }, 400);
            }

            const existing = await PaymentModel.selectPaymentByReceipt(receiptRef);
            if (existing) {
                return c.json({ error: "Receipt reference already used" }, 409);
            }

            const paymentId = await PaymentModel.createPayment(userId, receiptRef, amount, currencyType);

            server.log("USER", `User ${userId} submitted payment ${receiptRef} for ${amount} ${currencyType}`);
            return c.json({ message: "Payment submitted successfully", paymentId }, 201);
        } catch (error) {
            server.error("USER", "Payment error:");
            console.error(error);
            return c.json({ error: "Failed to submit payment" }, 500);
        }
    });

    // GET /user/payment — get current user's payment history
    app.get("/payment", async (c) => {
        try {
            const payload = c.get("jwtPayload");
            const userId = payload.userId;

            const payments = await PaymentModel.selectPaymentsByUserId(userId);
            return c.json(payments);
        } catch (error) {
            server.error("USER", "Get payments error:");
            console.error(error);
            return c.json({ error: "Failed to get payments" }, 500);
        }
    });

    // GET /user/history — get current user's game history
    app.get("/history", async (c) => {
        try {
            const payload = c.get("jwtPayload");
            const userId = payload.userId;

            const history = await GameHistoryModel.selectGameHistoryByUserId(userId);
            return c.json(history);
        } catch (error) {
            server.error("USER", "Get game history error:");
            console.error(error);
            return c.json({ error: "Failed to get game history" }, 500);
        }
    });

    return app;
};
