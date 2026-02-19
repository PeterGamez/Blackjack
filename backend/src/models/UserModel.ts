import { Pool, ResultSetHeader } from "mysql2/promise";
import { UserInterface } from "../interfaces/Database";
import { UserType } from "../interfaces/Type";

export default class UserModel {
    private static table: string;
    private static DB: Pool;

    public static init(table: string, DB: Pool) {
        this.table = table;
        this.DB = DB;
    }

    public static async createUser(username: string, email: string, password: string): Promise<number> {
        const sql = `INSERT INTO ${this.table} (username, email, password) VALUES (?, ?, ?)`;
        const connection = await this.DB.getConnection();
        try {
            const [result] = await connection.execute<ResultSetHeader>(sql, [username, email, password]);
            return result.insertId;
        } finally {
            connection.release();
        }
    }

    public static async selectUser(id: number): Promise<UserInterface> {
        const sql = `SELECT * FROM ${this.table} WHERE id = ?`;
        const connection = await this.DB.getConnection();
        try {
            const [rows] = await connection.execute(sql, [id]);
            return rows[0];
        } finally {
            connection.release();
        }
    }

    public static async selectUserByUsernameOrEmail(user: string): Promise<UserInterface> {
        const sql = `SELECT * FROM ${this.table} WHERE username = ? OR email = ?`;
        const connection = await this.DB.getConnection();
        try {
            const [rows] = await connection.execute(sql, [user]);
            return rows[0];
        } finally {
            connection.release();
        }
    }

    public static async verifyEmail(email: string): Promise<boolean> {
        const sql = `UPDATE ${this.table} SET isVerifyEmail = true WHERE email = ?`;
        const connection = await this.DB.getConnection();
        try {
            const [result] = await connection.execute<ResultSetHeader>(sql, [email]);
            return result.affectedRows > 0;
        } finally {
            connection.release();
        }
    }

    public static async updateUser<T extends keyof UserType>(userId: string, type: T, value: UserType[T]): Promise<void> {
        const sql = `UPDATE ${this.table} SET ${type} = ? WHERE userId = ?`;
        const connection = await this.DB.getConnection();
        try {
            await connection.execute(sql, [value, userId]);
        } finally {
            connection.release();
        }
    }
}
