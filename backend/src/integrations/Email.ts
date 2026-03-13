import crypto from "node:crypto";

import nodemailer from "nodemailer";

import type Server from "../Server";
import type { EmailVerificationData } from "../interfaces/Cache";
import RedisService from "../services/RedisService";

export class Email {
    private readonly PREFIX_VERIFY = "email:verify:";
    private readonly PREFIX_RESET = "email:reset:";

    private server: Server;

    private transporter: nodemailer.Transporter;

    private htmlVerifyEmail(verificationUrl: string): string {
        return `
            <h1>Email Verification</h1>
            <p>Thank you for registering! Please click the link below to verify your email address:</p>
            <a href="${verificationUrl}">${verificationUrl}</a>
            <p>This link will expire in ${this.server.config.email.verifyExpiresIn} minutes.</p>
            <p>If you did not create an account, please ignore this email.</p>
        `;
    }

    private htmlResetPasswordEmail(resetUrl: string): string {
        return `
            <h1>Password Reset</h1>
            <p>You requested a password reset. Please click the link below to reset your password:</p>
            <a href="${resetUrl}">${resetUrl}</a>
            <p>This link will expire in ${this.server.config.email.resetPasswordExpiresIn} minutes.</p>
            <p>If you did not request a password reset, please ignore this email.</p>
        `;
    }

    public constructor(server: Server) {
        this.server = server;

        this.transporter = nodemailer.createTransport({
            host: server.config.email.host,
            port: server.config.email.port,
            secure: server.config.email.secure,
            auth: {
                user: server.config.email.auth.user,
                pass: server.config.email.auth.pass,
            },
        });
    }

    public async sendVerificationEmail(userId: number, email: string): Promise<void> {
        const verificationToken = await this.generate();

        await RedisService.hmset<EmailVerificationData>(`${this.PREFIX_VERIFY}${verificationToken}`, { userId: userId.toString(), email });
        await RedisService.expire(`${this.PREFIX_VERIFY}${verificationToken}`, this.server.config.email.verifyExpiresIn * 60 * 60);

        const verificationUrl = `${this.server.config.site.url}/auth/verify?token=${verificationToken}`;

        await this.transporter.sendMail({
            from: this.server.config.email.from,
            to: email,
            subject: "Verify Your Email - Blackjack",
            html: this.htmlVerifyEmail(verificationUrl),
        });
    }

    public async verifyEmail(token: string): Promise<{ userId: number; email: string }> {
        const key = `${this.PREFIX_VERIFY}${token}`;

        const value = await RedisService.hgetall<EmailVerificationData>(key);
        if (!value) {
            return null;
        }

        await RedisService.del(key);

        return { userId: parseInt(value.userId), email: value.email };
    }

    public async sendPasswordResetEmail(userId: number, email: string): Promise<void> {
        const resetToken = await this.generate();

        await RedisService.hmset<EmailVerificationData>(`${this.PREFIX_RESET}${resetToken}`, { userId: userId.toString(), email });
        await RedisService.expire(`${this.PREFIX_RESET}${resetToken}`, this.server.config.email.resetPasswordExpiresIn * 60);

        const resetUrl = `${this.server.config.site.url}/auth/reset-password?token=${resetToken}`;

        await this.transporter.sendMail({
            from: this.server.config.email.from,
            to: email,
            subject: "Password Reset - Blackjack",
            html: this.htmlResetPasswordEmail(resetUrl),
        });
    }

    public async verifyPasswordReset(token: string): Promise<{ userId: number; email: string }> {
        const key = `${this.PREFIX_RESET}${token}`;

        const value = await RedisService.hgetall<EmailVerificationData>(key);
        if (!value) {
            return null;
        }

        await RedisService.del(key);

        return { userId: parseInt(value.userId), email: value.email };
    }

    private async generate(): Promise<string> {
        const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        const length = chars.length;

        const token = Array.from(crypto.randomBytes(32))
            .map((b) => chars[b % length])
            .join("");

        return token;
    }
}
