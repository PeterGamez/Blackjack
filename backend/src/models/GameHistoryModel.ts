import { Pool, ResultSetHeader } from "mysql2/promise";
import { GameHistoryInterface } from "../interfaces/Database";

export default class GameHistoryModel {
    private static table: string;
    private static DB: Pool;

    public static init(table: string, DB: Pool) {
        this.table = table;
        this.DB = DB;
    }

    public static async createGameHistory(userId1: number, userId2: number, gameResult: string, mode: string, bet: number, reward: number): Promise<number> {
        const sql = `INSERT INTO ${this.table} (userId1, userId2, result, mode, bet, reward) VALUES (?, ?, ?, ?, ?, ?)`;
        const connection = await this.DB.getConnection();
        try {
            const [result] = await connection.execute<ResultSetHeader>(sql, [userId1, userId2, gameResult, mode, bet, reward]);
            return result.insertId;
        } finally {
            connection.release();
        }
    }

    public static async selectAllGameHistoryByUserId(userId: number): Promise<GameHistoryInterface[]> {
        const sql = `SELECT * FROM ${this.table} WHERE userId1 = ? OR userId2 = ?`;
        const connection = await this.DB.getConnection();
        try {
            const [rows] = await connection.execute(sql, [userId, userId]);
            return rows as GameHistoryInterface[];
        } finally {
            connection.release();
        }
    }
}
