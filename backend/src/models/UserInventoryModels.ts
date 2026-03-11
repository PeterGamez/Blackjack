import { Pool, ResultSetHeader } from "mysql2/promise";
import { UserInventoryInterface } from "../interfaces/Database";

export default class UserInventoryModel {
    private static table: string;
    private static DB: Pool;

    public static init(table: string, DB: Pool) {
        this.table = table;
        this.DB = DB;
    }

    public static async createUserInventory(userId: number, productId: number): Promise<number> {
        const sql = `INSERT INTO ${this.table} (userId, productId) VALUES (?, ?)`;
        const connection = await this.DB.getConnection();
        try {
            const [result] = await connection.execute<ResultSetHeader>(sql, [userId, productId]);
            return result.insertId;
        } finally {
            connection.release();
        }
    }

    public static async selectUserInventoryByUserId(userId: number): Promise<UserInventoryInterface[]> {
        const sql = `SELECT * FROM ${this.table} WHERE userId = ?`;
        const connection = await this.DB.getConnection();
        try {
            const [rows] = await connection.execute(sql, [userId]);
            return rows as UserInventoryInterface[];
        } finally {
            connection.release();
        }
    }
}
