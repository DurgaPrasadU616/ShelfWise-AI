# 09 — Backend Architecture

Location: `server/` | Node.js + Express.js (CommonJS or ESM — ESM chosen for modern tooling)

## Bootstrap
- `npm init -y` then: express, mongoose, jsonwebtoken, bcryptjs, helmet, cors, morgan, express-validator, multer, dotenv, node-cron, express-rate-limit, express-mongo-sanitize, sharp (OCR enhancement), @google-cloud/vision (optional), tesseract.js (fallback), cookie-parser.

## Folder Layout
```
server/
├── config/        # env, db, passport-like auth config
├── controllers/
├── routes/
├── middleware/
├── services/
├── repositories/
├── models/
├── validators/
├── jobs/
├── ai/            # gemini.js, forecasting.js, recommendations.js, healthScore.js
├── ocr/           # enhance.js, vision.js, tesseract.js, parser.js, validator.js
└── utils/         # ApiError, asyncHandler, logger, dates, ids
```

## Request Lifecycle
```
middleware: helmet → cors → morgan → rate-limit → cookie-parser → json → sanitize
  → route → validators → controller → service → repository → model
errors bubble up to centralized error handler (AppError → status + code).
```

## Dependency Injection
- `services` receive repository instances via constructor (default wiring in `config/container.js`).
- Enables unit testing with mocked repos.

## Repository Pattern
- One repository per model: `UserRepository`, `ProductRepository`, `InventoryRepository`, `SupplierRepository`, `SalesRepository`, `PurchaseOrderRepository`, `RecommendationRepository`, `NotificationRepository`, `AuditLogRepository`, `ReportRepository`, `InvoiceUploadRepository`.
- Repos only speak Mongoose; services only speak repos.

## Security
- helmet defaults, CORS allow-list from env, rate limits, mongo sanitization, express-validator on writes, JWT + RBAC middleware, bcrypt hashing, HTTP-only refresh cookie, `SameSite=Lax`.

## Auth Details
- `POST /auth/login` → issue access JWT (15m) + set refresh cookie (7d).
- `POST /auth/refresh` → verify refresh, rotate (bump `refreshTokenVersion`), new access + new cookie.
- `POST /auth/logout` → clear cookie + bump version.
- `requireAuth` + `requireRole(...)` middleware chain.

## Jobs (node-cron)
- `expiryJob.js` (hourly): detect newly expired, low stock → notifications.
- `aiJob.js` (daily 02:00): run AI engine → recommendations, notifications, reports.
- Jobs run in isolated process where feasible; guard against overlapping runs via a lock flag.

## Logger
- `morgan` for HTTP; `utils/logger.js` (console + optional file) for app/AI/OCR events. Never log tokens or passwords.

## Error Handling
- Central `errorHandler` maps `AppError` → `{ success:false, error }`.
- Unknown errors → 500 with sanitized message (hide stack in production).
- 404 handler for unmatched routes.

## Validation
- express-validator chains defined in `validators/*.js`, applied per route; first error returned as 422.
