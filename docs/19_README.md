# ShelfWise AI

> AI-Powered Smart Inventory & Expiry Loss Prediction Platform

Reduce retailer losses by predicting expiry, forecasting demand, recommending discounts, and optimizing stock levels.

## Features

- **OCR Invoice Digitization** — upload invoices → Google Vision OCR (Tesseract fallback) → extract products → manual review → commit to inventory
- **AI Recommendations** — expiry prediction, demand forecast, discount suggestions, stock optimization, revenue-saved & loss prediction, inventory health score
- **Dashboard & Analytics** — KPIs, health score ring, forecast/sales charts
- **Reports** — generated + CSV download
- **Role-Based Access** — Admin, Manager, Inventory Staff, Viewer
- **Notifications & Alerts** — low stock, near expiry, expired, AI findings

## Tech Stack

- Frontend: React 19, Vite, Tailwind, shadcn/ui, Framer Motion, RHF + Zod, Recharts
- Backend: Node.js, Express, JWT + HTTP-only refresh cookie, Mongoose, node-cron
- AI: Google Gemini API, Google Vision API, Tesseract.js fallback, time-series forecasting (MA / exponential smoothing + seasonality)
- Deploy: Vercel (client), Render (server), MongoDB Atlas (db)

## Repo Layout

```
client/            React SPA
server/            Express API
docs/              01–19 specification (source of truth: ../spec.md)
architecture/      ADRs / architecture records
database/          schemas & seed data
diagrams/          Mermaid diagrams
tests/             unit/integration/e2e
scripts/           seed-admin, backup, env checks
```

## Getting Started

See `docs/10_DEPLOYMENT.md` and `docs/15_DEVELOPMENT_PHASES.md`.

### Server
```bash
cd server
npm install
cp .env.example .env   # fill MONGODB_URI, JWT secrets, GEMINI_API_KEY
npm run dev            # http://localhost:5000
```

### Client
```bash
cd client
npm install
npm run dev            # http://localhost:5173 (proxies /api → :5000)
```

### Seed Admin
```bash
node scripts/seed-admin.js --email admin@shelfwise.app --password 'change-me'
```

## Docs Index

| # | File | Covers |
|---|---|---|
| 01 | `01_PROJECT_OVERVIEW.md` | mission, goals, roles, success criteria |
| 02 | `02_SYSTEM_ARCHITECTURE.md` | layers, data flow, decisions |
| 03 | `03_COMPONENT_DESIGN.md` | backend + frontend components |
| 04 | `04_DATABASE_DESIGN.md` | collections, indexes, relations |
| 05 | `05_API_SPECIFICATION.md` | endpoints, auth, responses |
| 06 | `06_AI_ENGINE.md` | modules + math |
| 07 | `07_OCR_PIPELINE.md` | pipeline stages |
| 08 | `08_FRONTEND_ARCHITECTURE.md` | client structure |
| 09 | `09_BACKEND_ARCHITECTURE.md` | server structure |
| 10 | `10_DEPLOYMENT.md` | Vercel/Render/Atlas |
| 11 | `11_ERROR_SCENARIOS.md` | error contract |
| 12 | `12_EDGE_CASES.md` | edge behavior |
| 13 | `13_TESTING_STRATEGY.md` | test strategy |
| 14 | `14_CODING_GUIDELINES.md` | conventions |
| 15 | `15_DEVELOPMENT_PHASES.md` | phase gates |
| 16 | `16_SEQUENCE_DIAGRAMS.md` | sequences |
| 17 | `17_UML_CLASS_DIAGRAM.md` | class/state/use-case |
| 18 | `18_SWIMLANE.md` | responsibilities |

## License

Proprietary — internal project.
