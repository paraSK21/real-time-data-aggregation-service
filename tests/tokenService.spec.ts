import { TokenService } from "../src/service/tokenService";
import { AppConfig } from "../src/server/config";
import * as dsDex from "../src/datasources/dexscreener";
import * as dsGt from "../src/datasources/geckoterminal";
import * as dsJp from "../src/datasources/jupiter";

const config: AppConfig = {
	port: 0,
	redisUrl: undefined,
	cacheTtlSeconds: 30,
	pollIntervalMs: 5000,
	environment: "test",
};

describe("TokenService", () => {
	it("search merges across sources and caches", async () => {
		jest.spyOn(dsDex, "DexScreenerClient").mockImplementation(() => ({
			name: "dexscreener",
			search: async () => [
				{ token_address: "A", token_name: "Alpha", token_ticker: "ALP", price_sol: 1, source: "dex" },
			],
			byTokenAddress: async () => null,
		}) as any);
		jest.spyOn(dsGt, "GeckoTerminalClient").mockImplementation(() => ({
			name: "geckoterminal",
			search: async () => [
				{ token_address: "A", token_name: "Alpha", token_ticker: "ALP", price_sol: 3, source: "gt" },
				{ token_address: "B", token_name: "Beta", token_ticker: "BET", price_sol: 2, source: "gt" },
			],
			byTokenAddress: async () => null,
		}) as any);
		jest.spyOn(dsJp, "JupiterClient").mockImplementation(() => ({
			name: "jupiter",
			search: async () => [],
			byTokenAddress: async () => null,
		}) as any);

		const svc = new TokenService(config);
		const res1 = await svc.searchTokens("alpha");
		expect(res1).toHaveLength(2);
		const res2 = await svc.searchTokens("alpha");
		expect(res2).toHaveLength(2);
	});
});
