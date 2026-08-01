# 05 — API Specification (REST API Design)

Base URL: `/api` | Content-Type: `application/json` | UTF-8
Machine-readable Swagger: `../docs/openapi.yaml`

## 0. Conventions

### Authentication
- `Authorization: Bearer <accessToken>` — JWT, TTL 15m.
- Refresh token: HTTP-only cookie `sw_refresh`, TTL 7d, rotated on every refresh.
- Access levels: `Public`, `Auth`, `Manager+`, `Admin`.
  - `Manager+` = `manager | admin`
  - `Admin` = `admin`
- RBAC middleware chain: `requireAuth → requireRole(...)`.

### Response Envelope
```
2xx: { success: true,  data: <payload> }
4xx/5xx: { success: false, error: { code, message, details? } }
```

### Error codes
| Code | Status | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 422 | field errors in `details.fields` |
| `UNAUTHORIZED` | 401 | missing/expired/invalid token |
| `FORBIDDEN` | 403 | role insufficient |
| `NOT_FOUND` | 404 | resource missing |
| `DUPLICATE_SKU` | 409 | product SKU conflict |
| `DUPLICATE_UPLOAD` | 409 | invoice already uploaded |
| `INVALID_QUANTITY` | 422 | negative / non-integer qty |
| `INVALID_EXPIRY` | 422 | bad or past expiry date |
| `INSUFFICIENT_STOCK` | 422 | sale exceeds available |
| `OCR_FAILED` | 422 | extraction failed |
| `AI_TIMEOUT` | 502 | Gemini unavailable |
| `DB_UNAVAILABLE` | 503 | Mongo down |
| `RATE_LIMITED` | 429 | throttled |
| `INVALID_FILE` | 413/415 | upload size/type |
| `INTERNAL` | 500 | unexpected |

### Pagination
Query params `?page=1&limit=20` (limit ≤ 100). Response:
```json
{ "items": [], "total": 0, "page": 1, "limit": 20, "pages": 1 }
```

### Validation format
`details.fields` is an array of `{ path, message }`.

---

## 1. Auth — `/api/auth`

### POST `/api/auth/register`
| Auth | Validation | Request |
|---|---|---|
| Public | name: string 2–80; email: email; password: 8–64 | `{ name, email, password }` |

**Response 201** — role forced `inventory_staff` (registration is staff-only; admins create other roles).
```json
{ "success": true, "data": { "user": { "id": "...", "name": "A", "email": "a@b.c", "role": "inventory_staff" } } }
```
**Status:** 201 | 422 (validation / email taken) | 409 (duplicate email)

### POST `/api/auth/login`
| Auth | Validation | Request |
|---|---|---|
| Public, rate-limited | email, password required | `{ email, password }` |

**Response 200** — sets `sw_refresh` cookie; returns user + access token.
```json
{ "success": true, "data": { "accessToken": "jwt", "expiresIn": 900, "user": { "id": "...", "role": "manager" } } }
```
**Status:** 200 | 401 (`UNAUTHORIZED` invalid creds / inactive user) | 429 | 422

### POST `/api/auth/refresh`
| Auth | Validation | Request |
|---|---|---|
| Public (reads cookie) | — | cookie `sw_refresh` |

**Response 200** — rotates cookie, returns new access token.
```json
{ "success": true, "data": { "accessToken": "jwt", "expiresIn": 900 } }
```
**Status:** 200 | 401 (no/invalid/revoked refresh)

### POST `/api/auth/logout`
| Auth | Validation | Request |
|---|---|---|
| Auth | — | — |

**Response 200** — clears cookie, bumps `refreshTokenVersion`.
```json
{ "success": true, "data": null }
```
**Status:** 200 | 401

### GET `/api/auth/me`
| Auth | Validation | Request |
|---|---|---|
| Auth | — | — |

**Response 200**
```json
{ "success": true, "data": { "user": { "id": "...", "name": "A", "email": "a@b.c", "role": "admin" } } }
```
**Status:** 200 | 401 | 404

---

## 2. Users — `/api/users` (Admin)

### GET `/api/users`
| Auth | Validation | Query |
|---|---|---|
| Admin | — | `?role=&isActive=&q=&page=&limit=` |

**Response 200** — paginated `items[]` (never `passwordHash`).
**Status:** 200 | 401 | 403

### POST `/api/users`
| Auth | Validation | Request |
|---|---|---|
| Admin | name, email, role enum, password (when new) | `{ name, email, password, role, isActive }` |

**Response 201** — created user.
**Status:** 201 | 409 (email) | 422 | 401 | 403

### PUT `/api/users/:id`
| Auth | Validation | Request |
|---|---|---|
| Admin | role enum, isActive bool | `{ role?, isActive? }` |

