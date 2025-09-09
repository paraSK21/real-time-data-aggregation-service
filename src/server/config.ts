import dotenv from "dotenv";

dotenv.config();

export type AppConfig = {
	port: number;
	redisUrl?: string;
	cacheTtlSeconds: number;
	pollIntervalMs: number;
	environment: "development" | "test" | "production";
};

export function loadConfig(): AppConfig {
	return {
		port: Number(process.env.PORT ?? 4000),
		redisUrl: process.env.REDIS_URL,
		cacheTtlSeconds: Number(process.env.CACHE_TTL_SECONDS ?? 30),
		pollIntervalMs: Number(process.env.POLL_INTERVAL_MS ?? 5000),
		environment: (process.env.NODE_ENV as AppConfig["environment"]) ?? "development",
	};
}
