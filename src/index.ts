import { createServer } from "http";
import { createApp } from "./server/app";
import { initWebSocket } from "./ws/server";
import { loadConfig } from "./server/config";
import { startPolling } from "./scheduler/poller";
import { TokenService } from "./service/tokenService";

// Try to detect a running ngrok agent on the local machine and return the public URL
async function detectNgrokAppUrl(): Promise<string | null> {
	try {
		// ngrok local API endpoint
		const api = "http://127.0.0.1:4040/api/tunnels";
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 1500);
		const resp = await fetch(api, { signal: controller.signal });
		clearTimeout(timeout);
		if (!resp.ok) return null;
	const body: any = await resp.json();
	const tunnels = body?.tunnels ?? [];
		if (!Array.isArray(tunnels) || tunnels.length === 0) return null;
		// prefer https tunnel if present
		const httpsTunnel = tunnels.find((t: any) => t.proto === "https") || tunnels[0];
		const publicUrl = httpsTunnel?.public_url ?? null;
		if (!publicUrl) return null;
		// ensure no trailing slash and point to /app
		return `${publicUrl.replace(/\/$/, "")}/app`;
	} catch (e) {
		return null;
	}
}

async function main(): Promise<void> {
	const config = loadConfig();
	const tokenService = new TokenService(config);
	const app = createApp(config, tokenService);
	const httpServer = createServer(app);
	const io = initWebSocket(httpServer, config);

	httpServer.listen(config.port, () => {
		// eslint-disable-next-line no-console
		console.log(`Server listening on http://localhost:${config.port}`);

		// Attempt to detect ngrok and log public URL for the frontend
		void (async () => {
			const ngrokUrl = await detectNgrokAppUrl();
			if (ngrokUrl) {
				// eslint-disable-next-line no-console
				console.log(`Ngrok tunnel detected — open frontend at ${ngrokUrl}`);
			} else {
				// eslint-disable-next-line no-console
				console.log("Ngrok tunnel not detected on http://127.0.0.1:4040 — if you're using ngrok run: ngrok http <port>");
			}
		})();
	});

    // Start polling for a default discover query (use a broader term)
    startPolling(io, tokenService, { query: "sol", intervalMs: config.pollIntervalMs });
}

void main();
