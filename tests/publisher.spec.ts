import { computeDiff } from "../src/ws/publisher";
import { UnifiedToken } from "../src/datasources/types";

describe("publisher diff", () => {
	it("detects added, updated, and removed", () => {
		const a: UnifiedToken[] = [
			{ token_address: "A", token_name: "A", token_ticker: "A", price_sol: 1, sources: [] },
			{ token_address: "B", token_name: "B", token_ticker: "B", price_sol: 2, sources: [] },
		];
		const b: UnifiedToken[] = [
			{ token_address: "A", token_name: "A", token_ticker: "A", price_sol: 1.5, sources: [] },
			{ token_address: "C", token_name: "C", token_ticker: "C", price_sol: 3, sources: [] },
		];
		const diff = computeDiff(a, b);
		expect(diff.added.map((t) => t.token_address)).toEqual(["C"]);
		expect(diff.removed).toEqual(["B"]);
		expect(diff.updated.map((t) => t.token_address)).toEqual(["A"]);
	});
});
