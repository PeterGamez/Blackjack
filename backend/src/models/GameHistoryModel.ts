import type { Pool, ResultSetHeader } from "mysql2/promise";

import type { GameHistoryInterface } from "../interfaces/Database";

export default class GameHistoryModel {
    private static table: string;
    private static DB: Pool;

    public static init(table: string, DB: Pool) {
        this.table = table;
        this.DB = DB;
    }

    public static async createGameHistory(
        playerId: number,
        dealerId: number,
        mode: GameHistoryInterface["mode"],
        bet: number,
        playerScore: number,
        dealerScore: number,
        gameResult: GameHistoryInterface["result"],
        playerPayout: number,
        dealerPayout: number
    ): Promise<number> {
        const sql = `INSERT INTO ${this.table}
            (playerId, dealerId, mode, bet, playerScore, dealerScore, result, playerPayout, dealerPayout)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const connection = await this.DB.getConnection();
        try {
            const [result] = await connection.execute<ResultSetHeader>(sql, [playerId, dealerId, mode, bet, playerScore, dealerScore, gameResult, playerPayout, dealerPayout]);
            return result.insertId;
        } finally {
            connection.release();
        }
    }

    public static async selectAllGameHistoryByUserId(userId: number): Promise<GameHistoryInterface[]> {
        const sql = `SELECT * FROM ${this.table} WHERE (playerId = ? OR dealerId = ?) AND deletedAt IS NULL ORDER BY createdAt DESC`;
        const connection = await this.DB.getConnection();
        try {
            const [rows] = await connection.execute(sql, [userId, userId]);
            return rows as GameHistoryInterface[];
        } finally {
            connection.release();
        }
    }
}
