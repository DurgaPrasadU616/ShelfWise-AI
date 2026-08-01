# 18 — Swimlane Diagram

Swimlanes: **Inventory Staff** | **Manager** | **AI Engine** | **System (cron)**

```
┌ Inventory Staff ──────────┐ ┌ Manager ────────────────┐ ┌ AI Engine ─────────┐ ┌ System ─────────────┐
│ Upload invoice           │ │                          │ │                    │ │ daily cron 02:00    │
│   (OCR pipeline)         │ │                          │ │                    │ │  · forecast         │
│ Review extracted items   │ │                          │ │                    │ │  · expiry risk      │
│  → commit                │ │                          │ │                    │ │  · health score     │
│ Record manual stock entry│ │                          │ │                    │ │  · rule recs        │
└──────────────────────────┘ │                          │ │  LLM enrich reasons│ │  · notifications    │
                             │ Review recommendations  │ │◀────────────────────│  · reports           │
                             │  → accept/dismiss       │ │                    │ └─────────────────────┘
                             │ Generate report / CSV   │ │                    │
                             │ Manage suppliers & POs  │ │                    │
                             │ Receive PO → stock-in   │ │                    │
                             └─────────────────────────┘ └────────────────────┘

Admin: cross-cut — manage users, settings, audit view (lane omitted for brevity).
```

## Key Handoffs
1. **Staff → System**: invoice upload triggers OCR pipeline (async), status polled.
2. **System → Staff**: `needs_review` notification → review UI.
3. **Staff → Manager**: committed inventory feeds dashboard + AI.
4. **AI → Manager**: daily recommendations + notifications; manager accepts/dismisses.
5. **Manager → Staff**: reorder decisions → PO placed → received (stock-in).

## Parallelism
- OCR commits (Staff) and AI daily job run independently; AI reads committed data only (sees `committed` uploads reflected in inventory).
- Dashboard shows real-time aggregates + last AI run timestamp.
