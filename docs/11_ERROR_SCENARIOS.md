# 11 — Error Scenarios

Centralized `AppError(code, message, status, details)` + global error handler.

## API Error Map

| Scenario | Status | Code | Handling |
|---|---|---|---|
| Validation failed | 422 | `VALIDATION_ERROR` | details = field errors |
| Unauthorized / bad token | 401 | `UNAUTHORIZED` | clear cookie, frontend redirect |
| Forbidden role | 403 | `FORBIDDEN` | RBAC middleware |
| Duplicate product SKU | 409 | `DUPLICATE_SKU` | upsert or prompt merge |
| Duplicate invoice upload | 409 | `DUPLICATE_UPLOAD` | `duplicateOf` id returned |
| Negative stock / invalid qty | 422 | `INVALID_QUANTITY` | reject adjust |
| Invalid expiry date | 422 | `INVALID_EXPIRY` | reject/prompt correction |
| Not found | 404 | `NOT_FOUND` | resource id |
| OCR failure | 422 | `OCR_FAILED` | retry other engine |
| Gemini timeout | 502 | `AI_TIMEOUT` | fallback rule text |
| Mongo connection failure | 503 | `DB_UNAVAILABLE` | health check + retry backoff |
| Network timeout (axios) | 504 | `NETWORK_TIMEOUT` | client retry (≤3, exp backoff) |
| Rate limited | 429 | `RATE_LIMITED` | Retry-After header |
| File too large / wrong type | 413/415 | `INVALID_FILE` | multer limits |
| Internal error | 500 | `INTERNAL` | sanitized message, logged |

## OCR-Specific
- Vision API quota/5xx → automatic Tesseract fallback.
- Tesseract produces garbage → low-confidence items flagged for manual review, not dropped.
- Zero items extracted → `OCR_FAILED` with guidance.

## AI-Specific
- Gemini timeout → rule fallback text, `source: 'rule'`.
- Gemini malformed JSON → retry once with "return only JSON", then rule fallback.
- Empty sales window → forecast 0 with `confidence: 'low'`.

## Concurrency / Data
- Two users editing same inventory → last-write-wins by design, audit-logged; frontend refetches before save.
- Cron overlapping runs → process lock flag (`jobs/lock`) prevents double write.

## Frontend Handling
- 401 on any request → single-flight refresh → retry; on refresh failure → logout + redirect `/login`.
- 409 duplicate upload → show existing upload link.
- 422 → inline field errors from `details`.
