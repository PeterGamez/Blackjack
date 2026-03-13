import { Hono } from "hono";
import type { BlankEnv, BlankSchema } from "hono/types";

import UserModel from "../models/UserModel";
import type { RouteInterface } from "../interfaces/Route";
import type Server from "../Server";

export default class AuthRoute implements RouteInterface {
    private readonly basePath = "/auth";
    private app: Hono<BlankEnv, BlankSchema, typeof this.basePath>;
    private server: Server;

    private static readonly USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
    private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    constructor(server: Server) {
        this.app = new Hono();
        this.server = server;

        this.registerRoutes();
    }

    private registerRoutes() {
        this.app.post("/register", async (c) => {
            try {
                let body: { username: string; email: string; password: string };
                try {
                    body = await c.req.json<typeof body>();
                } catch {
                    return c.json({ error: "Invalid or missing JSON body" }, 400);
                }

                let { username, email, password } = body;

                username = username?.trim()?.toLowerCase();
                email = email?.trim()?.toLowerCase();
                password = password?.trim();

                if (!username || !email || !password) {
                    return c.json({ error: "Missing required fields" }, 400);
                }

                if (!AuthRoute.USERNAME_REGEX.test(username)) {
                    return c.json({ error: "Username can only contain letters, numbers, and underscores" }, 400);
                }

                if (!AuthRoute.EMAIL_REGEX.test(email)) {
                    return c.json({ error: "Invalid email address" }, 400);
                }

                const [existingUser, hashedPassword] = await Promise.all([UserModel.selectUserExistsByUsernameOrEmail(username, email), this.server.Password.hash(password)]);
                if (existingUser) {
                    return c.json({ error: "Username or email already exists" }, 409);
                }

                const userId = await UserModel.createUser(username, email, hashedPassword);

                try {
                    await this.server.Email.sendVerificationEmail(userId, email);
                } catch (emailError) {
                    this.server.error("EMAIL", `Failed to send verification email: ${emailError}`);
                    await UserModel.deleteUser(userId);
                    return c.json({ error: "Registration failed: Unable to send verification email" }, 500);
                }

                this.server.log("AUTH", `User registered: ${email}`);

                return c.json({ message: "Registration successful. Please check your email to verify your account." }, 201);
            } catch (error) {
                this.server.error("AUTH", "Registration error: ");
                console.error(error);
                return c.json({ error: "Registration failed" }, 500);
            }
        });

        this.app.post("/verify", async (c) => {
            try {
                let body: { token: string };
                try {
                    body = await c.req.json<typeof body>();
                } catch {
                    return c.json({ error: "Invalid or missing JSON body" }, 400);
                }

                const { token } = body;

                if (!token) {
                    return c.json({ error: "Missing verification token" }, 400);
                }

                const payload = await this.server.Email.verifyEmail(token);
                if (!payload) {
                    return c.json({ error: "Invalid or expired token" }, 400);
                }

                const { email } = payload;

                if (!email) {
                    return c.json({ error: "Invalid token" }, 400);
                }

                const user = await UserModel.selectUserByUsernameOrEmail(email);
                if (!user) {
                    return c.json({ error: "User not found" }, 404);
                }
                await UserModel.updateUser(user.id, "isVerified", true);

                this.server.log("AUTH", `Email verified: ${email}`);

                return c.json({ message: "Email verified successfully" });
            } catch (error) {
                this.server.error("AUTH", "Email verification error: ");
                console.error(error);
                return c.json({ error: "Invalid or expired token" }, 400);
            }
        });

        this.app.post("/login", async (c) => {
            try {
                let body: { username: string; password: string };
                try {
                    body = await c.req.json<typeof body>();
                } catch {
                    return c.json({ error: "Invalid or missing JSON body" }, 400);
                }

                let { username, password } = body;

                username = username?.trim()?.toLowerCase();
                password = password?.trim();

                if (!username || !password) {
                    return c.json({ error: "Missing username/email or password" }, 400);
                }

                const user = await UserModel.selectUserByUsernameOrEmail(username);
                if (!user) {
                    return c.json({ error: "Username/email or password is incorrect" }, 401);
                }

                const isValidPassword = await this.server.Password.compare(password, user.password);
                if (!isValidPassword) {
                    return c.json({ error: "Username/email or password is incorrect" }, 401);
                }

                if (!user.isVerified) {
                    return c.json({ error: "Please verify your email before logging in" }, 403);
                }

                const accessToken = this.server.JWT.generateAccessToken(user);
                const refreshToken = this.server.JWT.generateRefreshToken(user);

                this.server.log("AUTH", `User logged in: ${user.id} | ${user.username} | ${user.email}`);

                return c.json({
                    message: "Login successful",
                    accessToken,
                    refreshToken,
                    user: {
                        username: user.username,
                        email: user.email,
                        role: user.role,
                    },
                });
            } catch (error) {
                this.server.error("AUTH", "Login error: ");
                console.error(error);
                return c.json({ error: "Login failed" }, 500);
            }
        });

        this.app.post("/refresh", async (c) => {
            try {
                let body: { refreshToken: string };
                try {
                    body = await c.req.json<typeof body>();
                } catch {
                    return c.json({ error: "Invalid or missing JSON body" }, 400);
                }

                const { refreshToken } = body;

                if (!refreshToken) {
                    return c.json({ error: "Missing refresh token" }, 400);
                }

                const payload = this.server.JWT.verifyToken(refreshToken);
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

                const newAccessToken = this.server.JWT.generateAccessToken(user);
                const newRefreshToken = this.server.JWT.generateRefreshToken(user);

                this.server.log("AUTH", `Tokens refreshed for: ${user.id}`);

                return c.json({
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken,
                });
            } catch (error) {
                this.server.error("AUTH", "Token refresh error: ");
                console.error(error);
                return c.json({ error: "Invalid or expired refresh token" }, 401);
            }
        });

        this.app.post("/reset-password", async (c) => {
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
                if (user) {
                    if (!user.isVerified) {
                        return c.json({ error: "Account not verified" }, 403);
                    }

                    try {
                        await this.server.Email.sendPasswordResetEmail(user.id, email);
                    } catch (emailError) {
                        this.server.error("EMAIL", `Failed to send password reset email: ${emailError}`);
                        return c.json({ error: "Failed to send password reset email" }, 500);
                    }
                }

                this.server.log("AUTH", `Password reset requested for: ${email}`);

                return c.json({ message: "Password reset email sent" });
            } catch (error) {
                this.server.error("AUTH", "Password reset error: ");
                console.error(error);
                return c.json({ error: "Password reset failed" }, 500);
            }
        });

        this.app.post("/reset-password/verify", async (c) => {
            try {
                let body: { token: string; password: string };
                try {
                    body = await c.req.json<typeof body>();
                } catch {
                    return c.json({ error: "Invalid or missing JSON body" }, 400);
                }

                const { token, password } = body;

                if (!token || !password) {
                    return c.json({ error: "Missing token or password" }, 400);
                }

                const payload = await this.server.Email.verifyPasswordReset(token);
                if (!payload) {
                    return c.json({ error: "Invalid or expired token" }, 400);
                }
                const { email } = payload;

                if (!email) {
                    return c.json({ error: "Invalid token" }, 400);
                }

                const hashedPassword = await this.server.Password.hash(password);

                await UserModel.updateUser(payload.userId, "password", hashedPassword);

                this.server.log("AUTH", `Password reset for: ${email}`);

                return c.json({ message: "Password reset successful" });
            } catch (error) {
                this.server.error("AUTH", "Password reset verification error: ");
                console.error(error);
                return c.json({ error: "Invalid or expired token" }, 400);
            }
        });
    }

    public getApp(app: Hono) {
        app.route(this.basePath, this.app);
        this.server.log("Route", `Registered route: ${this.basePath} [${this.app.routes.length} endpoints]`);
    }
}
