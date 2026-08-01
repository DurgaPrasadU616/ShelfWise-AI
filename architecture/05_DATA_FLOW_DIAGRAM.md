# 05 — Data Flow Diagram

Source of truth: `docs/02_SYSTEM_ARCHITECTURE.md`, `docs/07_OCR_PIPELINE.md`, `docs/06_AI_ENGINE.md`

## Primary Data Flows

### D1 — Authentication flow

```mermaid
flowchart LR
    A["User"] -->|credentials| B["/auth/login"]
    B -->|find user + bcrypt| C["Mongo users"]
    C -->|valid| D["Issue JWT + refresh cookie"]
    D -->|Set-Cookie sw_refresh| A
    D -->|accessToken| A
```

### D2 — Invoice → Inventory (OCR flow)

```mermaid
flowchart LR
    A["Upload invoice (multipart)"] --> B["multer in-memory"]
    B --> C["Dedupe check (hash)"]
    C -->|duplicate| X["409 duplicateOf"]
    C -->|new| D["Image enhance (sharp)"]
    D --> E["Vision API"]
    E -->|fail| F["Tesseract fallback"]
    E --> G["raw text"]
    F --> G
    G --> H["Extract items<br/>regex + Gemini"]
    H --> I["Validate items"]
    I --> J["Save invoice_uploads<br/>status: needs_review"]
    J --> K["User reviews/corrects"]
    K --> L["Re-validate + commit"]
    L --> M["upsert products"]
    L --> N["create inventory batches"]
    L --> O["audit_logs"]
    L --> P["mark committed"]
```

### D3 — AI workflow

```mermaid
flowchart TB
    A["Mongo:<br/>inventory · sales · products"] --> B["Daily AI job (02:00)"]
    B --> C["Demand analysis<br/>(MA + exp smoothing + seasonality)"]
    C --> D["Expiry analysis<br/>(daysToExpiry × sellRate)"]
    D --> E["Risk prediction<br/>(loss potential, health score)"]
    E --> F["Recommendation engine<br/>(rules + Gemini narrative)"]
    F --> G["Write:<br/>recommendations · notifications · reports"]
    G --> H["Dashboard queries aggregates"]
```

### D4 — Dashboard data flow

```mermaid
flowchart LR
    A["Mongo aggregates"] --> B["/dashboard/summary"]
    B --> C["KPI stat cards"]
    A --> D["/dashboard/charts"]
    D --> E["Recharts series"]
    A --> F["/dashboard/alerts"]
    F --> G["Alert list + bell"]
```

## Consolidated End-to-End Flow

```mermaid
flowchart LR
    subgraph Inbound["Data In"]
        I1["Manual product/inventory entry"]
        I2["OCR invoice digitization"]
        I3["Sales recording"]
    end
    subgraph Core["Core"]
        C1["Inventory state"]
        C2["Sales history"]
        C3["Expiry/stock rules"]
    end
    subgraph AI["AI Engine"]
        A1["Demand forecast"]
        A2["Expiry prediction"]
        A3["Risk + loss"]
        A4["Health score"]
        A5["Recommendations"]
    end
    subgraph Outbound["Data Out"]
        O1["Dashboard KPIs"]
        O2["Reports / CSV"]
        O3["Notifications"]
    end

    I1 --> C1
    I2 --> C1
    I3 --> C2
    C1 --> A1
    C2 --> A1
    C1 --> A2
    C3 --> A2
    A1 --> A3
    A2 --> A3
    A3 --> A4
    A4 --> A5
    A5 --> O1
    A5 --> O3
    A1 --> O2
    A3 --> O2
```
