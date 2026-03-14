import type { Pool, ResultSetHeader } from "mysql2/promise";

import type { ProductInterface } from "../interfaces/Database";

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

    public static async insertProduct(product: Omit<ProductInterface, "id" | "createdAt" | "updatedAt">): Promise<void> {
        const sql = `INSERT INTO ${this.table} (name, description, image, tokens, coins, type, isRecommend, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        const connection = await this.DB.getConnection();
        try {
            await connection.execute<ResultSetHeader>(sql, [product.name, product.description, product.image, product.tokens, product.coins, product.type, product.isRecommend, product.isActive]);
        } finally {
            connection.release();
        }
    }

    public static async selectAllProducts(): Promise<ProductInterface[]> {
        const sql = `SELECT * FROM ${this.table}`;
        const connection = await this.DB.getConnection();
        try {
            const [rows] = await connection.execute(sql);
            return rows as ProductInterface[];
        } finally {
            connection.release();
        }
    }

    public static async selectAllActiveProducts(): Promise<ProductInterface[]> {
        const sql = `SELECT * FROM ${this.table} WHERE isActive = true`;
        const connection = await this.DB.getConnection();
        try {
            const [rows] = await connection.execute(sql);
            return rows as ProductInterface[];
        } finally {
            connection.release();
        }
    }

    public static async selectProduct(id: number): Promise<ProductInterface> {
        const sql = `SELECT * FROM ${this.table} WHERE id = ?`;
        const connection = await this.DB.getConnection();
        try {
            const [rows] = await connection.execute(sql, [id]);
            return (rows as ProductInterface[])[0];
        } finally {
            connection.release();
        }
    }
}
