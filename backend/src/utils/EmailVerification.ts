import crypto from "crypto";
import RedisService from "../services/RedisService";
import config from "../config";
import nodemailer from "nodemailer";
import { EmailVerificationData } from "../interfaces/Cache";

export class EmailVerification {
    private readonly PREFIX = "email:verify:";
    private readonly TTL = 24 * 60 * 60;

    private transporter: nodemailer.Transporter;

    public constructor(c: typeof config) {
        this.transporter = nodemailer.createTransport({
            host: c.email.host,
            port: c.email.port,
            secure: c.email.secure,
            auth: {
                user: c.email.auth.user,
                pass: c.email.auth.pass,
            },
        });
    }

    public async generate(userId: number, email: string): Promise<string> {
        const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        const length = chars.length;

        const token = Array.from(crypto.randomBytes(32))
            .map((b) => chars[length])
            .join("");

        await RedisService.hmset<EmailVerificationData>(`${this.PREFIX}${token}`, { userId: userId.toString(), email });
        await RedisService.expire(`${this.PREFIX}${token}`, this.TTL);

        return token;
    }

    public async verify(token: string): Promise<{ userId: number; email: string }> {
        const key = `${this.PREFIX}${token}`;

        const value = await RedisService.hgetall<EmailVerificationData>(key);
        if (!value) {
            return null;
        }

        await RedisService.del(key);

        return { userId: parseInt(value.userId), email: value.email };
    }

    public async sendVerificationEmail(userId: number, email: string): Promise<void> {
        const verificationToken = await this.generate(userId, email);
        const verificationUrl = `${config.app.url}/api/auth/verify?token=${verificationToken}`;

        const mailOptions = {
            from: config.email.from,
            to: email,
            subject: "Verify Your Email - Blackjack",
            html: `
            <h1>Email Verification</h1>
            <p>Thank you for registering! Please click the link below to verify your email address:</p>
            <a href="${verificationUrl}">Verify Email</a>
            <p>This link will expire in ${config.verifyEmail.expiresIn} hours.</p>
            <p>If you did not create an account, please ignore this email.</p>
        `,
        };

        await this.transporter.sendMail(mailOptions);
    }
}
