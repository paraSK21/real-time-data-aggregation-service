import { mergeTokens } from "../src/aggregation/merge";
import { RawToken } from "../src/datasources/types";

describe("mergeTokens", () => {
	it("deduplicates by address and combines sources", () => {
		const raws: RawToken[] = [
			{ token_address: "A", token_name: "Alpha", token_ticker: "ALP", price_sol: 1, source: "s1" },
			{ token_address: "a", token_name: "Alpha", token_ticker: "ALP", price_sol: 3, source: "s2" },
		];
		const merged = mergeTokens(raws);
		expect(merged).toHaveLength(1);
		const first = merged[0]!;
		expect([...first.sources].sort()).toEqual(["s1", "s2"]);
		// average price
		expect(first.price_sol).toBe(2);
	});
});
