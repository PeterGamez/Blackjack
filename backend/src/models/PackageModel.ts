import type { Pool, ResultSetHeader } from "mysql2/promise";

import type { PackageInterface } from "../interfaces/Database";

export default class PackageModel {
    private static table: string;
    private static DB: Pool;

    public static init(table: string, DB: Pool) {
        this.table = table;
        this.DB = DB;
    }

    public static async createPackage(image: string, price: number, tokens: number, isActive: boolean): Promise<number> {
        const sql = `INSERT INTO ${this.table} (image, price, tokens, isActive) VALUES (?, ?, ?, ?)`;
        const connection = await this.DB.getConnection();
        try {
            const [result] = await connection.execute<ResultSetHeader>(sql, [image, price, tokens, isActive]);
            return result.insertId;
        } finally {
            connection.release();
        }
    }

    public static async selectAllPackages(): Promise<PackageInterface[]> {
        const sql = `SELECT * FROM ${this.table}`;
        const connection = await this.DB.getConnection();
        try {
            const [rows] = await connection.execute(sql);
            return rows as PackageInterface[];
        } finally {
            connection.release();
        }
    }

    public static async selectAllActivePackages(): Promise<PackageInterface[]> {
        const sql = `SELECT * FROM ${this.table} WHERE isActive = 1`;
        const connection = await this.DB.getConnection();
        try {
            const [rows] = await connection.execute(sql);
            return rows as PackageInterface[];
        } finally {
            connection.release();
        }
    }

    public static async selectPackage(id: number): Promise<PackageInterface> {
        const sql = `SELECT * FROM ${this.table} WHERE id = ? AND isActive = 1`;
        const connection = await this.DB.getConnection();
        try {
            const [rows] = await connection.execute(sql, [id]);
            return rows[0];
        } finally {
            connection.release();
        }
    }
}
