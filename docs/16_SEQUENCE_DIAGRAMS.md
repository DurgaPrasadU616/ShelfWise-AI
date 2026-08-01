# 16 — Sequence Diagrams

## 1. Login + Token Refresh
```
Browser              Server (Express)            Mongo
  │ POST /auth/login   │                          │
  │───────────────────▶│ validate+bcrypt          │
  │                    │──────────find user──────▶│
  │                    │◀─────────user───────────│
  │                    │ create access JWT +      │
  │                    │ refresh cookie(rotation) │
  │◀──200 + Set-Cookie─│                          │
  │                    │                          │
  │ GET /me (access)   │ verify JWT               │
  │───────────────────▶│──────────user───────────▶│
  │◀────────200────────│                          │
  │                    │                          │
  │ GET /x (expired)   │ 401                      │
  │───────────────────▶│                          │
  │◀────────401────────│                          │
  │ POST /auth/refresh │ verify cookie, bump ver  │
  │───────────────────▶│─────────update user─────▶│
  │◀──200 + new cookie─│                          │
  │ retry original     │                          │
```

## 2. OCR Invoice → Inventory
```
Browser            OcrService        Vision/Tesseract     Gemini         Mongo
  │ POST upload      │                  │                    │             │
  │─────────────────▶│ enhance image    │                    │             │
  │                  │─────────────────▶│                    │             │
  │                  │◀────────text─────│                    │             │
  │                  │─────────text─────────────────────────▶│             │
  │                  │◀────items(json)────────────────────────│             │
  │                  │ validate items   │                    │             │
  │                  │─────────────────────────save invoice──▶│             │
  │◀──{uploadId,needs_review}───────────────                  │             │
  │ GET :uploadId (poll)                                      │             │
  │───────────────────────────────────────────────────────────▶│             │
  │◀────────extracted items────────────────────────────────────│             │
  │ PUT :uploadId (corrected)                                  │             │
  │────────────────────────────────────validate────────────────│             │
  │─────────────────────────────upsert products/batches───────▶│             │
  │◀──200 committed────────────────────────────────────────────│             │
```

## 3. AI Daily Job
```
Scheduler          AiService        Gemini       Mongo
  │ cron 02:00      │                │             │
  │────────────────▶│ lock guard     │             │
  │                 │─fetch inventory+sales───────▶│
  │                 │ compute forecast/expiry/     │
  │                 │ health (no LLM for math)     │
  │                 │─rule recs────────────────────▶│
  │                 │──rec reasons (batch)────────▶│
  │                 │◀──json───────────────────────│
  │                 │─write recs/notifs/reports────▶│
  │◀──done──────────│                                │
```

## 4. Purchase Order Receive
```
Browser          PoService          Mongo
  │ PUT /receive   │                 │
  │───────────────▶│ validate items  │
  │                │─find order─────▶│
  │                │─create batches─▶│
  │                │─mark received──▶│
  │◀──200──────────│                 │
```
