# 03 — Component Design

## Backend Components

### 1. Auth Module
- `AuthController` / `AuthService` / `UserRepository`
- Register, login, logout, refresh token rotation, me
- JWT access token (short-lived, e.g. 15m) + refresh token (HTTP-only cookie, e.g. 7d)
- bcrypt password hashing (cost 10)
- Roles: `admin | manager | inventory_staff | viewer`

### 2. Product Module
- Product catalog: name, SKU, category, unit, brand, description
- Duplicate detection by SKU/name (normalized)
- CRUD by Manager/Admin

### 3. Inventory Module
- Stock lines: product ref, quantity, unit cost, expiry date, batch no, location, supplier ref
- Validation: `quantity >= 0`, expiry in the future at entry, no duplicate `(product, batch, expiry)`
- Low-stock + near-expiry computed flags

### 4. Supplier Module
- CRUD suppliers: name, contact, email, phone, address

### 5. Sales Module
- Record sales against products (qty, price, date)
- Feeds demand forecasting + revenue saved calc

### 6. Purchase Order Module
- Create orders from inventory needs / invoices; mark received → auto stock-in

### 7. OCR Module
- `OcrController` → `OcrService` → `InvoiceParser`
- Pipeline: upload → enhance → recognize (Vision/Tesseract) → extract items → validate → stage for manual correction → commit
- Persists `invoice_uploads` with raw + extracted payload

### 8. Recommendation Module
- Reads AI outputs; exposes actionable recommendations list
- Types: `discount`, `restock`, `dispose`, `donate`, `reprice`

### 9. Dashboard Module
- Aggregates KPIs + trend series (Recharts-friendly) + health score

### 10. Reports Module
- Report generation (CSV/JSON), saved to `reports` collection + downloadable endpoint

### 11. Notifications Module
- In-app notifications; created by AI job or user actions; unread badge

### 12. Audit Log Module
- Writes to `audit_logs` for sensitive operations (login, delete, invoice commit)

### 13. Scheduler (node-cron)
- Daily: recompute forecasts, expiry risk, health score, notifications
- Hourly: low-stock alerts, expired detection

## Frontend Components

### Shared / UI (`components/ui`)
- Button, Input, Select, Table, Badge, Card, Dialog, Sheet, Toast, Skeleton, Tabs, Alert, Pagination, DropdownMenu, DatePicker — shadcn/ui primitives

### Feature (`components/features`)
- `ProductForm`, `InventoryTable`, `ExpiryBadge`, `StockLevelBadge`, `InvoiceUploader`, `OcrReviewTable`, `RecommendationCard`, `NotificationBell`, `StatCard`, `HealthScoreRing`, `ForecastChart`, `SalesTrendChart`

### Layouts (`layouts/`)
- `AuthLayout`, `DashboardLayout` (sidebar + topbar), `ErrorLayout`

### Pages (`pages/`)
- Login, Register, Dashboard, Products, Inventory, Suppliers, Sales, PurchaseOrders, OCR (Upload + Review), Recommendations, Reports, Notifications, Settings, Users (admin), NotFound

### Contexts
- `AuthContext`, `ToastContext`, `ThemeContext`

### Services (`services/`)
- `api.js` (axios instance + refresh interceptor), feature API modules

### Router
- Guarded routes by role; redirect when no token; lazy-loaded pages

## Cross-Cutting Components
- Error boundary, loading states, empty states, pagination, RBAC hook `usePermission`
