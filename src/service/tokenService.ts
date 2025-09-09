import { AppConfig } from "../server/config";
import { CacheClient, createCache } from "../cache/cache";
import { DexScreenerClient } from "../datasources/dexscreener";
import { GeckoTerminalClient } from "../datasources/geckoterminal";
import { JupiterClient } from "../datasources/jupiter";
import { RawToken, UnifiedToken } from "../datasources/types";
import { listWithCursor } from "../aggregation/filterSort";
import { ListQuery, TokenListResponse } from "../aggregation/types";
import { mergeTokens } from "../aggregation/merge";

export class TokenService {
	private cache: CacheClient;
	private config: AppConfig;
	private dexscreener = new DexScreenerClient();
	private geckoterminal = new GeckoTerminalClient();
	private jupiter = new JupiterClient();

	private state: { tokens: UnifiedToken[] } = { tokens: [] };

	constructor(config: AppConfig, cache?: CacheClient) {
		this.config = config;
		this.cache = cache ?? createCache(config.redisUrl);
	}

	private cacheKeyForQuery(q: string): string {
		return `tokens:search:${q}`;
	}

	async searchTokens(query: string): Promise<UnifiedToken[]> {
		const cacheKey = this.cacheKeyForQuery(query);
		const cached = await this.cache.get<UnifiedToken[]>(cacheKey);
		if (cached) return cached;

		const [a, b] = await Promise.all([
			this.dexscreener.search(query),
			this.geckoterminal.search(query),
		]);
		const merged = mergeTokens([...a, ...b]);
		await this.cache.set(cacheKey, merged, this.config.cacheTtlSeconds);
		return merged;
	}

	async getByAddress(address: string): Promise<UnifiedToken | null> {
		const key = `tokens:by:${address}`;
		const cached = await this.cache.get<UnifiedToken>(key);
		if (cached) return cached;

		const [ds, gt, jp] = await Promise.all([
			this.dexscreener.byTokenAddress(address),
			this.geckoterminal.byTokenAddress(address),
			this.jupiter.byTokenAddress(address),
		]);
		const raws: RawToken[] = [ds, gt, jp].filter(Boolean) as RawToken[];
		if (raws.length === 0) return null;
		const mergedList = mergeTokens(raws);
		const [first] = mergedList;
		const merged: UnifiedToken | null = first ?? null;
		if (merged) {
			await this.cache.set(key, merged, this.config.cacheTtlSeconds);
		}
		return merged;
	}

	// Maintain a working set for discover-like list based on a default query
	async refreshWorkingSet(query: string): Promise<UnifiedToken[]> {
		const tokens = await this.searchTokens(query);
		this.state.tokens = tokens;
		return tokens;
	}

	list(params: ListQuery): TokenListResponse<UnifiedToken> {
		return listWithCursor(this.state.tokens, params);
	}

	getAllState(): UnifiedToken[] {
		return this.state.tokens;
	}
}
