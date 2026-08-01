# 02 — System Architecture

## Overview

ShelfWise AI is a client-server web application:

```
┌─────────────┐   HTTPS/REST+JSON   ┌──────────────┐    Mongoose    ┌──────────────┐
│  React 19    │ ─────────────────▶ │  Node/Express │ ─────────────▶ │ MongoDB Atlas │
│  (Vercel)    │ ◀───────────────── │  (Render)     │ ◀───────────── │              │
└─────────────┘                     └──────────────┘                └──────────────┘
                                        │        │
                                        │        └───────────────▶ Google Gemini API
                                        │                          Google Vision API
                                        └────────────────────────▶ Tesseract (fallback)
```

## High-Level Architecture

- **Frontend (SPA)**: React 19 + Vite, consumes REST API, token-based auth via HTTP-only cookies.
- **Backend (API)**: Express.js REST API following Clean Architecture layering.
- **Database**: MongoDB Atlas, single cluster, multiple collections.
- **AI Layer**: Google Gemini API for structured extraction, forecasting support, and recommendations.
- **OCR Layer**: Google Vision API primary, Tesseract fallback, image preprocessing.
- **Scheduler**: node-cron jobs for daily AI recomputation and expiry notifications.

## Backend Layering (Clean Architecture)

```
routes/      → HTTP routing + auth + RBAC middleware
controllers/ → request/response handling, no business logic
services/    → business rules, orchestration (dependency injection point)
repositories/→ data access (Mongoose models), one class per collection
models/      → Mongoose schemas
validators/  → express-validator rule sets
ai/          → Gemini client + forecasting + recommendation engine
ocr/         → image enhancement + Vision/Tesseract + invoice parser
jobs/        → node-cron scheduled tasks
middleware/  → auth, error, rate-limit, sanitize, file upload
```

Dependency rule: `controller → service → repository → model`. Controllers never touch models directly.

## Frontend Layering

```
router/       → React Router route table + guards
contexts/     → Auth context, Toast context, Theme context
pages/        → route-level views
components/   → reusable UI + feature components
services/     → axios API client (auth interceptor, refresh handling)
hooks/        → custom hooks (useAuth, useProducts, useDashboard, ...)
utils/        → formatters, date helpers, constants
styles/       → Tailwind entry, global CSS
assets/       → static images/icons
```

## Data Flow (primary path)

1. User authenticates → server sets `access_token` (short-lived JWT) + `refresh_token` (HTTP-only cookie).
2. User uploads invoice → `POST /api/ocr/upload` → OCR pipeline → proposed products stored on `invoice_uploads`.
3. User reviews/corrects → products validated → written to `inventory` (+ `products`).
4. Cron job runs → reads inventory + sales + expiry → computes forecasts, expiry risk, health score → writes `recommendations`, `notifications`, `reports`.
5. Dashboard reads aggregate data and surfaces alerts + AI recommendations.

## Key Design Decisions

- **Refresh tokens in HTTP-only cookies** (resolves spec ambiguity) — mitigates XSS token theft; CSRF mitigated via `SameSite=Lax` + CORS allow-list.
- **Forecasting: moving average / exponential smoothing** (no heavy dependencies), optional weekly seasonality index; LLM used only for narrative/`recommendations`, not core math.
- **Dependency Injection**: services receive repository instances via constructor; allows test doubles.
- **Modular monolith**: one Express app, feature-scoped routers — deployable as a single Render service.
