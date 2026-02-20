import { Hono } from "hono";
import Client from "../utils/Client";
import UserModel from "../models/UserModel";

export default (app: Hono, client: Client) => {
    app.post("/register", async (c) => {
        try {
            const body = await c.req.json();
            const { username, email, password } = body;

            if (!username || !email || !password) {
                return c.json({ error: "Missing required fields" }, 400);
            }

            const existingUser = await UserModel.selectUserByUsernameOrEmail(username);
            if (existingUser) {
                return c.json({ error: "Username or email already exists" }, 409);
            }

            const hashedPassword = await client.Password.hash(password);

            const userId = await UserModel.createUser(username, email, hashedPassword);

            try {
                await client.EmailVerification.sendVerificationEmail(userId, email);
            } catch (emailError) {
                client.error("EMAIL", `Failed to send verification email: ${emailError}`);
            }

            client.log("AUTH", `User registered: ${email}`);

            return c.json(
                {
                    message: "Registration successful. Please check your email to verify your account.",
                },
                201
            );
        } catch (error) {
            client.error("AUTH", "Registration error: ");
            console.error(error);
            return c.json({ error: "Registration failed" }, 500);
        }
    });

    app.get("/verify", async (c) => {
        try {
            const token = c.req.query("token");

            if (!token) {
                return c.json({ error: "Missing verification token" }, 400);
            }

            const payload = await client.EmailVerification.verify(token);
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

            client.log("AUTH", `Email verified: ${email}`);

            return c.json({ message: "Email verified successfully" });
        } catch (error) {
            client.error("AUTH", "Email verification error: ");
            console.error(error);
            return c.json({ error: "Invalid or expired token" }, 400);
        }
    });

    app.post("/login", async (c) => {
        try {
            const body = await c.req.json();
            const { email, password } = body;

            if (!email || !password) {
                return c.json({ error: "Missing username/email or password" }, 400);
            }

            const user = await UserModel.selectUserByUsernameOrEmail(email);

            if (!user) {
                return c.json({ error: "Invalid credentials" }, 401);
            }

            if (!user.isVerified) {
                return c.json({ error: "Please verify your email before logging in" }, 403);
            }

            const isValidPassword = await client.Password.compare(password, user.password);

            if (!isValidPassword) {
                return c.json({ error: "Invalid credentials" }, 401);
            }

            const accessToken = client.JWT.generateAccessToken(user);
            const refreshToken = client.JWT.generateRefreshToken(user);

            client.log("AUTH", `User logged in: ${email}`);

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
            client.error("AUTH", "Login error: ");
            console.error(error);
            return c.json({ error: "Login failed" }, 500);
        }
    });

    app.post("/refresh", async (c) => {
        try {
            const body = await c.req.json();
            const { refreshToken } = body;

            if (!refreshToken) {
                return c.json({ error: "Missing refresh token" }, 400);
            }

            const payload = client.JWT.verifyToken(refreshToken);
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

            const newAccessToken = client.JWT.generateAccessToken(user);
            const newRefreshToken = client.JWT.generateRefreshToken(user);

            client.log("AUTH", `Tokens refreshed for: ${user.id}`);

            return c.json({
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
            });
        } catch (error) {
            client.error("AUTH", "Token refresh error: ");
            console.error(error);
            return c.json({ error: "Invalid or expired refresh token" }, 401);
        }
    });

    return app;
};
