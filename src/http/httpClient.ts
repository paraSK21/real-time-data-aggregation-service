import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import Bottleneck from "bottleneck";

export type HttpClient = {
	get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
};

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createHttpClient(options?: { maxRps?: number; maxConcurrent?: number; retries?: number }): HttpClient {
	const instance: AxiosInstance = axios.create({ timeout: 10_000 });

	const limiter = new Bottleneck({
		minTime: options?.maxRps ? Math.ceil(1000 / options.maxRps) : 0,
		maxConcurrent: options?.maxConcurrent ?? 5,
	});

	const maxRetries = options?.retries ?? 3;

	return {
		async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
			return limiter.schedule(async () => {
				let attempt = 0;
				// Exponential backoff: 200ms, 400ms, 800ms
				while (true) {
					try {
						const res = await instance.get<T>(url, config);
						return res.data as T;
					} catch (error: any) {
						attempt += 1;
						const status: number | undefined = error?.response?.status;
						const retryable = !status || status >= 500;
						if (attempt > maxRetries || !retryable) {
							throw error;
						}
						const delayMs = 200 * Math.pow(2, attempt - 1);
						await sleep(delayMs);
					}
				}
			});
		},
	};
}
