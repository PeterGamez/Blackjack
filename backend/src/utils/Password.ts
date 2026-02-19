import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export class Password {
    public async hash(password: string): Promise<string> {
        return bcrypt.hash(password, SALT_ROUNDS);
    }

    public async compare(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }
}
