import { Router } from "express";
import { TokenService } from "../service/tokenService";

export function tokensRouter(service: TokenService): Router {
	const router = Router();

    router.get("/", async (req, res) => {
        const { q, limit, cursor, sort, dir } = req.query as Record<string, string | undefined>;

        // If a query is provided, hydrate state with that query on-demand.
        // If no data yet, hydrate with default "bonk" to populate initial list.
        try {
            if (q && q.trim().length > 0) {
                await service.refreshWorkingSet(q.trim());
            } else if (service.getAllState().length === 0) {
                await service.refreshWorkingSet("bonk");
            }
        } catch (e) {
            // ignore hydration errors for response purposes; list() will handle empty state
        }

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
