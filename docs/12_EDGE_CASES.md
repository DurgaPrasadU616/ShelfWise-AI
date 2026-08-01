# 12 — Edge Cases

| Edge Case | Behavior |
|---|---|
| Unreadable invoice | Upload `failed`, retry with other engine or manual entry; never create partial data |
| Duplicate invoice upload | Content/name hash check → 409 with `duplicateOf` |
| Expired product already sold | Sales recorded regardless; expiry prediction excludes already-sold qty |
| Zero quantity line | Rejected at validation (422) unless it is a freebie row marked `ignored` |
| Missing expiry date | Item flagged `missing_expiry`; defaults to "no expiry" bucket; excluded from expiry risk, included in stock counts; user may add later |
| Wrong OCR detection | Items with low confidence enter manual review; user corrects before commit |
| Future purchase date | Rejected — purchase date cannot exceed today |
| Leap year expiry | Parse via `Date.UTC` + day validity check (Feb 29 handled) |
| Timezone differences | All dates stored as UTC ISO; compare using UTC day boundaries; display in user local tz |
| Multiple users editing same product | Version-agnostic last-write-wins + audit log; UI refetch + confirm before save |
| Negative stock from adjustment | Rejected unless explicit `allowNegative: false` rule; suggest restock instead |
| Quantity > stock when recording sale | Warn with `insufficient_stock`, allow override only for manager/admin with audit note |
| Product SKU changed by supplier | Upsert creates new product; admin can merge via SKU |
| Gemini unavailable | Rule-based recommendations still produced; UI badge `rule` |
| Vision rate-limited | Fallback Tesseract; degrade gracefully with latency note |
| Very large invoice (500+ lines) | Chunk extraction; cap 1000 lines/upload, remainder rejected with notice |
| Empty inventory at first run | AI job no-ops; dashboard shows empty states, health score 0 with data-completeness note |
| Price discount exceeding cost | `suggestedDiscountPct` capped at 70% and never below unit cost floor |
| Same batch re-committed twice | Unique index `(product,batchNo,expiryDate)` blocks duplicates |
| Reports with huge ranges | Paginate report data; max 1000 rows embedded, remainder streamed in download |
