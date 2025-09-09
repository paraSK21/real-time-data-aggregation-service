import type { Server as HTTPServer } from "http";
import { Server } from "socket.io";
import { AppConfig } from "../server/config";

let io: Server | null = null;

export function initWebSocket(server: HTTPServer, _config: AppConfig): Server {
	io = new Server(server, { cors: { origin: "*" } });
	io.on("connection", (socket) => {
		socket.emit("connected", { ok: true });
	});
	return io;
}

export function getIo(): Server | null {
	return io;
}
