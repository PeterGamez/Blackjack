export default {
    port: parseInt(process.env.PORT || "3000"),
    socketPort: parseInt(process.env.SOCKET_PORT || "3001"),

    auth: {
        jwtSecret: process.env.JWT_SECRET || "change-me-to-a-secret-key",
        accessTokenTtl: "1h",
        refreshTokenTtl: "1d",
    },

    verifyEmail: {
        expiresIn: "24h",
    },

    email: {
        host: process.env.EMAIL_HOST || "smtp.example.com",
        port: parseInt(process.env.EMAIL_PORT || "587"),
        secure: process.env.EMAIL_SECURE === "true",
        auth: {
            user: process.env.EMAIL_USER || "",
            pass: process.env.EMAIL_PASS || "",
        },
        from: process.env.EMAIL_FROM || "",
    },

    app: {
        url: process.env.APP_URL || "http://localhost:3000",
        path: process.env.APP_PATH || "/",
    },

    mysql: {
        host: process.env.MYSQL_HOST || "localhost",
        port: parseInt(process.env.MYSQL_PORT || "3306"),
        user: process.env.MYSQL_USER || "root",
        password: process.env.MYSQL_PASSWORD || "",
        database: process.env.MYSQL_DATABASE || "blackjack",

        table: {
            user: "user",
        },
    },

    redis: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379"),
        password: process.env.REDIS_PASSWORD || "",
        db: parseInt(process.env.REDIS_DB || "0"),
    },
};
