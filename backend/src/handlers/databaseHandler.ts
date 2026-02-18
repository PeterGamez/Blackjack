import { createPool } from "mysql2/promise";
import Client from "../utils/Client";
import Redis from "ioredis";

export default async (client: Client) => {
    const pool = createPool({
        host: client.config.mysql.host,
        port: client.config.mysql.port,
        user: client.config.mysql.user,
        password: client.config.mysql.password,
        database: client.config.mysql.database,
        waitForConnections: true,
        connectionLimit: 10,
        maxIdle: 10,
        idleTimeout: 60000,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,

        typeCast: function (field, next) {
            // แปลง TINYINT(1) เป็น Boolean
            if (field.type == "TINY" && field.length === 1) {
                return field.string() === "1";
            } else {
                return next();
            }
        },
    });

    pool.on("enqueue", () => {
        client.warn("Database", "Waiting for available connection slot!");
    });

    const connection = await pool.getConnection();
    connection.release();

    client.DB = pool;

    client.log("Database", "MySQL Connected!");

    client.Redis = new Redis(client.config.redis);

    client.Redis.on("ready", () => {
        client.log("Redis", `Connected to Redis DB ${client.config.redis.db}`);
    });

    client.Redis.on("error", (err) => {
        client.error("Redis", "Redis Error");
        console.error(err);
    });

    client.initModels();

    return true;
};
