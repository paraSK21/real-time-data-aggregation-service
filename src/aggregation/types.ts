export type TimeRange = "1h" | "24h" | "7d";

export type SortField =
	| "volume"
	| "price"
	| "market_cap"
	| "liquidity"
	| "tx_count"
	| "price_change";

export type SortDirection = "asc" | "desc";

export type ListQuery = {
	query?: string;
	timeRange?: TimeRange;
	sortField?: SortField;
	sortDirection?: SortDirection;
	limit?: number;
	cursor?: string | null;
};

export type Cursor = {
	index: number;
	appliedSort: { field: SortField; direction: SortDirection } | null;
	q?: string;
};

export type TokenListResponse<T> = { data: T[]; nextCursor: string | null };
