import { createHttpClient, HttpClient } from "../http/httpClient";
import { DataSourceClient, RawToken } from "./types";

export class JupiterClient implements DataSourceClient {
	public readonly name = "jupiter";
	private http: HttpClient;

	constructor(http: HttpClient = createHttpClient({ maxRps: 15, maxConcurrent: 5 })) {
		this.http = http;
	}

	async search(query: string): Promise<RawToken[]> {
		try {
			// Use Jupiter token list search
			const url = `https://token.jup.ag/all`;
			const list = await this.http.get<any[]>(url);
			const needle = query.trim().toLowerCase();
			const matched = (list || []).filter((t) => {
				const name = String(t?.name ?? "").toLowerCase();
				const symbol = String(t?.symbol ?? "").toLowerCase();
				const address = String(t?.address ?? t?.mint ?? "").toLowerCase();
				return name.includes(needle) || symbol.includes(needle) || address.includes(needle);
			});
			return matched.map((t) => ({
				token_address: t?.address ?? t?.mint ?? "",
				token_name: t?.name ?? undefined,
				token_ticker: t?.symbol ?? undefined,
				price_sol: undefined,
				market_cap_sol: undefined,
				volume_sol: undefined,
				liquidity_sol: undefined,
				transaction_count: undefined,
				price_1hr_change: undefined,
				protocol: undefined,
				source: this.name,
			}));
		} catch {
			return [];
		}
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
