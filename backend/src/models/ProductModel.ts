import { Pool } from "mysql2/promise";
import { ProductInterface } from "../interfaces/Database";

export default class ProductModel {
    private static table: string;
    private static DB: Pool;

    public static init(table: string, DB: Pool) {
        this.table = table;
        this.DB = DB;
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
}
