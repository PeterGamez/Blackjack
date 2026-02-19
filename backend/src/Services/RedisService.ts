import Redis from "ioredis";

export default class RedisService {
    public static Redis: Redis;

    public static init(Redis: Redis) {
        this.Redis = Redis;
    }

    public static async set(key: string, value: string) {
        return this.Redis.set(key, value);
    }

    public static async get(key: string) {
        return this.Redis.get(key);
    }

    public static async del(key: string) {
        return this.Redis.del(key);
    }

    public static async hset(key: string, field: string, value: string) {
        return this.Redis.hset(key, field, value);
    }

    public static async hmset(key: string, data: Record<string, string>) {
        return this.Redis.hmset(key, data);
    }

    public static async hgetall(key: string) {
        return this.Redis.hgetall(key);
    }

    public static async expire(key: string, seconds: number) {
        return this.Redis.expire(key, seconds);
    }
}
