import { createHttpClient, HttpClient } from "../http/httpClient";
import { DataSourceClient, RawToken } from "./types";

export class DexScreenerClient implements DataSourceClient {
	public readonly name = "dexscreener";
	private http: HttpClient;

	constructor(http: HttpClient = createHttpClient({ maxRps: 10, maxConcurrent: 5 })) {
		this.http = http;
	}

	async search(query: string): Promise<RawToken[]> {
		const url = `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`;
		const data = await this.http.get<any>(url);
		const pairs: any[] = data?.pairs ?? [];
		return pairs.map((p) => this.mapPair(p));
	}

	async byTokenAddress(address: string): Promise<RawToken | null> {
		const url = `https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(address)}`;
		const data = await this.http.get<any>(url);
		const pairs: any[] = data?.pairs ?? [];
		if (pairs.length === 0) return null;
		return this.mapPair(pairs[0]);
	}

	private mapPair(p: any): RawToken {
		const priceSol = Number(p?.priceNative ?? p?.priceUsd ?? 0);
		return {
			token_address: p?.baseToken?.address ?? p?.quoteToken?.address ?? "",
			token_name: p?.baseToken?.name ?? p?.quoteToken?.name ?? "",
			token_ticker: p?.baseToken?.symbol ?? p?.quoteToken?.symbol ?? "",
			price_sol: isNaN(priceSol) ? undefined : priceSol,
			market_cap_sol: undefined,
			volume_sol: Number(p?.volume?.h24 ?? p?.volume?.h1 ?? 0) || undefined,
			liquidity_sol: Number(p?.liquidity?.base ?? p?.liquidity?.usd ?? 0) || undefined,
			transaction_count: Number(p?.txns?.h24?.buys ?? 0) + Number(p?.txns?.h24?.sells ?? 0) || undefined,
			price_1hr_change: Number(p?.priceChange?.h1 ?? 0) || undefined,
			protocol: p?.dexId,
			source: this.name,
		};
	}
}
