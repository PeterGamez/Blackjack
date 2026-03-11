import { Pool, ResultSetHeader } from "mysql2/promise";
import { CodeHistoryInterface } from "../interfaces/Database";
import CodeModel from "./CodeModel";

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

    public static async selectCodeHistoryByCodeAndUserId(code: string, userId: number): Promise<CodeHistoryInterface> {
        const sql = `SELECT ch.* FROM ${this.table} ch JOIN ${CodeModel.getTable()} c ON ch.codeId = c.id WHERE c.code = ? AND ch.userId = ?`;
        const connection = await this.DB.getConnection();
        try {
            const [rows] = await connection.execute(sql, [code, userId]);
            return rows[0];
        } finally {
            connection.release();
        }
    }
}
