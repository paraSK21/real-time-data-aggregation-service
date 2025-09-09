import { createHttpClient, HttpClient } from "../http/httpClient";
import { DataSourceClient, RawToken } from "./types";

export class JupiterClient implements DataSourceClient {
	public readonly name = "jupiter";
	private http: HttpClient;

	constructor(http: HttpClient = createHttpClient({ maxRps: 15, maxConcurrent: 5 })) {
		this.http = http;
	}

	async search(query: string): Promise<RawToken[]> {
		// Jupiter price API is by id; for search, return empty and rely on other sources
		return [];
	}

	async byTokenAddress(address: string): Promise<RawToken | null> {
		const url = `https://price.jup.ag/v4/price?ids=${encodeURIComponent(address)}`;
		const data = await this.http.get<any>(url);
		const priceData = data?.data?.[address];
		if (!priceData) return null;
		return {
			token_address: address,
			token_name: priceData?.name ?? undefined,
			token_ticker: priceData?.mintSymbol ?? priceData?.symbol ?? undefined,
			price_sol: Number(priceData?.price ?? 0) || undefined,
			market_cap_sol: undefined,
			volume_sol: undefined,
			liquidity_sol: undefined,
			transaction_count: undefined,
			price_1hr_change: Number(priceData?.change?.h1 ?? 0) || undefined,
			protocol: undefined,
			source: this.name,
		};
	}
}
