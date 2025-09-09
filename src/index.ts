import { createServer } from "http";
import { createApp } from "./server/app";
import { initWebSocket } from "./ws/server";
import { loadConfig } from "./server/config";
import { startPolling } from "./scheduler/poller";
import { TokenService } from "./service/tokenService";

async function main(): Promise<void> {
	const config = loadConfig();
	const tokenService = new TokenService(config);
	const app = createApp(config, tokenService);
	const httpServer = createServer(app);
	const io = initWebSocket(httpServer, config);

	httpServer.listen(config.port, () => {
		// eslint-disable-next-line no-console
		console.log(`Server listening on http://localhost:${config.port}`);
	});

	// Start polling for a default discover query (use a popular term)
	startPolling(io, tokenService, { query: "bonk", intervalMs: config.pollIntervalMs });
}

void main();
