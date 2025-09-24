import { RawToken, UnifiedToken } from "../datasources/types";

function toKey(address: string): string {
    return address.trim().toLowerCase();
}

function normalizeKeyPart(value: string | undefined): string {
    return (value ?? "").trim().toLowerCase();
}

function heuristicKey(t: UnifiedToken): string | null {
    // Build a conservative heuristic key using exact ticker+name
    const ticker = normalizeKeyPart(t.token_ticker);
    const name = normalizeKeyPart(t.token_name);
    if (!ticker && !name) return null;
    return `${ticker}|${name}`;
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
    const enableHeuristic = true;
    const byAddress = new Map<string, UnifiedToken>();
    const byHeuristic = new Map<string, UnifiedToken>();

    function mergeInto(target: UnifiedToken, n: UnifiedToken): void {
        // Merge logic: prefer non-null values, average price, sum volumes where sensible
        target.token_name = target.token_name || n.token_name;
        target.token_ticker = target.token_ticker || n.token_ticker;
        if (n.price_sol && target.price_sol) {
            target.price_sol = (target.price_sol + n.price_sol) / 2;
        } else {
            target.price_sol = target.price_sol || n.price_sol || 0;
        }
        target.market_cap_sol = target.market_cap_sol ?? n.market_cap_sol;
        target.volume_sol = (target.volume_sol ?? 0) + (n.volume_sol ?? 0);
        target.liquidity_sol = target.liquidity_sol ?? n.liquidity_sol;
        target.transaction_count = (target.transaction_count ?? 0) + (n.transaction_count ?? 0);
        target.price_1hr_change = target.price_1hr_change ?? n.price_1hr_change;
        // Always include both sets of sources; if price-only (e.g., Jupiter), still credit source
        target.sources = Array.from(new Set([...(target.sources ?? []), ...(n.sources ?? [])]));
    }

    for (const r of raws) {
        const n = normalize(r);
        if (!n) continue;

        const key = toKey(n.token_address);
        const existing = byAddress.get(key);
        if (existing) {
            mergeInto(existing, n);
            continue;
        }

        if (enableHeuristic) {
            const hk = heuristicKey(n);
            if (hk) {
                const existingHeu = byHeuristic.get(hk);
                if (existingHeu) {
                    mergeInto(existingHeu, n);
                    // After merging under heuristic, keep address map in sync for faster lookups next time
                    byAddress.set(key, existingHeu);
                    continue;
                }
            }
        }

        // New entry
        byAddress.set(key, n);
        if (enableHeuristic) {
            const hk = heuristicKey(n);
            if (hk && !byHeuristic.has(hk)) byHeuristic.set(hk, n);
        }
    }

    return Array.from(new Set(byAddress.values()));
}
