# 06 — System Context Diagram

Source of truth: `docs/01_PROJECT_OVERVIEW.md`

## Context (Level 0 — C4)

ShelfWise AI sits at the center, interacting with four human actor groups and three external systems.

```mermaid
flowchart LR
    subgraph Actors["Human Actors"]
        ADM["👑 Admin<br/>user & system management"]
        MGR["📦 Manager<br/>inventory, OCR review, AI decisions"]
        STF["🧾 Inventory Staff<br/>entry, uploads, corrections"]
        VW["👀 Viewer<br/>read-only analytics"]
    end

    subgraph ShelfWise["ShelfWise AI —<br/>Inventory Intelligence Platform"]
        APP["React SPA (Vercel)"]
        API["Express REST API (Render)"]
        DB[("MongoDB Atlas")]
        JOBS["node-cron jobs"]
        APP <--> API
        API --> DB
        API <--> JOBS
    end

    subgraph External["External Systems"]
        GEM["Google Gemini API"]
        VIS["Google Vision API"]
        TES["Tesseract OCR"]
        GCS["Invoice images / uploads"]
    end

    ADM --> APP
    MGR --> APP
    STF --> APP
    VW --> APP

    API --> GEM
    API --> VIS
    VIS -. fallback .-> TES
    STF --> GCS
    GCS --> API
```

## Boundary Table

| Element | Inside system? | Interaction |
|---|---|---|
| React SPA | Yes | UI consumed by all roles |
| Express API | Yes | REST interface |
| MongoDB Atlas | Yes (owned) | persistence |
| node-cron jobs | Yes | scheduled AI/alerts |
| Gemini API | No | LLM extraction/narratives |
| Vision API | No | OCR recognition |
| Tesseract.js | No (in-process) | OCR fallback |
| Invoice images | No | input artifacts |

## Role Capabilities (context)

| Role | Auth | Inventory | OCR | AI recs | Reports | Users |
|---|---|---|---|---|---|---|
| Admin | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ manage |
| Manager | ✔ | ✔ | ✔ | ✔ accept/dismiss | ✔ | ✘ |
| Inventory Staff | ✔ | entry/adjust | ✔ upload+review | read | ✘ | ✘ |
| Viewer | read | read | ✘ | read | read | ✘ |

## Read-Only / Write Intent

```mermaid
flowchart LR
    U["User"] -->|reads dashboards, reports, recommendations| APP
    U -->|writes inventory, uploads invoices, accepts recs| APP
    SYS["System"] -->|writes recommendations, notifications, reports| APP
    SYS -->|reads inventory + sales| APP
```
