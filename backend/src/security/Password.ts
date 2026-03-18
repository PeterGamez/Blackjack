const SALT_ROUNDS = 12;

export class Password {
    public async hash(password: string): Promise<string> {
        return await Bun.password.hash(password, {
            algorithm: "bcrypt",
            cost: SALT_ROUNDS,
        });
    }

    public async verify(password: string, hash: string): Promise<boolean> {
        return await Bun.password.verify(password, hash);
    }
}
