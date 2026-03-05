export default {
    site: {
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
        jwtSecret: process.env.JWT_SECRET || "change-me-to-a-secret-key",
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
        from: process.env.EMAIL_FROM || "",

        verifyExpiresIn: 24, // hours
        resetPasswordExpiresIn: 15, // minutes
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
            payment: "payment",
            user: "user",
            userSkin: "userSkin",
        },
    },

    redis: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379"),
        password: process.env.REDIS_PASSWORD || "",
        db: parseInt(process.env.REDIS_DB || "0"),
    },

    payment: {
        slipok: {
            apiKey: process.env.SLIPOK_API_KEY || "",
            branchId: process.env.SLIPOK_BRANCH_ID || "",
            apiUrl: "https://api.slipok.com/api/line/apiVerify",
        },
        truemoney: {
            apiUrl: "https://gift.truemoney.com/campaign/vouchers/",
        },
    },

    packages: [
        { id: 1, price: 35, tokens: 350, name: "Starter Pack", description: "แพ็คเริ่มต้น", active: true },
        { id: 2, price: 99, tokens: 1100, name: "Basic Pack", description: "แพ็คพื้นฐาน", active: true },
        { id: 3, price: 179, tokens: 2100, name: "Silver Pack", description: "แพ็คซิลเวอร์", active: true },
        { id: 4, price: 349, tokens: 4500, name: "Gold Pack", description: "แพ็คทอง", active: true },
        { id: 5, price: 729, tokens: 10000, name: "Platinum Pack", description: "แพ็คแพลทินั่ม", active: true },
        { id: 6, price: 1800, tokens: 28000, name: "Diamond Pack", description: "แพ็คเพชร", active: true },
    ],
};
