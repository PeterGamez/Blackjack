import type { Hono } from "hono";
import type Redis from "ioredis";
import type { Pool } from "mysql2/promise";

import { initModels, initRoutes, initServices } from "../bootstrap";
import config from "../config";

import { Blackjack } from "./Blackjack";
import Logger from "./Logger";
import { Middleware } from "./Middleware";
import { Email, SlipOK, Truemoney } from "../integrations";
import { JWT, Password } from "../security";

export default class Server {
    public config = config;
    public DB: Pool;
    public Redis: Redis;
    private Logger = new Logger();
    public Middleware = new Middleware(this);

    public Email = new Email(this);
    public JWT = new JWT();
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
        this.Logger.customLogger(message, ...rest);
    }

    public log(key: string, message: string) {
        this.Logger.log(key, message);
    }

    public warn(key: string, message: string) {
        this.Logger.warn(key, message);
    }

    public error(key: string, message: string) {
        this.Logger.error(key, message);
    }
}
