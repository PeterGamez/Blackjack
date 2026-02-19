export function generateEmailVerificationToken(userId: number, email: string): string {
    return "";
}

export async function verifyEmailToken(token: string): Promise<{ userId: number; email: string }> {
    return { userId: 0, email: "" };
}
