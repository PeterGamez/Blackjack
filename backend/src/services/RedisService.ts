import Redis from "ioredis";

export default class RedisService {
    public static Redis: Redis;

    public static init(Redis: Redis) {
        this.Redis = Redis;
    }

    public static async set<T extends string>(key: string, value: T) {
        return await this.Redis.set(key, value);
    }

    public static async get<T extends string>(key: string): Promise<T> {
        return (await this.Redis.get(key)) as T;
    }

    public static async del(key: string) {
        return await this.Redis.del(key);
    }

    public static async hset(key: string, field: string, value: string) {
        return await this.Redis.hset(key, field, value);
    }

    public static async hmset<T extends Record<string, string>>(key: string, data: T) {
        return await this.Redis.hmset(key, data);
    }

    public static async hgetall<T extends Record<string, string>>(key: string): Promise<T> {
        return (await this.Redis.hgetall(key)) as T;
    }

    public static async expire(key: string, seconds: number) {
        return await this.Redis.expire(key, seconds);
    }
}
