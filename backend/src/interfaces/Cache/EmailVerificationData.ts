export interface EmailVerificationData extends Record<string, string> {
    userId: string;
    email: string;
}