**Response 200** — updated user.
**Status:** 200 | 404 | 422 | 401 | 403

### DELETE `/api/users/:id`
| Auth | Validation | Request |
|---|---|---|
| Admin | cannot delete self | — |

**Response 200** — soft delete `isActive:false`.
**Status:** 200 | 403 (self) | 404 | 401

---

## 3. Products — `/api/products`

### GET `/api/products`
| Auth | Validation | Query |
|---|---|---|
| Auth | — | `?q=&category=&brand=&isActive=&page=&limit=` |

**Response 200**
```json
{ "success": true, "data": { "items": [{ "id": "...", "name": "Aspirin 500mg", "sku": "ASP-500", "category": "Medicine", "unit": "box" }], "total": 1 } }
```
**Status:** 200 | 401

### POST `/api/products`
| Auth | Validation | Request |
|---|---|---|
| Manager+ | name required; sku required/unique; unit enum; category string | `{ name, sku, category, brand?, unit, description? }` |

**Response 201**
```json
{ "success": true, "data": { "product": { "id": "...", "sku": "ASP-500", "name": "Aspirin 500mg" } } }
```
**Status:** 201 | 409 `DUPLICATE_SKU` | 422 | 401 | 403

### PUT `/api/products/:id`
| Auth | Validation | Request |
|---|---|---|
| Manager+ | same as create (partial) | partial fields |

**Response 200** — updated product.
**Status:** 200 | 404 | 409 | 422 | 401 | 403

### DELETE `/api/products/:id`
| Auth | Validation | Request |
|---|---|---|
| Admin | — | — |

**Response 200** — soft delete `isActive:false, deletedAt`.
**Status:** 200 | 404 | 401 | 403

---

## 4. Inventory — `/api/inventory`

### GET `/api/inventory`
| Auth | Validation | Query |
|---|---|---|
| Auth | — | `?product=&supplier=&status=&nearExpiryDays=&lowStock=true&page=&limit=` |

**Response 200**
```json
{ "success": true, "data": { "items": [{ "id": "...", "product": {"id":"...","name":"..."}, "quantity": 50, "unitCost": 4.2, "expiryDate": "2026-08-15", "batchNo": "B202", "status": "in_stock" }], "total": 1 } }
```
**Status:** 200 | 401

### POST `/api/inventory`
| Auth | Validation | Request |
|---|---|---|
| Manager+ | product ref valid; quantity int ≥ 0; unitCost ≥ 0; expiryDate future (or null); batchNo required; unique `(product, batchNo, expiryDate)` | `{ product, supplier?, quantity, unitCost, expiryDate?, batchNo, location? }` |

**Response 201** — created batch.
**Status:** 201 | 422 | 409 (duplicate batch) | 401 | 403

### PUT `/api/inventory/:id`
| Auth | Validation | Request |
|---|---|---|
| Manager+ | quantity ≥ 0; expiryDate future; unitCost ≥ 0 | partial `{ quantity?, unitCost?, expiryDate?, location? }` |

**Response 200** — updated batch.
**Status:** 200 | 404 | 422 | 401 | 403

### POST `/api/inventory/:id/adjust`
| Auth | Validation | Request |
|---|---|---|
| Manager+ | delta int ≠ 0; reason required | `{ delta, reason }` |

**Response 200** — adjusted batch (audit-logged before/after).
```json
{ "success": true, "data": { "id": "...", "quantity": 45, "previousQuantity": 50, "reason": "damaged goods" } }
```
**Status:** 200 | 422 `INVALID_QUANTITY` | 404 | 401 | 403

### DELETE `/api/inventory/:id`
| Auth | Validation | Request |
|---|---|---|
| Admin | — | — |

**Response 200** — soft delete `isDeleted:true`.
**Status:** 200 | 404 | 401 | 403

### GET `/api/inventory/expiring`
| Auth | Query | Response |
|---|---|---|
| Auth | `?days=14` | `{ items: [...] }` |

### GET `/api/inventory/expired`
| Auth | Response |
|---|---|
| Auth | `{ items: [...] }` (expiryDate < now) |

**Status (both):** 200 | 401

---

## 5. Suppliers — `/api/suppliers`

### GET `/api/suppliers`
| Auth | Query |
|---|---|
| Auth | `?q=&page=&limit=` |

**Response 200** — paginated.
**Status:** 200 | 401

### POST `/api/suppliers`
| Auth | Validation | Request |
|---|---|---|
| Manager+ | name required; email optional valid; phone optional | `{ name, contactName?, email?, phone?, address? }` |

