import type { Pool, ResultSetHeader } from "mysql2/promise";

import type { PaymentInterface } from "../interfaces/Database";

export default class PaymentModel {
    private static table: string;
    private static DB: Pool;

    public static init(table: string, DB: Pool) {
        this.table = table;
        this.DB = DB;
    }

    public static async createPayment(userId: number, receiptRef: string, type: PaymentInterface["type"], amount: number): Promise<number> {
        const sql = `INSERT INTO ${this.table} (userId, receiptRef, type, amount) VALUES (?, ?, ?, ?)`;
        const connection = await this.DB.getConnection();
        try {
            const [result] = await connection.execute<ResultSetHeader>(sql, [userId, receiptRef, type, amount]);
            return result.insertId;
        } finally {
            connection.release();
        }
    }

    public static async selectAllPaymentsByUserId(userId: number): Promise<PaymentInterface[]> {
        const sql = `SELECT * FROM ${this.table} WHERE userId = ? AND deletedAt IS NULL ORDER BY createdAt DESC`;
        const connection = await this.DB.getConnection();
        try {
            const [rows] = await connection.execute(sql, [userId]);
            return rows as PaymentInterface[];
        } finally {
            connection.release();
        }
    }

    public static async selectAllPayments(): Promise<PaymentInterface[]> {
        const sql = `SELECT * FROM ${this.table} WHERE deletedAt IS NULL ORDER BY createdAt DESC`;
        const connection = await this.DB.getConnection();
        try {
            const [rows] = await connection.execute(sql);
            return rows as PaymentInterface[];
        } finally {
            connection.release();
        }
    }
}
