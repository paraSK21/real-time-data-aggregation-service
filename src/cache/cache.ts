import IORedis from "ioredis";

export interface CacheClient {
	get<T>(key: string): Promise<T | null>;
	set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
	del(key: string): Promise<void>;
}

class InMemoryCache implements CacheClient {
	private store = new Map<string, { value: unknown; expiresAt: number }>();

	async get<T>(key: string): Promise<T | null> {
		const record = this.store.get(key);
		if (!record) return null;
		if (Date.now() > record.expiresAt) {
			this.store.delete(key);
			return null;
		}
		return record.value as T;
	}

	async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
		const expiresAt = Date.now() + ttlSeconds * 1000;
		this.store.set(key, { value, expiresAt });
	}

	async del(key: string): Promise<void> {
		this.store.delete(key);
	}
}

class RedisCache implements CacheClient {
	private client: IORedis;

	constructor(url: string) {
		this.client = new IORedis(url, { lazyConnect: true, maxRetriesPerRequest: 3 });
	}

	private async ensureConnected(): Promise<void> {
		if (this.client.status === "end") {
			await this.client.connect();
		}
	}

	async get<T>(key: string): Promise<T | null> {
		await this.ensureConnected();
		const data = await this.client.get(key);
		return data ? (JSON.parse(data) as T) : null;
	}

	async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
		await this.ensureConnected();
		await this.client.set(key, JSON.stringify(value), "EX", ttlSeconds);
	}

	async del(key: string): Promise<void> {
		await this.ensureConnected();
		await this.client.del(key);
	}
}

export function createCache(redisUrl?: string): CacheClient {
	if (redisUrl) {
		return new RedisCache(redisUrl);
	}
	return new InMemoryCache();
}
