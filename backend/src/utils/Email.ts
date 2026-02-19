import nodemailer from "nodemailer";
import config from "../config";
import { generateEmailVerificationToken } from "./Token";

const transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
        user: config.email.auth.user,
        pass: config.email.auth.pass,
    },
});

export async function sendVerificationEmail(userId, email: string): Promise<void> {
    const verificationToken = generateEmailVerificationToken(userId, email);
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

    await transporter.sendMail(mailOptions);
}
