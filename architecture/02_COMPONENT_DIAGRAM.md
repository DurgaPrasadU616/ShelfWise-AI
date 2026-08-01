# 02 — Component Diagram

Source of truth: `docs/03_COMPONENT_DESIGN.md`

## Server Components

```mermaid
flowchart LR
    subgraph Server["Express API"]
        direction TB
        R["routes/"]
        MW["middleware/<br/>auth · rbac · rate-limit<br/>sanitize · upload · error"]
        V["validators/"]
        C["controllers/"]
        S["services/"]
        R2["repositories/"]
        M["models/"]
        UT["utils/"]

        R --> MW
        R --> V
        R --> C
        C --> S
        S --> R2
        R2 --> M
        C --> UT
        S --> UT
    end

    subgraph AI["ai/"]
        direction TB
        FC["forecasting.js"]
        EP["expiry.js"]
        DR["discounts.js"]
        SO["stock.js"]
        HS["healthScore.js"]
        REC["recommendations.js"]
        GL["gemini.js"]
        FC --> REC
        EP --> REC
        DR --> REC
        SO --> REC
        HS --> REC
        GL --> REC
    end

    subgraph OCR["ocr/"]
        direction TB
        EN["enhance.js"]
        VR["vision.js"]
        TT["tesseract.js"]
        PR["parser.js"]
        VC["validator.js"]
        EN --> VR
        VR --> TT
        VR --> PR
        TT --> PR
        PR --> VC
    end

    subgraph Jobs["jobs/"]
        AIJ["aiJob.js"]
        ALJ["alertJob.js"]
    end

    S --> AI
    S --> OCR
    AIJ --> S
    ALJ --> S
```

## Client Components

```mermaid
flowchart TB
    subgraph Client["React SPA"]
        RTR["router/"]
        CTX["contexts/"]
        PG["pages/"]
        FEAT["components/features/"]
        UI["components/ui/<br/>shadcn"]
        HOOK["hooks/"]
        SRV["services/"]
        UT2["utils/"]

        RTR --> PG
        PG --> FEAT
        PG --> UI
        FEAT --> UI
        FEAT --> HOOK
        HOOK --> SRV
        SRV --> UT2
        CTX --> PG
        CTX --> FEAT
    end
```

## Interface Matrix

| Server component | Exposes | Consumes |
|---|---|---|
| `routes/` | REST endpoints | controllers |
| `controllers/` | HTTP handlers | services |
| `services/` | business API | repositories, ai/, ocr/ |
| `repositories/` | persistence API | models |
| `ai/` | forecast / expiry / rec API | Gemini |
| `ocr/` | processImage / parseInvoice | Vision, Tesseract |
| `jobs/` | scheduled tasks | services |

| Client component | Exposes | Consumes |
|---|---|---|
| `router/` | guarded routes | pages |
| `pages/` | views | feature components, hooks |
| `features/` | feature UI | ui/, hooks |
| `hooks/` | data-fetch hooks | services |
| `services/` | API client | utils |