**Response 201** — created.
**Status:** 201 | 409 (name) | 422 | 401 | 403

### PUT `/api/suppliers/:id`
| Auth | Validation | Request |
|---|---|---|
| Manager+ | same as create | partial |

**Status:** 200 | 404 | 422 | 401 | 403

### DELETE `/api/suppliers/:id`
| Auth | Admin | **Status:** 200 | 404 | 401 | 403

---

## 6. Sales — `/api/sales`

### GET `/api/sales`
| Auth | Query |
|---|---|
| Auth | `?product=&from=&to=&page=&limit=` |

**Response 200** — paginated.
**Status:** 200 | 401

### POST `/api/sales`
| Auth | Validation | Request |
|---|---|---|
| Manager+ | product ref; quantity ≥ 1; unitPrice ≥ 0; saleDate ≤ today; check stock | `{ product, quantity, unitPrice, saleDate?, invoiceRef? }` |

**Response 201**
```json
{ "success": true, "data": { "sale": { "id": "...", "product": "...", "quantity": 3, "unitPrice": 5.0, "saleDate": "2026-08-01" } } }
```
**Status:** 201 | 422 `INSUFFICIENT_STOCK` / validation | 401 | 403

### GET `/api/sales/trend`
| Auth | Query | Response |
|---|---|---|
| Auth | `?from=&to=&granularity=daily\|weekly` | `{ series: [{ date, totalUnits, totalRevenue }] }` |

**Status:** 200 | 422 (bad granularity) | 401

---

## 7. Purchase Orders — `/api/purchase-orders`

### GET `/api/purchase-orders`
| Auth | Query |
|---|---|
| Auth | `?status=&supplier=&page=&limit=` |

**Response 200** — paginated.
**Status:** 200 | 401

### POST `/api/purchase-orders`
| Auth | Validation | Request |
|---|---|---|
| Manager+ | orderNo required/unique; items[].product/quantity ≥ 1/unitCost ≥ 0; expectedDate ≥ today | `{ orderNo, supplier?, items: [{ product, quantity, unitCost, expectedDate? }] }` |

**Response 201** — `status: draft`.
**Status:** 201 | 409 (orderNo) | 422 | 401 | 403

### PUT `/api/purchase-orders/:id/place`
| Auth | Manager+ | **Request** — `{ expectedDate? }`
**Response 200** — `status: placed`.
**Status:** 200 | 409 (not draft) | 404 | 401 | 403

### PUT `/api/purchase-orders/:id/receive`
| Auth | Manager+ | **Request** — `{}` or per-item received qty
**Response 200** — creates inventory batches; `status: received`.
**Status:** 200 | 409 (not placed) | 422 | 404 | 401 | 403

### DELETE `/api/purchase-orders/:id`
| Auth | Admin | only `draft`/`cancelled`
**Status:** 200 | 409 (wrong status) | 404 | 401 | 403

---

## 8. OCR — `/api/ocr`

### POST `/api/ocr/upload`
| Auth | Validation | Request |
|---|---|---|
| Manager+ (inventory_staff too) | multipart `file`; mime `png|jpeg|jpg|webp|pdf`; ≤ 10 MB; rate-limited | `multipart/form-data` |

**Response 201** — async processing started.
```json
{ "success": true, "data": { "uploadId": "...", "status": "processing" } }
```
**Status:** 201 | 413/415 `INVALID_FILE` | 409 `DUPLICATE_UPLOAD` | 429 | 401 | 403

### GET `/api/ocr/:uploadId`
| Auth | Request |
|---|---|
| Auth (owner or manager+) | path `:uploadId` |

**Response 200**
```json
{ "success": true, "data": { "uploadId": "...", "status": "needs_review", "extractedItems": [{ "productName": "Aspirin", "sku": "ASP-500", "quantity": 10, "unitCost": 4.2, "expiryDate": "2026-09-01", "lineTotal": 42.0, "errors": [] }] } }
```
**Status:** 200 | 404 | 401 | 403

### PUT `/api/ocr/:uploadId`
| Auth | Validation | Request |
|---|---|---|
| Manager+ (owner or manager+) | `extractedItems` re-validated server-side | `{ extractedItems: [...] }` |

**Response 200** — commit (transactional).
```json
{ "success": true, "data": { "committed": 12, "productsCreated": 4, "batchesCreated": 12, "skippedDuplicates": 1 } }
```
**Status:** 200 | 422 (validation) | 409 (already committed) | 404 | 401 | 403

### POST `/api/ocr/:uploadId/retry`
| Auth | Manager+ | **Request** — `{ engine?: "vision"\|"tesseract" }`
**Response 200** — `status: processing` again.
**Status:** 200 | 404 | 401 | 403

