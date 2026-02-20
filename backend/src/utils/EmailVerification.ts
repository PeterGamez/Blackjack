import crypto from "crypto";
import RedisService from "../services/RedisService";
import nodemailer from "nodemailer";
import { EmailVerificationData } from "../interfaces/Cache";
import Client from "./Client";

export class EmailVerification {
    private readonly PREFIX = "email:verify:";
    private readonly TTL = 24 * 60 * 60;

    private client: Client;

    private transporter: nodemailer.Transporter;

    private html(verificationUrl: string): string {
        return `
            <h1>Email Verification</h1>
            <p>Thank you for registering! Please click the link below to verify your email address:</p>
            <a href="${verificationUrl}">Verify Email</a>
            <p>${verificationUrl}</p>
            <p>This link will expire in ${this.client.config.verifyEmail.expiresIn} hours.</p>
            <p>If you did not create an account, please ignore this email.</p>
        `;
    }

    public constructor(client: Client) {
        this.client = client;

        this.transporter = nodemailer.createTransport({
            host: client.config.email.host,
            port: client.config.email.port,
            secure: client.config.email.secure,
            auth: {
                user: client.config.email.auth.user,
                pass: client.config.email.auth.pass,
            },
        });
    }

    public async sendVerificationEmail(userId: number, email: string): Promise<void> {
        const verificationToken = await this.generate(userId, email);
        const verificationUrl = `${this.client.config.site.url}/auth/verify?token=${verificationToken}`;

        await this.transporter.sendMail({
            from: this.client.config.email.from,
            to: email,
            subject: "Verify Your Email - Blackjack",
            html: this.html(verificationUrl),
        });
    }

    public async verify(token: string): Promise<{ userId: number; email: string } | null> {
        const key = `${this.PREFIX}${token}`;

        const value = await RedisService.hgetall<EmailVerificationData>(key);
        if (!value) {
            return null;
        }

        await RedisService.del(key);

        return { userId: parseInt(value.userId), email: value.email };
    }

    private async generate(userId: number, email: string): Promise<string> {
        const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        const length = chars.length;

        const token = Array.from(crypto.randomBytes(32))
            .map((b) => chars[b % length])
            .join("");

        await RedisService.hmset<EmailVerificationData>(`${this.PREFIX}${token}`, { userId: userId.toString(), email });
        await RedisService.expire(`${this.PREFIX}${token}`, this.TTL);

        return token;
    }
}
