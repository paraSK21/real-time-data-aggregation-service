import { UnifiedToken } from "../datasources/types";
import { Cursor, ListQuery, SortDirection, SortField, TokenListResponse } from "./types";

function compareNumbers(a?: number, b?: number, direction: SortDirection = "desc"): number {
	const av = a ?? -Infinity;
	const bv = b ?? -Infinity;
	if (av === bv) return 0;
	const res = av < bv ? -1 : 1;
	return direction === "asc" ? res : -res;
}

function applySort(tokens: UnifiedToken[], field?: SortField, dir?: SortDirection): UnifiedToken[] {
	if (!field) return tokens;
	const direction = dir ?? "desc";
	const sorted = [...tokens].sort((a, b) => {
		switch (field) {
			case "price":
				return compareNumbers(a.price_sol, b.price_sol, direction);
			case "market_cap":
				return compareNumbers(a.market_cap_sol, b.market_cap_sol, direction);
			case "volume":
				return compareNumbers(a.volume_sol, b.volume_sol, direction);
			case "liquidity":
				return compareNumbers(a.liquidity_sol, b.liquidity_sol, direction);
			case "tx_count":
				return compareNumbers(a.transaction_count, b.transaction_count, direction);
			case "price_change":
				return compareNumbers(a.price_1hr_change, b.price_1hr_change, direction);
			default:
				return 0;
		}
	});
	return sorted;
}

function applyQuery(tokens: UnifiedToken[], q?: string): UnifiedToken[] {
	if (!q) return tokens;
	const needle = q.trim().toLowerCase();
	return tokens.filter((t) =>
		t.token_address.toLowerCase().includes(needle) ||
		t.token_ticker.toLowerCase().includes(needle) ||
		t.token_name.toLowerCase().includes(needle),
	);
}

export function listWithCursor(
	tokens: UnifiedToken[],
	params: ListQuery,
): TokenListResponse<UnifiedToken> {
	const limit = Math.min(Math.max(params.limit ?? 25, 1), 100);
	const filtered = applyQuery(tokens, params.query);

	let startIndex = 0;
	let sortField = params.sortField;
	let sortDirection = params.sortDirection;

	if (params.cursor) {
		try {
			const cursor: Cursor = JSON.parse(Buffer.from(params.cursor, "base64").toString("utf8"));
			startIndex = cursor.index ?? 0;
			if (cursor.appliedSort) {
				sortField = cursor.appliedSort.field;
				sortDirection = cursor.appliedSort.direction;
			}
		} catch {
			startIndex = 0;
		}
	}

	const sorted = applySort(filtered, sortField, sortDirection);

	const slice = sorted.slice(startIndex, startIndex + limit);
	const nextIndex = startIndex + slice.length;
	const hasMore = nextIndex < sorted.length;
	const nextCursor = hasMore
		? Buffer.from(
				JSON.stringify({
					index: nextIndex,
					appliedSort: sortField ? { field: sortField, direction: sortDirection ?? "desc" } : null,
					q: params.query,
				}),
				"utf8",
			).toString("base64")
		: null;

	return { data: slice, nextCursor };
}
