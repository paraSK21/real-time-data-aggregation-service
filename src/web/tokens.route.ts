import { Router } from "express";
import { TokenService } from "../service/tokenService";

export function tokensRouter(service: TokenService): Router {
	const router = Router();

	router.get("/", async (req, res) => {
		const { q, limit, cursor, sort, dir } = req.query as Record<string, string | undefined>;
		const response = service.list({
			query: q,
			limit: limit ? Number(limit) : 25,
			cursor: cursor ?? null,
			sortField: (sort as any) ?? "volume",
			sortDirection: (dir as any) ?? "desc",
		});
		res.json(response);
	});

	return router;
}
