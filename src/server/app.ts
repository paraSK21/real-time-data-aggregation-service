import cors from "cors";
import express, { Request, Response } from "express";
import path from "path";
import { AppConfig } from "./config";
import { healthRouter } from "../web/health.route";
import { tokensRouter } from "../web/tokens.route";
import { TokenService } from "../service/tokenService";

export function createApp(config: AppConfig, tokenService: TokenService) {
	const app = express();
	app.use(cors());
	app.use(express.json());

	app.use("/health", healthRouter());
	app.use("/api/tokens", tokensRouter(tokenService));

	// Serve static frontend at /app
	app.get("/app", (_req: Request, res: Response) => {
		res.sendFile(path.join(process.cwd(), "public", "index.html"));
	});

	app.get("/", (_req: Request, res: Response) => {
		res.json({ name: "real-time-data-aggregation-service", status: "ok" });
	});

	return app;
}
