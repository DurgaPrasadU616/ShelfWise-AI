# 10 — Deployment

Targets: **Vercel** (frontend), **Render** (backend), **MongoDB Atlas** (database).

## Repository Layout (root)
```
ShelfWise-AI/
├── client/     → deployed to Vercel (root = client/)
├── server/     → deployed to Render (root = server/)
├── docs/
├── architecture/
├── database/
├── diagrams/
├── tests/
└── scripts/
```

## MongoDB Atlas
1. Create free M0 cluster.
2. Create DB user (readWrite), add IP allow-list (Render service egress / `0.0.0.0/0` for dev only).
3. `MONGODB_URI` in server env. Enable TLS (default).

## Backend → Render
- **Web Service** from `server/` directory.
- Build: `npm ci && npm run build` (if transpile) — here plain Node, so `npm ci`.
- Start: `npm start` (`node index.js`).
- Env vars: `NODE_ENV=production`, `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL=15m`, `JWT_REFRESH_TTL=7d`, `CLIENT_ORIGIN`, `CORS_ORIGIN`, `GEMINI_API_KEY`, `GOOGLE_APPLICATION_CREDENTIALS` (or `VISION_API_KEY`), `OCR_MAX_IMAGE_SIZE_MB=10`, `RATE_LIMIT_*`.
- Free tier caveat: node-cron only fires while service is awake; add Render "always-on" plan or health-ping to keep awake.

## Frontend → Vercel
- Framework preset: Vite; root directory `client/`.
- Build: `npm ci && npm run build`; output `dist`.
- Env: `VITE_API_URL=https://<render-url>.onrender.com` (or empty → same-origin `/api`).
- `vercel.json` rewrite `{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }` for SPA fallback.
- API proxying: if frontend on Vercel and backend on Render, call absolute `VITE_API_URL`; axios uses it in production, `/api` proxy in dev.

## Cookies & CORS
- Refresh cookie requires HTTPS; set `secure: true` in production.
- `SameSite=Lax`; CORS `origin = CLIENT_ORIGIN`, `credentials: true`.

## Secrets Management
- All secrets via env vars (Render/Vercel dashboards). Never committed.

## Environment Files
- `.env.example` at `server/` and `client/` committed; real `.env` git-ignored.

## CI / Scripts
- `scripts/` root helpers: `seed-admin.js` (creates initial admin), `backup.js`, `check-env.js`.
- Optional GitHub Action: lint + test on push; deploy hooks for Vercel/Render.

## Post-Deploy Checklist
1. Health check `GET /api/health` (public) returns ok.
2. Admin seeded, login works, cookie set over HTTPS.
3. OCR upload works with production keys.
4. Cron produces recommendations on schedule.
5. Audit logs + error monitoring visible.
