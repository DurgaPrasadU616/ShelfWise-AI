# 15 — Development Phases

Ordered, dependency-aware phases. Each phase ends with a review gate against success criteria.

## Phase 0 — Scaffolding
- Create root folders per spec (`client`, `server`, `tests`, `scripts`).
- `server/`: npm init, deps, `config/env.js`, `index.js` health route, dotenv, `.env.example`, logger, error handler skeleton, 404 handler.
- `client/`: Vite react scaffold, Tailwind + shadcn/ui setup, router with empty pages, axios service with interceptor stub.
- Root `README.md` (see doc 19) + git init.
- Gate: `GET /api/health` ok; dev servers run.

## Phase 1 — Auth & Users
- Models: User. Repos/Services/Controllers: auth + users.
- JWT access + HTTP-only refresh cookie with rotation (`refreshTokenVersion`).
- RBAC middleware `requireAuth`, `requireRole`.
- Validators + rate limit on login/register.
- Frontend: AuthContext, Login/Register pages, guards, layout shell.
- Gate: full auth flow + RBAC tests green.

## Phase 2 — Core Inventory Domain
- Models: Product, Inventory, Supplier, Sales, PurchaseOrder (+ repos, services, controllers, validators).
- Unique SKU + `(product,batchNo,expiryDate)` index; stock adjust w/ audit log.
- Frontend: Products, Inventory, Suppliers, Sales, PurchaseOrders pages with CRUD + charts stub.
- Gate: CRUD + validation + edge cases (12) covered by tests.

## Phase 3 — OCR Pipeline
- `ocr/` modules (enhance, vision, tesseract, parser, validator), `InvoiceUpload` model.
- Endpoints upload/poll/review/commit/reject/retry.
- Frontend: InvoiceUploader + OcrReviewTable.
- Gate: sample invoice → extract → commit; duplicate & failure paths tested.

## Phase 4 — AI Engine
- `ai/` modules: forecasting, expiry prediction, discount rec, stock optimization, loss/revenue saved, health score, rule+LLM recommendations.
- `jobs/` node-cron: daily AI + hourly alerts, lock guard.
- Gemini client with timeout + rule fallback.
- Gate: seeded data → recommendations + notifications written; unit tests for math.

## Phase 5 — Dashboard, Reports, Notifications
- Dashboard summary + charts endpoints; Reports generate/download; Notifications API.
- Frontend: Dashboard (stat cards, health ring, charts), Reports page, NotificationBell + page.
- Gate: KPIs match seeded expectations; CSV download works.

## Phase 6 — Polish, Security & Tests
- Full error map audit, rate limits, audit logs on all sensitive ops, seed-admin script.
- Client error boundaries, empty/loading states, a11y pass.
- E2E (Playwright) happy path.
- Gate: full lint + coverage thresholds.

## Phase 7 — Deployment
- Atlas cluster, Render service, Vercel project, env config, vercel.json SPA fallback, post-deploy checklist (doc 10).
- Gate: production login + OCR + cron verified.

## Phase 8 — Release Readiness
- Bug triage, README finalize, cleanup `temp`/duplicates, final review vs success criteria (doc 01).
