import { createCache } from "../src/cache/cache";

describe("cache (in-memory)", () => {
	it("sets and gets values", async () => {
		const cache = createCache(undefined);
		await cache.set("k1", { a: 1 }, 5);
		const v = await cache.get<{ a: number }>("k1");
		expect(v?.a).toBe(1);
	});

	it("deletes values", async () => {
		const cache = createCache(undefined);
		await cache.set("k2", "x", 5);
		await cache.del("k2");
		const v = await cache.get("k2");
		expect(v).toBeNull();
	});
});
