import type { Pool } from "mysql2/promise";
import type { ProductInterface } from "../interfaces/Database";

export default class ProductModel {
    private static table: string;
    private static DB: Pool;

    public static init(table: string, DB: Pool) {
        this.table = table;
        this.DB = DB;
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
