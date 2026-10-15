# SyncSpace Client/Server Architecture

## Boundaries

```text
Browser
  React/Vite client (src/)
       |
       | /api through the Vite proxy
       v
Node HTTP server (server/server.mjs)
       |
       v
server/data/state.json
```

- `src/pages`, `src/components`, and `src/context` are presentation and client interaction code.
- `src/data/workspaceStore.ts` is the client state adapter. It keeps the existing synchronous local cache for offline use and mirrors writes to the API.
- `src/api/client.ts` contains the only frontend HTTP transport code.
- `server/server.mjs` owns persistence and exposes workspace state, documents, history, preferences, and health endpoints.
- `server/data/state.json` is a development persistence adapter. Replace it with a database repository before production deployment.

## Commands

```text
npm run dev       # frontend only
npm run server    # API on http://localhost:8787
npm run dev:full  # frontend and API together
npm run build     # production client build
```

The Vite development server proxies `/api` to `http://localhost:8787`. Set `VITE_API_URL` when the client and API are hosted on different origins.

## API surface

- `GET /api/health`
- `GET /api/state`
- `PUT /api/state`
- `GET /api/workspaces/:id`
- `GET /api/workspaces/:id/document`
- `PUT /api/workspaces/:id/document`
- `GET /api/workspaces/:id/history`
- `POST /api/workspaces/:id/history`
- `PUT /api/workspaces/:id/preferences`
