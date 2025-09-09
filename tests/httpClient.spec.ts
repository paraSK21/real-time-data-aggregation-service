import { createHttpClient } from "../src/http/httpClient";
import axios from "axios";

describe("httpClient", () => {
	it("retries and returns data", async () => {
		const retryError = Object.assign(new Error("server error"), { response: { status: 500 } });
		const getMock = jest
			.fn()
			.mockRejectedValueOnce(retryError)
			.mockResolvedValueOnce({ data: { ok: true } });
		const createSpy = jest.spyOn(axios, "create").mockReturnValue({ get: getMock } as any);
		const client = createHttpClient({ retries: 1 });
		const data = await client.get<{ ok: boolean }>("http://x");
		expect(data.ok).toBe(true);
		expect(getMock).toHaveBeenCalledTimes(2);
		createSpy.mockRestore();
	});
});
