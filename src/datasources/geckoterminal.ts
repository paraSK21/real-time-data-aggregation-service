import { createHttpClient, HttpClient } from "../http/httpClient";
import { DataSourceClient, RawToken } from "./types";

export class GeckoTerminalClient implements DataSourceClient {
	public readonly name = "geckoterminal";
	private http: HttpClient;

	constructor(http: HttpClient = createHttpClient({ maxRps: 10, maxConcurrent: 5 })) {
		this.http = http;
	}

	async search(query: string): Promise<RawToken[]> {
		try {
			const url = `https://api.geckoterminal.com/api/v2/networks/solana/tokens?query=${encodeURIComponent(
				query,
			)}`;
			const data = await this.http.get<any>(url);
			const tokens: any[] = data?.data ?? [];
			return tokens.map((t) => this.mapToken(t));
		} catch {
			return [];
		}
	}

	async byTokenAddress(address: string): Promise<RawToken | null> {
		try {
			const url = `https://api.geckoterminal.com/api/v2/networks/solana/tokens/${encodeURIComponent(
				address,
			)}`;
			const data = await this.http.get<any>(url);
			const token = data?.data;
			if (!token) return null;
			return this.mapToken(token);
		} catch {
			return null;
		}
	}

	private mapToken(t: any): RawToken {
		const attrs = t?.attributes ?? {};
		return {
			token_address: attrs?.address ?? t?.id ?? "",
			token_name: attrs?.name ?? "",
			token_ticker: attrs?.symbol ?? "",
			price_sol: Number(attrs?.price_native ?? attrs?.price_usd ?? 0) || undefined,
			market_cap_sol: Number(attrs?.fdv_usd ?? 0) || undefined,
			volume_sol: Number(attrs?.volume_usd?.h24 ?? attrs?.volume_usd ?? 0) || undefined,
			liquidity_sol: Number(attrs?.liquidity_usd ?? 0) || undefined,
			transaction_count: undefined,
			price_1hr_change: Number(attrs?.price_change_percentage?.h1 ?? 0) || undefined,
			protocol: undefined,
			source: this.name,
		};
	}
}
