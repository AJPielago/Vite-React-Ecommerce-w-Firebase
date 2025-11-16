## Purpose

This file gives concise, repo-specific guidance so an AI coding assistant can be immediately productive in this e-commerce project.

## Big picture (what to read first)
- Backend: Node/Express + Mongoose. Entry point: `backend/server.js` (mounts routers and sets CORS). Routes live in `backend/routes/` and business logic in `backend/controllers/`.
- Frontend: React (Vite). Entry: `frontend/src/main.jsx` / `frontend/src/App.jsx`. Vite dev server config in `frontend/vite.config.js` (proxy `/api` -> `http://localhost:5000`).
- Data flow: frontend calls `/api/*` endpoints; backend exposes auth at `/api/v1/auth` (note: some routes use `/api/products` without `/v1`). Verify exact route strings in `backend/server.js` and each route file.

## Critical developer workflows
- Local dev (separate):
  - Backend: `cd backend` then `npm install` and `npm run dev` (nodemon) — server listens on 5000. See `backend/package.json` scripts.
  - Frontend: `cd frontend` then `npm install` and `npm run dev` — vite dev server on 3000 with HMR. Proxy rules in `frontend/vite.config.js`.
- Docker: root `docker-compose.yml` currently defines only a frontend service (bind-mount dev mode). There is `backend/Dockerfile` and `frontend/Dockerfile` if you want to containerize both; no multi-service compose for backend by default.
- Production build: `cd frontend && npm run build` to create optimized assets. Backend uses `npm start` (node server.js). `backend/Procfile` exists for some PaaS (Heroku-style) deployments.

## Project-specific conventions & patterns
- Module systems: backend uses CommonJS (require/module.exports); frontend is ESM (`type: module` in `frontend/package.json`). Respect each environment when editing or adding files.
- Async handling: controllers commonly use `express-async-handler` or a custom `middleware/async.js`. Prefer pattern used in `backend/controllers/*.js` when adding new async routes.
- Error handling: central `backend/middleware/error.js` and `utils/errorResponse.js` are used for errors — throw or pass errors to `next()` so the middleware formats responses consistently.
- Auth & roles: JWT + cookies with `cookie-parser`. Auth routes: `backend/routes/auth.js` and middleware `backend/middleware/auth.js`. Admin-only checks are implemented in these middlewares — follow them when adding protected endpoints.
- File uploads: `multer` + Cloudinary integration (see `backend/config/cloudinary.js` and `utils/cloudinary.js`). Upload routes are under `backend/routes/upload.js`.

## Integration points & external deps to be aware of
- Cloudinary: configured in `backend/config/cloudinary.js` and referenced in controllers for image uploads.
- Firebase: frontend contains `frontend/firebase.js` for any client-side auth/storage; don't mix server-side cloud SDKs with client usage.
- MongoDB: connection string controlled by `MONGODB_URI` in `backend/.env`. Sample in `README.md`.

## Common inconsistencies & gotchas
- Route prefix mismatch: `server.js` mounts auth at `/api/v1/auth` while other routes use `/api/products` (no `/v1`). When implementing clients or automated tests, always read the mounted path in `backend/server.js` and the route file. Prefer exact strings from code, not memory.
- CORS and cookies: `server.js` sets `origin` to `http://localhost:3000` and `credentials: true`. When testing from other origins or using Docker, update CORS and proxy accordingly.
- Docker compose: current `docker-compose.yml` only defines the frontend service (dev-friendly). For a full docker-compose dev env, add backend and MongoDB services explicitly.

## Quick examples (where to change behavior)
- Add a protected products route: follow `backend/routes/products.js` and use `backend/middleware/auth.js` (see existing pattern in `routes/*`).
- Change vite proxy: update `frontend/vite.config.js` where `/api` proxies to `http://localhost:5000`.

## Files to inspect when working on changes
- `backend/server.js` (CORS, route mounts, DB connect)
- `backend/routes/` and `backend/controllers/` (routing + logic)
- `backend/middleware/` (auth, error handling, async wrapper)
- `backend/config/cloudinary.js` and `utils/cloudinary.js` (image uploads)
- `frontend/vite.config.js` (dev proxy), `frontend/src/context/` (AuthContext, CartContext), and `frontend/src/services/api.js` (axios usage)

## When to ask the human
- Missing env values (Cloudinary, JWT secret, MONGODB_URI) — request the `.env` values or a test account.
- Clarify intended route prefixes (v1 vs non-v1) if adding cross-cutting features or tests.

If you want, I can now:
- create or update this file in the repo (I will merge if an existing file exists), or
- expand any section with examples or tests (e.g., small integration test that hits auth + products).

---
Note: If an existing `.github/copilot-instructions.md` is present, merge by preserving custom content; otherwise this file is safe to add as a starting point.
