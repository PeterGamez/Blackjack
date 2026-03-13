import type { Hono } from "hono";
import type Redis from "ioredis";
import type { Pool } from "mysql2/promise";

import { initModels, initRoutes, initServices } from "../bootstrap";
import config from "../config";

import { Blackjack } from "./Blackjack";
import Email from "./Email";
import JWT from "./JWT";
import Logger from "./Logger";
import { Middleware } from "./Middleware";
import Password from "./Password";
import { SlipOK } from "./SlipOK";
import { Truemoney } from "./Truemoney";

export default class Server {
    public config = config;
    public DB: Pool;
    public Redis: Redis;
    private logger = new Logger();

    public Email = new Email(this);
    public JWT = new JWT();
    public Middleware = new Middleware(this);
    public Password = new Password();

    public SlipOK = new SlipOK(this);
    public Truemoney = new Truemoney(this);

    public Blackjack = new Blackjack();

    public initRoutes(app: Hono) {
        initRoutes(this, app);
    }

    public initModels() {
        initModels(this);
    }

    public initServices() {
        initServices(this);
    }

    public customLogger(message: string, ...rest: string[]) {
        this.logger.customLogger(message, ...rest);
    }

    public log(key: string, message: string) {
        this.logger.log(key, message);
    }

    public warn(key: string, message: string) {
        this.logger.warn(key, message);
    }

    public error(key: string, message: string) {
        this.logger.error(key, message);
    }
}
