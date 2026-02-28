import { Hono } from "hono";
import Server from "../utils/Server";
import UserModel from "../models/UserModel";

export default (app: Hono, server: Server) => {
    app.post("/register", async (c) => {
        try {
            let body: { username: string; email: string; password: string };
            try {
                body = (await c.req.json()) as { username: string; email: string; password: string };
            } catch {
                return c.json({ error: "Invalid or missing JSON body" }, 400);
            }

            const username = body.username?.trim()?.toLowerCase();
            const email = body.email?.trim()?.toLowerCase();
            const password = body.password?.trim();

            if (!username || !email || !password) {
                return c.json({ error: "Missing required fields" }, 400);
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return c.json({ error: "Invalid email address" }, 400);
            }

            const existingUser = await UserModel.selectUserByUsernameOrEmail(username);
            if (existingUser) {
                return c.json({ error: "Username or email already exists" }, 409);
            }

            const hashedPassword = await server.Password.hash(password);

            const userId = await UserModel.createUser(username, email, hashedPassword);

            try {
                await server.EmailVerification.sendVerificationEmail(userId, email);
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
            let body: { token: string };
            try {
                body = (await c.req.json()) as { token: string };
            } catch {
                return c.json({ error: "Invalid or missing JSON body" }, 400);
            }
            const { token } = body;

            if (!token) {
                return c.json({ error: "Missing verification token" }, 400);
            }

            const payload = await server.EmailVerification.verify(token);
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
            let body: { username: string; password: string };
            try {
                body = (await c.req.json()) as { username: string; password: string };
            } catch {
                return c.json({ error: "Invalid or missing JSON body" }, 400);
            }

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
            let body: { refreshToken: string };
            try {
                body = (await c.req.json()) as { refreshToken: string };
            } catch {
                return c.json({ error: "Invalid or missing JSON body" }, 400);
            }
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

    return app;
};
