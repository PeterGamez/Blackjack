import { Pool, ResultSetHeader } from "mysql2/promise";
import { UserSkinInterface } from "../interfaces/Database";

export default class UserSkinModel {
    private static table: string;
    private static DB: Pool;

    public static init(table: string, DB: Pool) {
        this.table = table;
        this.DB = DB;
    }

    public static async createUserSkin(userId: number, skinId: number): Promise<number> {
        const sql = `INSERT INTO ${this.table} (userId, skinId) VALUES (?, ?)`;
        const connection = await this.DB.getConnection();
        try {
            const [result] = await connection.execute<ResultSetHeader>(sql, [userId, skinId]);
            return result.insertId;
        } finally {
            connection.release();
        }
    }

    public static async selectUserSkinByUserId(userId: number): Promise<UserSkinInterface[]> {
        const sql = `SELECT * FROM ${this.table} WHERE userId = ?`;
        const connection = await this.DB.getConnection();
        try {
            const [rows] = await connection.execute(sql, [userId]);
            return rows as UserSkinInterface[];
        } finally {
            connection.release();
        }
    }
}
