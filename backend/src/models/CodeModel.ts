import { Pool, ResultSetHeader } from "mysql2/promise";
import { CodeInterface } from "../interfaces/Database";

export default class CodeModel {
    private static table: string;
    private static DB: Pool;

    public static init(table: string, DB: Pool) {
        this.table = table;
        this.DB = DB;
    }

    public static async createCode(code: string, amount: number, type: CodeInterface["type"], maxUses: number, expiredDate: Date): Promise<number> {
        const sql = `INSERT INTO ${this.table} (code, amount, type, maxUses, expiredDate) VALUES (?, ?, ?, ?, ?)`;
        const connection = await this.DB.getConnection();
        try {
            const [result] = await connection.execute<ResultSetHeader>(sql, [code, amount, type, maxUses, expiredDate]);
            return result.insertId;
        } finally {
            connection.release();
        }
    }

    public static async selectAllCodes(): Promise<CodeInterface[]> {
        const sql = `SELECT * FROM ${this.table}`;
        const connection = await this.DB.getConnection();
        try {
            const [rows] = await connection.execute(sql);
            return rows as CodeInterface[];
        } finally {
            connection.release();
        }
    }

    public static async selectCodeByCode(code: string): Promise<CodeInterface> {
        const sql = `SELECT * FROM ${this.table} WHERE code = ?`;
        const connection = await this.DB.getConnection();
        try {
            const [rows] = await connection.execute(sql, [code]);
            return rows[0];
        } finally {
            connection.release();
        }
    }
}
