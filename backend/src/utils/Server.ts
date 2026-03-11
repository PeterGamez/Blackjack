import { Pool } from "mysql2/promise";
import config from "../config";
import Redis from "ioredis";
import UserModel from "../models/UserModel";
import RedisService from "../services/RedisService";
import Email from "./Email";
import JWT from "./JWT";
import Password from "./Password";
import SocketService from "../services/SocketService";
import UserSkinModel from "../models/UserSkinModels";
import CodeHistoryModel from "../models/CodeHistoryModel";
import CodeModel from "../models/CodeModel";
import GameHistoryModel from "../models/GameHistoryModel";
import PaymentModel from "../models/PaymentModel";
import { SlipOK } from "./SlipOK";
import { Truemoney } from "./Truemoney";
import PackageModel from "../models/PackageModel";
import { Blackjack } from "./Blackjack";
import { Middleware } from "./Middleware";

export default class Server {
    public config = config;
    public DB: Pool;
    public Redis: Redis;
    public Email = new Email(this);
    public JWT = new JWT();
    public Password = new Password();
    public SlipOK = new SlipOK(this);
    public Truemoney = new Truemoney(this);
    public Blackjack = new Blackjack();
    public Middleware = new Middleware(this);

    public initModels() {
        CodeHistoryModel.init(this.config.mysql.table.codeHistory, this.DB);
        CodeModel.init(this.config.mysql.table.code, this.DB);
        GameHistoryModel.init(this.config.mysql.table.gameHistory, this.DB);
        PackageModel.init(this.config.mysql.table.package, this.DB);
        PaymentModel.init(this.config.mysql.table.payment, this.DB);
        UserModel.init(this.config.mysql.table.user, this.DB);
        UserSkinModel.init(this.config.mysql.table.userSkin, this.DB);
    }

    public initServices() {
        RedisService.init(this.Redis);
        SocketService.init(this);
    }

    public customLogger(message: string, ...rest: string[]) {
        this.log("REST", `${message} ${rest.join(" ")}`);
    }

    public log(key: string, message: string) {
        key = `${key}`;
        if (key.length < 20) key = key.padEnd(20, " ");
        console.log(`[${this.formatDate(new Date())}] ${key} : ${message}`);
    }
    public warn(key: string, message: string) {
        key = `${key}`;
        if (key.length < 20) key = key.padEnd(20, " ");
        console.warn(`[${this.formatDate(new Date())}] ${key} : ${message}`);
    }
    public error(key: string, message: string) {
        key = `${key}`;
        if (key.length < 20) key = key.padEnd(20, " ");
        console.error(`[${this.formatDate(new Date())}] ${key} : ${message}`);
    }

    private formatDate(date: Date) {
        const pad = (n: number) => n.toString().padStart(2, "0");

        const day = pad(date.getDate());
        const month = pad(date.getMonth() + 1);
        const year = date.getFullYear();
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        const seconds = pad(date.getSeconds());

        return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
    }
}
