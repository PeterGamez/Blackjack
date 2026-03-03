import { Hono } from "hono";
import Server from "../utils/Server";
import UserModel from "../models/UserModel";

export default (app: Hono, server: Server) => {
    app.post("/register", async (c) => {
        try {
            const body = (await c.req.json()) as { username: string; email: string; password: string };

            const username = body.username?.trim()?.toLowerCase();
            const email = body.email?.trim()?.toLowerCase();
            const password = body.password?.trim();

            if (!username || !email || !password) {
                return c.json({ error: "Missing required fields" }, 400);
            }

            const existingUser = await UserModel.selectUserByUsernameOrEmail(username);
            if (existingUser) {
                return c.json({ error: "Username or email already exists" }, 409);
            }

            const hashedPassword = await server.Password.hash(password);

            const userId = await UserModel.createUser(username, email, hashedPassword);

            try {
                await server.Email.sendVerificationEmail(userId, email);
            } catch (emailError) {
                server.error("EMAIL", `Failed to send verification email: ${emailError}`);
            }

            server.log("AUTH", `User registered: ${email}`);

            return c.json(
                {
                    message: "Registration successful. Please check your email to verify your account.",
                },
                201
            );
        } catch (error) {
            server.error("AUTH", "Registration error: ");
            console.error(error);
            return c.json({ error: "Registration failed" }, 500);
        }
    });

    app.post("/verify", async (c) => {
        try {
            const body = (await c.req.json()) as { token: string };
            const { token } = body;

            if (!token) {
                return c.json({ error: "Missing verification token" }, 400);
            }

            const payload = await server.Email.verifyEmail(token);
            if (!payload) {
                return c.json({ error: "Invalid or expired token" }, 400);
            }
            const { email } = payload;

            if (!email) {
                return c.json({ error: "Invalid token" }, 400);
            }

            const success = await UserModel.verifyEmail(email);

            if (!success) {
                return c.json({ error: "User not found" }, 404);
            }

            server.log("AUTH", `Email verified: ${email}`);

            return c.json({ message: "Email verified successfully" });
        } catch (error) {
            server.error("AUTH", "Email verification error: ");
            console.error(error);
            return c.json({ error: "Invalid or expired token" }, 400);
        }
    });

    app.post("/login", async (c) => {
        try {
            const body = (await c.req.json()) as { username: string; password: string };

            const username = body.username?.trim()?.toLowerCase();
            const password = body.password?.trim();

            if (!username || !password) {
                return c.json({ error: "Missing username/email or password" }, 400);
            }

            const user = await UserModel.selectUserByUsernameOrEmail(username);

            if (!user) {
                return c.json({ error: "Username/email or password is incorrect" }, 401);
            }

            const isValidPassword = await server.Password.compare(password, user.password);

            if (!isValidPassword) {
                return c.json({ error: "Username/email or password is incorrect" }, 401);
            }

            if (!user.isVerified) {
                return c.json({ error: "Please verify your email before logging in" }, 403);
            }

            const accessToken = server.JWT.generateAccessToken(user);
            const refreshToken = server.JWT.generateRefreshToken(user);

            server.log("AUTH", `User logged in: ${user.id}`);

            return c.json({
                message: "Login successful",
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                },
            });
        } catch (error) {
            server.error("AUTH", "Login error: ");
            console.error(error);
            return c.json({ error: "Login failed" }, 500);
        }
    });

    app.post("/refresh", async (c) => {
        try {
            const body = (await c.req.json()) as { refreshToken: string };
            const { refreshToken } = body;

            if (!refreshToken) {
                return c.json({ error: "Missing refresh token" }, 400);
            }

            const payload = server.JWT.verifyToken(refreshToken);
            if (!payload) {
                return c.json({ error: "Invalid or expired token" }, 400);
            }

            const user = await UserModel.selectUser(payload.userId);

            if (!user) {
                return c.json({ error: "User not found" }, 401);
            }

            if (!user.isVerified) {
                return c.json({ error: "Account not verified" }, 403);
            }

            const newAccessToken = server.JWT.generateAccessToken(user);
            const newRefreshToken = server.JWT.generateRefreshToken(user);

            server.log("AUTH", `Tokens refreshed for: ${user.id}`);

            return c.json({
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
            });
        } catch (error) {
            server.error("AUTH", "Token refresh error: ");
            console.error(error);
            return c.json({ error: "Invalid or expired refresh token" }, 401);
        }
    });

    app.post("/reset-password", async (c) => {
        try {
            let body: { email: string };
            try {
                body = await c.req.json<typeof body>();
            } catch {
                return c.json({ error: "Invalid or missing JSON body" }, 400);
            }
            const { email } = body;

            if (!email) {
                return c.json({ error: "Missing email" }, 400);
            }

            const user = await UserModel.selectUserByUsernameOrEmail(email);
            if (!user) {
                return c.json({ error: "Email not found" }, 404);
            }

            try {
                await server.Email.sendPasswordResetEmail(user.id, email);
            } catch (emailError) {
                server.error("EMAIL", `Failed to send password reset email: ${emailError}`);
                return c.json({ error: "Failed to send password reset email" }, 500);
            }

            server.log("AUTH", `Password reset requested for: ${email}`);

            return c.json({ message: "Password reset email sent" });
        } catch (error) {
            server.error("AUTH", "Password reset error: ");
            console.error(error);
            return c.json({ error: "Password reset failed" }, 500);
        }
    });

    app.post("/reset-password/verify", async (c) => {
        try {
            let body: { token: string; newPassword: string };
            try {
                body = await c.req.json<typeof body>();
            } catch {
                return c.json({ error: "Invalid or missing JSON body" }, 400);
            }
            const { token, newPassword } = body;

            if (!token || !newPassword) {
                return c.json({ error: "Missing token or new password" }, 400);
            }

            const payload = await server.Email.verifyPasswordReset(token);
            if (!payload) {
                return c.json({ error: "Invalid or expired token" }, 400);
            }
            const { email } = payload;

            if (!email) {
                return c.json({ error: "Invalid token" }, 400);
            }

            const hashedPassword = await server.Password.hash(newPassword);

            await UserModel.updateUser(payload.userId, "password", hashedPassword);

            server.log("AUTH", `Password reset for: ${email}`);

            return c.json({ message: "Password reset successful" });
        } catch (error) {
            server.error("AUTH", "Password reset verification error: ");
            console.error(error);
            return c.json({ error: "Invalid or expired token" }, 400);
        }
    });

    return app;
};
