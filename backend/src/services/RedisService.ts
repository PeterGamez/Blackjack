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
        const data = await this.Redis.get(key);
        if (!data) return null;
        return data as T;
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
        const data = await this.Redis.hgetall(key);
        if (!data || Object.keys(data).length === 0) return null;
        return data as T;
    }

    public static async expire(key: string, seconds: number) {
        return await this.Redis.expire(key, seconds);
    }

    public static async sadd(key: string, ...members: string[]) {
        return await this.Redis.sadd(key, ...members);
    }

    public static async srem(key: string, ...members: string[]) {
        return await this.Redis.srem(key, ...members);
    }

    public static async smembers(key: string): Promise<string[]> {
        return await this.Redis.smembers(key);
    }

    public static async sismember(key: string, member: string): Promise<boolean> {
        const result = await this.Redis.sismember(key, member);
        return result === 1;
    }

    public static async scard(key: string): Promise<number> {
        return await this.Redis.scard(key);
    }

    public static async smismember(key: string, ...members: string[]): Promise<boolean[]> {
        const results = await this.Redis.smismember(key, ...members);
        return results.map((r) => r === 1);
    }
}
