import { Server } from "socket.io";
import { UnifiedToken } from "../datasources/types";

export type TokenDiff = {
	updated: UnifiedToken[];
	added: UnifiedToken[];
	removed: string[]; // token addresses
};

export function computeDiff(prev: UnifiedToken[], next: UnifiedToken[]): TokenDiff {
	const prevMap = new Map(prev.map((t) => [t.token_address, t]));
	const nextMap = new Map(next.map((t) => [t.token_address, t]));

	const updated: UnifiedToken[] = [];
	const added: UnifiedToken[] = [];
	const removed: string[] = [];

	for (const [addr, t] of nextMap) {
		const old = prevMap.get(addr);
		if (!old) {
			added.push(t);
			continue;
		}
		if (
			old.price_sol !== t.price_sol ||
			old.volume_sol !== t.volume_sol ||
			old.market_cap_sol !== t.market_cap_sol ||
			old.price_1hr_change !== t.price_1hr_change
		) {
			updated.push(t);
		}
	}

	for (const [addr] of prevMap) {
		if (!nextMap.has(addr)) removed.push(addr);
	}

	return { updated, added, removed };
}

export function publishDiff(io: Server, diff: TokenDiff): void {
	if (diff.added.length) io.emit("tokens:added", diff.added);
	if (diff.updated.length) io.emit("tokens:updated", diff.updated);
	if (diff.removed.length) io.emit("tokens:removed", diff.removed);
}
