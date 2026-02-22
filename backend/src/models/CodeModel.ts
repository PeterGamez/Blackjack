import { Pool, ResultSetHeader } from "mysql2/promise";
import { CodeInterface } from "../interfaces/Database";

export default class CodeModel {
    private static table: string;
    private static DB: Pool;

    public static init(table: string, DB: Pool) {
        this.table = table;
        this.DB = DB;
    }

    public static async createCode(code: string, amount: number, type: CodeInterface["type"]): Promise<number> {
        const sql = `INSERT INTO ${this.table} (code, amount, type) VALUES (?, ?, ?)`;
        const connection = await this.DB.getConnection();
        try {
            const [result] = await connection.execute<ResultSetHeader>(sql, [code, amount, type]);
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
            return rows[0];
        } finally {
            connection.release();
        }
    }

    public static async selectAllCodes(): Promise<CodeInterface[]> {
        const sql = `SELECT * FROM ${this.table} ORDER BY createdAt DESC`;
        const connection = await this.DB.getConnection();
        try {
            const [rows] = await connection.execute(sql);
            return rows as CodeInterface[];
        } finally {
            connection.release();
        }
    }

    public static async selectCodeById(id: number): Promise<CodeInterface | null> {
        const sql = `SELECT * FROM ${this.table} WHERE id = ?`;
        const connection = await this.DB.getConnection();
        try {
            const [rows] = await connection.execute(sql, [id]);
            return rows[0] ?? null;
        } finally {
            connection.release();
        }
    }

    public static async updateCode(id: number, data: Partial<Pick<CodeInterface, "code" | "amount" | "type" | "isActive" | "expiredDate">>): Promise<void> {
        const fields = Object.keys(data).map((k) => `${k} = ?`).join(", ");
        const values = [...Object.values(data), id];
        const sql = `UPDATE ${this.table} SET ${fields} WHERE id = ?`;
        const connection = await this.DB.getConnection();
        try {
            await connection.execute(sql, values);
        } finally {
            connection.release();
        }
    }

    public static async incrementUsageCount(id: number): Promise<void> {
        const sql = `UPDATE ${this.table} SET usageCount = usageCount + 1 WHERE id = ?`;
        const connection = await this.DB.getConnection();
        try {
            await connection.execute(sql, [id]);
        } finally {
            connection.release();
        }
    }
}
