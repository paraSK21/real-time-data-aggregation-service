import request from "supertest";
import { createApp } from "../src/server/app";
import { loadConfig } from "../src/server/config";
import { TokenService } from "../src/service/tokenService";

describe("routes", () => {
	it("health returns ok", async () => {
		const config = loadConfig();
		const app = createApp(config, new TokenService(config));
		const res = await request(app).get("/health");
		expect(res.status).toBe(200);
		expect(res.body.status).toBe("ok");
	});

	it("tokens returns structure", async () => {
		const config = loadConfig();
		const app = createApp(config, new TokenService(config));
		const res = await request(app).get("/api/tokens");
		expect(res.status).toBe(200);
		expect(res.body).toHaveProperty("data");
	});
});
