import { RawToken, UnifiedToken } from "../datasources/types";

function toKey(address: string): string {
	return address.trim().toLowerCase();
}

export function normalize(raw: RawToken): UnifiedToken | null {
	if (!raw.token_address) return null;
	return {
		token_address: raw.token_address,
		token_name: raw.token_name ?? raw.token_ticker ?? raw.token_address.slice(0, 6),
		token_ticker: raw.token_ticker ?? raw.token_name ?? "UNK",
		price_sol: raw.price_sol ?? 0,
		market_cap_sol: raw.market_cap_sol,
		volume_sol: raw.volume_sol,
		liquidity_sol: raw.liquidity_sol,
		transaction_count: raw.transaction_count,
		price_1hr_change: raw.price_1hr_change,
		sources: [raw.source],
	};
}

export function mergeTokens(raws: RawToken[]): UnifiedToken[] {
	const map = new Map<string, UnifiedToken>();
	for (const r of raws) {
		const n = normalize(r);
		if (!n) continue;
		const k = toKey(n.token_address);
		const existing = map.get(k);
		if (!existing) {
			map.set(k, n);
			continue;
		}
		// Merge logic: prefer non-null values, average price, sum volumes where sensible
		existing.token_name = existing.token_name || n.token_name;
		existing.token_ticker = existing.token_ticker || n.token_ticker;
		if (n.price_sol && existing.price_sol) {
			existing.price_sol = (existing.price_sol + n.price_sol) / 2;
		} else {
			existing.price_sol = existing.price_sol || n.price_sol || 0;
		}
		existing.market_cap_sol = existing.market_cap_sol ?? n.market_cap_sol;
		existing.volume_sol = (existing.volume_sol ?? 0) + (n.volume_sol ?? 0);
		existing.liquidity_sol = existing.liquidity_sol ?? n.liquidity_sol;
		existing.transaction_count = (existing.transaction_count ?? 0) + (n.transaction_count ?? 0);
		existing.price_1hr_change = existing.price_1hr_change ?? n.price_1hr_change;
		existing.sources = Array.from(new Set([...(existing.sources ?? []), ...(n.sources ?? [])]));
	}
	return Array.from(map.values());
}
