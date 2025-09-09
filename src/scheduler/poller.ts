import { schedule } from "node-cron";
import { Server } from "socket.io";
import { TokenService } from "../service/tokenService";
import { computeDiff, publishDiff } from "../ws/publisher";

export function startPolling(
	io: Server,
	service: TokenService,
	options: { query: string; intervalMs: number },
): void {
	let prev = service.getAllState();

	const run = async () => {
		try {
			const next = await service.refreshWorkingSet(options.query);
			const diff = computeDiff(prev, next);
			publishDiff(io, diff);
			prev = next;
		} catch (err) {
			// eslint-disable-next-line no-console
			console.error("poll error", err);
		}
	};

	// Run immediately
	void run();

	// Use node-cron to schedule at approximate interval
	const everySeconds = Math.max(Math.round(options.intervalMs / 1000), 1);
	const expr = `*/${everySeconds} * * * * *`;
	schedule(expr, () => void run());
}
