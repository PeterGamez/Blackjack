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
            const [rows] = await connection.execute(sql, [user, user]);
            return rows[0];
        } finally {
            connection.release();
        }
    }

    public static async verifyEmail(email: string): Promise<boolean> {
        const sql = `UPDATE ${this.table} SET isVerified = true WHERE email = ?`;
        const connection = await this.DB.getConnection();
        try {
            const [result] = await connection.execute<ResultSetHeader>(sql, [email]);
            return result.affectedRows > 0;
        } finally {
            connection.release();
        }
    }

    public static async updateUser<T extends keyof UserType>(id: number, type: T, value: UserType[T]): Promise<void> {
        const sql = `UPDATE ${this.table} SET ${type} = ? WHERE id = ?`;
        const connection = await this.DB.getConnection();
        try {
            await connection.execute(sql, [value, id]);
        } finally {
            connection.release();
        }
    }

    public static async deleteUser(id: number): Promise<void> {
        const sql = `DELETE FROM ${this.table} WHERE id = ?`;
        const connection = await this.DB.getConnection();
        try {
            await connection.execute(sql, [id]);
        } finally {
            connection.release();
        }
    }
}
