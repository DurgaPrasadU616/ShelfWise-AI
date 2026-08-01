# 13 — Testing Strategy

Frameworks: **Vitest** (unit), **Supertest** (integration/API), **Playwright** (E2E, optional phase).

## Test Layers

### Unit (server)
- `tests/server/unit` — pure functions: forecasting math, health score, expiry risk, OCR parser, validators, date utils.
- `tests/server/unit/repositories` — Mongoose in-memory (`mongodb-memory-server`) repo CRUD + indexes.
- Services with mocked repositories (DI).

### Integration / API (server)
- `tests/server/integration` — Supertest against a test Express app + in-memory Mongo.
- Auth flow (register → login → refresh → logout, RBAC).
- Products/inventory/suppliers/sales CRUD + validation errors.
- OCR upload → extract → review → commit; duplicate & failure paths.
- Recommendations API; dashboard summary shape; reports generate + download.
- Error handler contract (all codes in doc 11).

### Unit (client)
- `tests/client/unit` — validation schemas, date/format utils, auth interceptor refresh logic (mocked axios).

### Component (client)
- Vitest + Testing Library: StatCard, ExpiryBadge, OcrReviewTable, forms with RHF+Zod, guards (RequireAuth/Role).

### E2E (optional, later phase)
- Playwright: login → upload invoice → review → dashboard KPIs render.

## Coverage Targets
- Server: ≥ 70% statements on `services/`, `ai/`, `ocr/`, `validators/`.
- Client: ≥ 60% on `utils`, `services`, key components.

## Scripts
```
server: npm test, npm run test:unit, npm run test:integration
client: npm test, npm run test:unit, npm run test:e2e (playwright)
```

## Fixtures
- `tests/fixtures/invoice-*.png|txt` sample invoices (clean + rotated + low-quality).
- `tests/fixtures/products.json`, `sales.json` seed data.

## CI Gate
- Lint + unit + integration must pass on PR. Coverage enforced via thresholds.

## Key Negative Tests
- Duplicate upload, duplicate SKU, negative stock, invalid/future expiry, unreadable invoice, Gemini timeout fallback, refresh rotation reuse rejection.
