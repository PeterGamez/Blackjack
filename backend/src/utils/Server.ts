import Redis from "ioredis";
import { Pool } from "mysql2/promise";
import config from "../config";
import CodeHistoryModel from "../models/CodeHistoryModel";
import CodeModel from "../models/CodeModel";
import GameHistoryModel from "../models/GameHistoryModel";
import PackageModel from "../models/PackageModel";
import PaymentModel from "../models/PaymentModel";
import UserModel from "../models/UserModel";
import GameService from "../services/GameService";
import RedisService from "../services/RedisService";
import SocketService from "../services/SocketService";
import { Blackjack } from "./Blackjack";
import Email from "./Email";
import JWT from "./JWT";
import { Middleware } from "./Middleware";
import Password from "./Password";
import { SlipOK } from "./SlipOK";
import { Truemoney } from "./Truemoney";
import UserInventoryModel from "../models/UserInventoryModels";
import ProductModel from "../models/ProductModel";

export default class Server {
    public config = config;
    public DB: Pool;
    public Redis: Redis;

    public Email = new Email(this);
    public JWT = new JWT();
    public Middleware = new Middleware(this);
    public Password = new Password();

    public SlipOK = new SlipOK(this);
    public Truemoney = new Truemoney(this);

    public Blackjack = new Blackjack();

    public initModels() {
        CodeHistoryModel.init(this.config.mysql.table.codeHistory, this.DB);
        CodeModel.init(this.config.mysql.table.code, this.DB);
        GameHistoryModel.init(this.config.mysql.table.gameHistory, this.DB);
        PackageModel.init(this.config.mysql.table.package, this.DB);
        PaymentModel.init(this.config.mysql.table.payment, this.DB);
        ProductModel.init(this.config.mysql.table.product, this.DB);
        UserModel.init(this.config.mysql.table.user, this.DB);
        UserInventoryModel.init(this.config.mysql.table.userInventory, this.DB);
    }

    public initServices() {
        GameService.init(this);
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
