# 03 — Deployment Diagram

Source of truth: `docs/10_DEPLOYMENT.md`

Targets: **Vercel** (frontend), **Render** (backend), **MongoDB Atlas** (database),
**Google Cloud** (Gemini + Vision), **local browser** (Tesseract.js runs server-side in Node as fallback).

```mermaid
flowchart TB
    subgraph UserDevice["User Device"]
        BR["Browser<br/>React SPA bundle<br/>(static assets)"]
    end

    subgraph Vercel["Vercel — Frontend Hosting"]
        V_STATIC["Static Assets<br/>client/dist"]
        V_REWRITE["vercel.json SPA rewrite<br/>→ /index.html"]
    end

    subgraph Render["Render — Backend Hosting"]
        direction TB
        R_NODE["Node.js Web Service<br/>npm ci && npm start"]
        R_ENV["Environment:<br/>MONGODB_URI · JWT_SECRETS<br/>GEMINI_API_KEY · CORS_ORIGIN"]
        R_CRON["node-cron jobs<br/>AI (daily) · Alerts (hourly)"]
    end

    subgraph Atlas["MongoDB Atlas (M0)"]
        ATLAS["Cluster<br/>ShelfWise collections"]
    end

    subgraph GCP["Google Cloud"]
        GEM["Gemini API"]
        VIS["Vision API"]
    end

    TT["Tesseract.js worker<br/>(Node fallback)"]

    BR -->|HTTPS 443| V_STATIC
    V_REWRITE -.-> V_STATIC
    BR -->|HTTPS /api → VITE_API_URL| R_NODE
    R_NODE -->|Mongoose TLS 27017| ATLAS
    R_NODE -->|HTTPS| GEM
    R_NODE -->|HTTPS| VIS
    R_NODE -. OCR fallback .-> TT
    R_CRON --> R_NODE
```

## Deployment Nodes

| Node | Type | Purpose | Key config |
|---|---|---|---|
| Vercel | PaaS (static) | Host React SPA | root=`client/`, build `npm ci && npm run build`, SPA rewrite |
| Render | PaaS (web service) | Host Express API + cron | root=`server/`, start `npm start`, always-on to keep cron alive |
| MongoDB Atlas | DBaaS | Persistence | M0 cluster, TLS, IP allow-list |
| Google Cloud | External API | Gemini + Vision | API keys / service account |
| Tesseract.js | In-process | OCR fallback | bundled worker, no external host |

## Network & Security

```mermaid
sequenceDiagram
    participant B as Browser
    participant V as Vercel
    participant R as Render
    participant D as Atlas
    B->>V: GET / (SPA)
    B->>R: POST /api/auth/login (JSON)
    R-->>B: 200 + Set-Cookie sw_refresh (Secure, SameSite=Lax)
    B->>R: GET /api/dashboard (Bearer JWT)
    R->>D: Mongoose queries (TLS)
    D-->>R: data
    R-->>B: JSON response
```

- Refresh cookie: `Secure` in production, `SameSite=Lax`, `HttpOnly`.
- CORS: allow only `CLIENT_ORIGIN`, `credentials: true`.
- Secrets: injected via platform env vars; `.env.example` committed, real `.env` ignored.

## Environments

| Env | Client origin | API URL | Notes |
|---|---|---|---|
| dev | `http://localhost:5173` | `/api` (Vite proxy → `:5000`) | local Mongo or Atlas dev cluster |
| prod | Vercel domain | Render URL | Atlas prod cluster, cron active |
