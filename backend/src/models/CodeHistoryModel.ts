import type { Pool, ResultSetHeader } from "mysql2/promise";

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

    public static async selectCodeHistoryCountByCodeId(codeId: number): Promise<number> {
        const sql = `SELECT COUNT(*) as count FROM ${this.table} WHERE codeId = ?`;
        const connection = await this.DB.getConnection();
        try {
            const [rows] = await connection.execute(sql, [codeId]);
            return rows[0].count;
        } finally {
            connection.release();
        }
    }

    public static async isRedeemCodeHistoryByCodeIdAndUserId(codeId: number, userId: number): Promise<boolean> {
        const sql = `SELECT COUNT(*) as count FROM ${this.table} WHERE codeId = ? AND userId = ?`;
        const connection = await this.DB.getConnection();
        try {
            const [rows] = await connection.execute(sql, [codeId, userId]);
            return rows[0].count > 0;
        } finally {
            connection.release();
        }
    }
}