### POST `/api/ocr/:uploadId/reject`
| Auth | Manager+ | **Request** — `{ reason }`
**Response 200** — `status: failed`.
**Status:** 200 | 404 | 401 | 403

---

## 9. Recommendations — `/api/recommendations`

### GET `/api/recommendations`
| Auth | Query |
|---|---|
| Auth | `?type=&status=&priority=&product=&page=&limit=` |

**Response 200**
```json
{ "success": true, "data": { "items": [{ "id": "...", "product": { "id": "...", "name": "Milk" }, "type": "discount", "priority": "high", "reason": "Expires in 5 days", "suggestedDiscountPct": 30, "status": "open", "source": "ai" }], "total": 1 } }
```
**Status:** 200 | 401

### PUT `/api/recommendations/:id/status`
| Auth | Validation | Request |
|---|---|---|
| Manager+ | status ∈ `accepted\|dismissed`; from `open` | `{ status }` |

**Response 200** — updated rec.
**Status:** 200 | 409 (not open) | 422 | 404 | 401 | 403

---

## 10. Dashboard — `/api/dashboard`

### GET `/api/dashboard/summary`
| Auth | Response |
|---|---|
| Auth | KPIs |

```json
{ "success": true, "data": { "totalProducts": 120, "inventoryValue": 45200.5, "nearExpiry": 8, "expired": 2, "lowStock": 5, "fastMoving": 12, "slowMoving": 30, "revenueSaved": 340.0, "predictedLoss": 890.0, "healthScore": 82 } }
```
**Status:** 200 | 401

### GET `/api/dashboard/charts`
| Auth | Response |
|---|---|
| Auth | `{ demandTrend: [...], expiryBuckets: [...], categoryBreakdown: [...], stockStatus: [...], lastAiRun: "2026-08-01T02:00:00Z" }` |

**Status:** 200 | 401

### GET `/api/dashboard/alerts`
| Auth | Response |
|---|---|
| Auth | `{ alerts: [{ id, title, message, type, link, createdAt }], recs: [...] }` (top 5 each) |

**Status:** 200 | 401

---

## 11. Reports — `/api/reports`

### GET `/api/reports`
| Auth | Query |
|---|---|
| Auth | `?type=&page=&limit=` |

**Response 200** — paginated list.
**Status:** 200 | 401

### POST `/api/reports/generate`
| Auth | Validation | Request |
|---|---|---|
| Manager+ | type enum; filters match type | `{ type, filters: { from?, to?, category?, status? } }` |

**Response 201** — generated report saved.
```json
{ "success": true, "data": { "report": { "id": "...", "name": "expiry-report-2026-08-01", "type": "expiry", "generatedBy": "...", "rows": 12 } } }
```
**Status:** 201 | 422 | 401 | 403

### GET `/api/reports/:id`
| Auth | Response |
|---|---|
| Auth | report detail with `data` |

**Status:** 200 | 404 | 401

### GET `/api/reports/:id/download`
| Auth | Response |
|---|---|
| Auth | `Content-Type: text/csv`, `Content-Disposition: attachment` |

**Status:** 200 | 404 | 401

---

## 12. Notifications — `/api/notifications`

### GET `/api/notifications`
| Auth | Query |
|---|---|
| Auth (own) | `?unread=true&page=&limit=` |

**Response 200** — paginated.
**Status:** 200 | 401

### PUT `/api/notifications/:id/read`
| Auth | Response |
|---|---|
| Auth (owner) | `{ success: true, data: { read: true } }` |

**Status:** 200 | 404 | 401 | 403 (other user's notif)

### PUT `/api/notifications/read-all`
| Auth | Response |
|---|---|
| Auth (own) | `{ success: true, data: { updated: n } }` |

**Status:** 200 | 401

---

## 13. Audit Logs — `/api/audit-logs` (Admin)

### GET `/api/audit-logs`
| Auth | Query |
|---|---|
| Admin | `?action=&resource=&from=&to=&page=&limit=` |

**Response 200** — paginated, read-only.
**Status:** 200 | 401 | 403

---

## 14. Health — `/api/health`

### GET `/api/health`
| Auth | Response |
|---|---|
| Public | `{ success: true, data: { status: "ok", uptime: 123, db: "connected", version: "1.0.0" } }` |

**Status:** 200 | 503 (db down)

---

## Rate Limits & Security
- Login/register: 10 req/min/IP. OCR upload: 5 req/min/user. Global: 300 req/min/IP.
- All routes: `helmet`, CORS allow-list, `express-mongo-sanitize`, express-validator on every write.
- `id` params validated as ObjectId; non-matching → 422 `VALIDATION_ERROR`.
