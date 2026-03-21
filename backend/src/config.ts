export default {
    site: {
        name: process.env.SITE_NAME || "Blackjack",
        url: process.env.SITE_URL || "http://localhost:3000",
    },
    api: {
        path: process.env.API_PATH || "/",
        port: parseInt(process.env.API_PORT || "3001"),
    },
    socket: {
        port: parseInt(process.env.SOCKET_PORT || "3002"),
    },

    auth: {
        accessTokenSecret: process.env.JWT_ACCESS_TOKEN_SECRET || "default_access_token_secret",
        refreshTokenSecret: process.env.JWT_REFRESH_TOKEN_SECRET || "default_refresh_token_secret",
        accessTokenTtl: "1h",
        refreshTokenTtl: "24h",
    },

    email: {
        host: process.env.EMAIL_HOST || "smtp.example.com",
        port: parseInt(process.env.EMAIL_PORT || "587"),
        secure: process.env.EMAIL_SECURE === "true",
        auth: {
            user: process.env.EMAIL_USER || "",
            pass: process.env.EMAIL_PASS || "",
        },

        verifyExpiresIn: 30, // minutes
        resetPasswordExpiresIn: 30, // minutes
    },

    bank: {
        ewalletid: process.env.EWALLETID || "",
        slipok: {
            branch: process.env.SLIPOK_BRANCH || "",
            authorization: process.env.SLIPOK_AUTHORIZATION || "",
        },
    },

    truemoney: {
        phone: process.env.TRUEMONEY_PHONE || "",
    },

    mysql: {
        host: process.env.MYSQL_HOST || "localhost",
        port: parseInt(process.env.MYSQL_PORT || "3306"),
        user: process.env.MYSQL_USER || "root",
        password: process.env.MYSQL_PASSWORD || "",
        database: process.env.MYSQL_DATABASE || "blackjack",

        table: {
            codeHistory: "codeHistory",
            code: "code",
            gameHistory: "gameHistory",
            package: "package",
            payment: "payment",
            product: "product",
            user: "user",
            userInventory: "userInventory",
        },
    },

    redis: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379"),
        password: process.env.REDIS_PASSWORD || "",
        db: parseInt(process.env.REDIS_DB || "0"),
    },
};
