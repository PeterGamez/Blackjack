import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import Server from "../utils/Server";
import CodeModel from "../models/CodeModel";
import UserModel from "../models/UserModel";

const adminMiddleware = (server: Server) =>
    createMiddleware(async (c, next) => {
        const payload = c.get("jwtPayload");
        const user = await UserModel.selectUser(payload.userId);

        if (!user || user.role !== "admin") {
            return c.json({ error: "Forbidden" }, 403);
        }

        await next();
    });

export default (app: Hono, server: Server) => {
    app.use("/*", adminMiddleware(server));

    // GET /admin/codes — list all codes
    app.get("/codes", async (c) => {
        try {
            const codes = await CodeModel.selectAllCodes();
            return c.json(codes);
        } catch (error) {
            server.error("ADMIN", "Get codes error:");
            console.error(error);
            return c.json({ error: "Failed to get codes" }, 500);
        }
    });

    // POST /admin/code — create a new code
    app.post("/code", async (c) => {
        try {
            const body = (await c.req.json()) as {
                code: string;
                amount: number;
                type: "cash" | "coins";
            };

            const { code, amount, type } = body;

            if (!code || !amount || !type) {
                return c.json({ error: "Missing required fields: code, amount, type" }, 400);
            }

            if (!["cash", "coins"].includes(type)) {
                return c.json({ error: "Invalid type. Must be 'cash' or 'coins'" }, 400);
            }

            if (amount <= 0) {
                return c.json({ error: "Amount must be greater than 0" }, 400);
            }

            const existing = await CodeModel.selectCodeByCode(code.trim());
            if (existing) {
                return c.json({ error: "Code already exists" }, 409);
            }

            const codeId = await CodeModel.createCode(code.trim(), amount, type);

            server.log("ADMIN", `Code created: ${code} (${amount} ${type})`);
            return c.json({ message: "Code created successfully", codeId }, 201);
        } catch (error) {
            server.error("ADMIN", "Create code error:");
            console.error(error);
            return c.json({ error: "Failed to create code" }, 500);
        }
    });

    // PATCH /admin/code/:id — update a code (activate/deactivate, change amount, etc.)
    app.patch("/code/:id", async (c) => {
        try {
            const id = parseInt(c.req.param("id"));
            if (isNaN(id)) {
                return c.json({ error: "Invalid code ID" }, 400);
            }

            const existing = await CodeModel.selectCodeById(id);
            if (!existing) {
                return c.json({ error: "Code not found" }, 404);
            }

            const body = (await c.req.json()) as {
                code?: string;
                amount?: number;
                type?: "cash" | "coins";
                isActive?: boolean;
                expiredDate?: string;
            };

            const { code, amount, type, isActive, expiredDate } = body;

            const updates: Parameters<typeof CodeModel.updateCode>[1] = {};
            if (code !== undefined) updates.code = code.trim();
            if (amount !== undefined) updates.amount = amount;
            if (type !== undefined) updates.type = type;
            if (isActive !== undefined) updates.isActive = isActive;
            if (expiredDate !== undefined) updates.expiredDate = new Date(expiredDate);

            if (Object.keys(updates).length === 0) {
                return c.json({ error: "No fields to update" }, 400);
            }

            await CodeModel.updateCode(id, updates);

            server.log("ADMIN", `Code ${id} updated`);
            return c.json({ message: "Code updated successfully" });
        } catch (error) {
            server.error("ADMIN", "Update code error:");
            console.error(error);
            return c.json({ error: "Failed to update code" }, 500);
        }
    });

    // GET /admin/leaderboard — top players (admin view with full user data)
    app.get("/leaderboard", async (c) => {
        try {
            const sortBy = (c.req.query("sortBy") as "cash" | "coins") || "cash";
            const limit = parseInt(c.req.query("limit") || "10");

            if (!["cash", "coins"].includes(sortBy)) {
                return c.json({ error: "Invalid sortBy. Must be 'cash' or 'coins'" }, 400);
            }

            const users = await UserModel.selectAllUsersOrderBy(sortBy, limit);
            return c.json(users);
        } catch (error) {
            server.error("ADMIN", "Leaderboard error:");
            console.error(error);
            return c.json({ error: "Failed to get leaderboard" }, 500);
        }
    });

    return app;
};
