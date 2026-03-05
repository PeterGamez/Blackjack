import { Pool, ResultSetHeader } from "mysql2/promise";
import { CodeInterface } from "../interfaces/Database";

export default class CodeModel {
    private static table: string;
    private static DB: Pool;

    public static init(table: string, DB: Pool) {
        this.table = table;
        this.DB = DB;
    }

    public static async createCode(code: string, amount: number, type: CodeInterface["type"], maxUses: number = 1, expiredDate?: Date): Promise<number> {
        const sql = `INSERT INTO ${this.table} (code, amount, type, maxUses, isActive, expiredDate) VALUES (?, ?, ?, ?, ?, ?)`;
        const connection = await this.DB.getConnection();
        try {
            const [result] = await connection.execute<ResultSetHeader>(sql, [
                code,
                amount,
                type,
                maxUses,
                true,
                expiredDate || null,
            ]);
            return result.insertId;
        } finally {
            connection.release();
        }
    }

    public static async selectCodeByCode(code: string): Promise<CodeInterface | null> {
        const sql = `SELECT * FROM ${this.table} WHERE code = ?`;
        const connection = await this.DB.getConnection();
        try {
            const [rows] = await connection.execute(sql, [code]);
            const result = rows as CodeInterface[];
            return result.length > 0 ? result[0] : null;
        } finally {
            connection.release();
        }
    }

    public static async getCodeUsageCount(codeId: number): Promise<number> {
        const sql = `SELECT COUNT(*) as count FROM codeHistory WHERE codeId = ?`;
        const connection = await this.DB.getConnection();
        try {
            const [rows] = await connection.execute(sql, [codeId]);
            const result = rows as { count: number }[];
            return result[0].count;
        } finally {
            connection.release();
        }
    }

    public static async updateCodeStatus(codeId: number, isActive: boolean): Promise<void> {
        const sql = `UPDATE ${this.table} SET isActive = ? WHERE id = ?`;
        const connection = await this.DB.getConnection();
        try {
            await connection.execute(sql, [isActive, codeId]);
        } finally {
            connection.release();
        }
    }
}
