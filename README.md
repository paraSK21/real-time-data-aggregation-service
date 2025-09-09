# Real-time Data Aggregation Service

Aggregates real-time meme coin data from multiple DEX sources, exposes REST and WebSocket APIs, with caching and periodic updates.

## What this does (overview)
- Fetches token data from real APIs: DexScreener, GeckoTerminal, Jupiter
- Merges duplicate tokens (same token from multiple sources)
- Caches responses (Redis if configured, otherwise fast in-memory cache)
- Pushes real-time diffs over WebSocket (Socket.io): added / updated / removed tokens
- Supports filtering, sorting, and cursor-based pagination over a working set
- Rate limiting + exponential retry/backoff to handle API limits and transient errors
- Scheduler runs at a fixed interval to refresh the working set
- 10+ Jest tests passing; Postman collection included

## Folder structure (important files)
- `src/index.ts` → App entry: creates HTTP + WS server and starts scheduler
- `src/server/app.ts` → Express app factory, wires up routes
- `src/web/*.ts` → REST routes
- `src/ws/*.ts` → WebSocket server + diff publisher
- `src/scheduler/poller.ts` → Polling scheduler
- `src/datasources/*.ts` → DEX source clients
- `src/aggregation/*.ts` → merge, filter/sort, pagination helpers
- `src/cache/cache.ts` → Redis/in-memory cache layer
- `src/service/tokenService.ts` → Aggregation + state service
- `tests/*.spec.ts` → Unit/integration tests (Jest)
- `postman/collection.json` → Postman collection

## Prerequisites
- Node.js 18+
- Windows PowerShell or any terminal
- Optional: Docker Desktop (if you want Redis)

## Quickstart (beginner-friendly)

### 1) Create .env
Copy and paste this into a new file named `.env` in the project root:
```env
PORT=4000
# Uncomment to use Redis cache (otherwise in-memory cache is used)
# REDIS_URL=redis://localhost:6379
CACHE_TTL_SECONDS=30
POLL_INTERVAL_MS=5000
NODE_ENV=development
```

### 2) Install dependencies
```powershell
npm install
```

### 3) Start the server (development)
```powershell
npm run dev
```
Expected output: `Server listening on http://localhost:4000`.
Keep this terminal open.

### 4) Verify REST API (new terminal)
- Root
```powershell
curl http://localhost:4000/
```
- Health
```powershell
curl http://localhost:4000/health
```
- Tokens (quote URLs with ? and & in PowerShell)
```powershell
curl "http://localhost:4000/api/tokens?limit=25&sort=volume&dir=desc"
```
Note: It may return `{"data":[],"nextCursor":null}` for a few seconds right after startup. Wait ~10–20s and retry.

### 5) Optional: WebSocket test (new terminal)
```powershell
Set-Content -Encoding UTF8 ws-test.js @'
const { io } = require("socket.io-client");
const s = io("http://localhost:4000");
s.on("connected", (m) => console.log("connected", m));
s.on("tokens:added", (d) => console.log("added", d.length));
s.on("tokens:updated", (d) => console.log("updated", d.length));
s.on("tokens:removed", (d) => console.log("removed", d.length));
'@
node .\ws-test.js
```
You’ll see events as the scheduler detects changes.

### 6) Optional: Enable Redis caching
- Start Redis via Docker:
```powershell
docker run --name redis-stack -p 6379:6379 -d redis/redis-stack-server:latest
```
- Point the app to Redis and restart the dev server:
```powershell
(Get-Content .env) -replace '^# REDIS_URL=.*','REDIS_URL=redis://localhost:6379' | Set-Content .env
# Stop the server (Ctrl + C), then
npm run dev
```

## Changing the default poll query
The scheduler uses a default query to build the working set. In `src/index.ts`:
```ts
startPolling(io, tokenService, { query: "bonk", intervalMs: config.pollIntervalMs });
```
You can change `"bonk"` to `"wif"`, `"sol"`, or any term you prefer, then restart `npm run dev`.

## REST API details
- GET `/` → `{ name, status }`
- GET `/health` → `{ status }`
- GET `/api/tokens` → List tokens
  - Query parameters:
    - `q`: search text (optional)
    - `limit`: 1–100 (default 25)
    - `sort`: `price|volume|market_cap|liquidity|tx_count|price_change` (default `volume`)
    - `dir`: `asc|desc` (default `desc`)
    - `cursor`: opaque cursor from previous response
  - Response:
```json
{ "data": [ /* tokens */ ], "nextCursor": "... or null" }
```

## Tests
```powershell
npm test
```
All tests should pass (10+).

## Typecheck & Lint
```powershell
npm run typecheck
npm run lint
```

## Postman
Import `postman/collection.json` and run the requests.

## Troubleshooting
- Port in use (`EADDRINUSE`): free the port or use another port temporarily
```powershell
# Free 4000
taskkill /PID (netstat -ano | findstr :4000 | Select-String -Pattern "\d+$").Matches.Value /F
# Or use a different PORT for this session
$env:PORT=4001; npm run dev
```
- Empty data list: wait ~10–20 seconds; or change the default poll query in `src/index.ts` to something popular (`bonk`, `wif`, `sol`).
- Windows quoting: wrap URLs with `?` or `&` in double quotes, e.g. `"http://...?...&..."`.

## Submission (you push; commands below)
```powershell
cd C:\Users\kukre\Downloads\real-time-data-aggregation-service
git init
git add .
git commit -m "feat: complete real-time aggregation service (REST+WS), caching, tests"
git branch -M main
git remote add origin <your_repo_url>
git push -u origin main
```

## Notes on design
- HTTP client: Bottleneck for rate limiting; custom retry with exponential backoff
- Data sources: DexScreener, GeckoTerminal (404s handled quietly), Jupiter
- Aggregation: merges duplicates, averages price, sums volumes, dedupes sources
- Cache: Redis via `ioredis` if `REDIS_URL` set; otherwise in-memory map
- Real-time: Scheduler computes diffs and emits over Socket.io
- Pagination: Cursor encodes the next index and the applied sort

