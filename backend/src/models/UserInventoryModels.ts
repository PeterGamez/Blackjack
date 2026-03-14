import type { Pool, ResultSetHeader } from "mysql2/promise";

import type { UserInventoryInterface } from "../interfaces/Database";
import ProductModel from "./ProductModel";

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

    public static async selectAllUserInventoryByUserId(userId: number): Promise<(UserInventoryInterface & { type: string })[]> {
        const productTable = ProductModel.getTable();

        const sql = `
        SELECT ${this.table}.*, ${productTable}.type
        FROM ${this.table}
        INNER JOIN ${productTable} ON ${this.table}.productId = ${productTable}.id
        WHERE ${this.table}.userId = ?`;

        const connection = await this.DB.getConnection();
        try {
            const [rows] = await connection.execute(sql, [userId]);
            return rows as (UserInventoryInterface & { type: string })[];
        } finally {
            connection.release();
        }
    }
}
