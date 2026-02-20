import { Pool, ResultSetHeader } from "mysql2/promise";
import { CodeHistoryInterface } from "../interfaces/Database";

export default class CodeHistoryModel {
    private static table: string;
    private static DB: Pool;

    public static init(table: string, DB: Pool) {
        this.table = table;
        this.DB = DB;
    }

    public static async createCodeHistory(codeId: number, userId: number): Promise<number> {
        const sql = `INSERT INTO ${this.table} (codeId, userId) VALUES (?, ?)`;
        const connection = await this.DB.getConnection();
        try {
            const [result] = await connection.execute<ResultSetHeader>(sql, [codeId, userId]);
            return result.insertId;
        } finally {
            connection.release();
        }
    }

    public static async getCodeHistoryByUserId(userId: number): Promise<CodeHistoryInterface[]> {
        const sql = `SELECT * FROM ${this.table} WHERE userId = ?`;
        const connection = await this.DB.getConnection();
        try {
            const [rows] = await connection.execute(sql, [userId]);
            return rows as CodeHistoryInterface[];
        } finally {
            connection.release();
        }
    }
}
