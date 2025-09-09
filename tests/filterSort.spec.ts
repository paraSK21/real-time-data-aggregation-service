import { listWithCursor } from "../src/aggregation/filterSort";
import { UnifiedToken } from "../src/datasources/types";

describe("filterSort", () => {
	const tokens: UnifiedToken[] = [
		{ token_address: "A", token_name: "Alpha", token_ticker: "ALP", price_sol: 1, volume_sol: 10, sources: [] },
		{ token_address: "B", token_name: "Beta", token_ticker: "BET", price_sol: 3, volume_sol: 5, sources: [] },
		{ token_address: "C", token_name: "Gamma", token_ticker: "GAM", price_sol: 2, volume_sol: 20, sources: [] },
	];

	it("sorts by volume desc by default and paginates", () => {
		const res1 = listWithCursor(tokens, { limit: 2, sortField: "volume", sortDirection: "desc" });
		expect(res1.data.map((t) => t.token_address)).toEqual(["C", "A"]);
		expect(res1.nextCursor).toBeTruthy();
		const res2 = listWithCursor(tokens, { limit: 2, cursor: res1.nextCursor! });
		expect(res2.data.map((t) => t.token_address)).toEqual(["B"]);
		expect(res2.nextCursor).toBeNull();
	});

	it("filters by query", () => {
		const res = listWithCursor(tokens, { query: "bet" });
		expect(res.data).toHaveLength(1);
		const first = res.data[0]!;
		expect(first.token_address).toBe("B");
	});
});
