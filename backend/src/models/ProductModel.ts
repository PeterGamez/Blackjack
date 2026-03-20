import type { Pool, ResultSetHeader } from "mysql2/promise";

import type { ProductInterface } from "../interfaces/Database";
import { ProductType } from "../interfaces/Type";

export default class ProductModel {
    private static table: string;
    private static DB: Pool;

    public static init(table: string, DB: Pool) {
        this.table = table;
        this.DB = DB;
    }

    public static getTable(): string {
        return this.table;
    }

    public static async insertProduct(
        name: string,
        description: string,
        path: string,
        tokens: number,
        coins: number,
        type: ProductInterface["type"],
        isRecommend: boolean,
        isActive: boolean
    ): Promise<void> {
        const sql = `INSERT INTO ${this.table} (name, description, path, tokens, coins, type, isRecommend, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const connection = await this.DB.getConnection();
        try {
            await connection.execute<ResultSetHeader>(sql, [name, description, path, tokens, coins, type, isRecommend, isActive]);
        } finally {
            connection.release();
        }
    }

    public static async selectAllProducts(): Promise<ProductInterface[]> {
        const sql = `SELECT * FROM ${this.table} WHERE deletedAt IS NULL`;
        const connection = await this.DB.getConnection();
        try {
            const [rows] = await connection.execute(sql);
            return rows as ProductInterface[];
        } finally {
            connection.release();
        }
    }

    public static async selectAllActiveProducts(): Promise<ProductInterface[]> {
        const sql = `SELECT * FROM ${this.table} WHERE isActive = true AND deletedAt IS NULL`;
        const connection = await this.DB.getConnection();
        try {
            const [rows] = await connection.execute(sql);
            return rows as ProductInterface[];
        } finally {
            connection.release();
        }
    }

    public static async selectProduct(id: number): Promise<ProductInterface> {
        const sql = `SELECT * FROM ${this.table} WHERE id = ? AND deletedAt IS NULL`;
        const connection = await this.DB.getConnection();
        try {
            const [rows] = await connection.execute(sql, [id]);
            return (rows as ProductInterface[])[0];
        } finally {
            connection.release();
        }
    }

    public static async updateProduct<T extends keyof ProductType>(id: number, type: T, value: ProductType[T]): Promise<void> {
        const sql = `UPDATE ${this.table} SET ${type} = ? WHERE id = ? AND deletedAt IS NULL`;
        const connection = await this.DB.getConnection();
        try {
            await connection.execute(sql, [value, id]);
        } finally {
            connection.release();
        }
    }
}
