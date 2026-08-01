# 08 — Frontend Architecture

Location: `client/` | Build: Vite + React 19 + JavaScript

## Bootstrap
- `npm create vite` (react template), then install: react-router-dom, tailwindcss, shadcn/ui (via CLI), framer-motion, react-hook-form, zod, @hookform/resolvers, axios, recharts, lucide-react, @tanstack/react-query (optional cache layer).
- Vite proxy `/api → http://localhost:5000` for dev.

## Routing (`src/router`)
- `index.jsx` defines route tree.
- Guards: `RequireAuth`, `RequireRole(roles)`.
- Public: `/login`, `/register`. Protected: dashboard, products, inventory, suppliers, sales, purchase-orders, ocr, recommendations, reports, notifications, settings, users(admin).
- Lazy load pages via `React.lazy`.

## State Management
- `AuthContext` — user, login/logout/refresh, role helpers (`can()`).
- `ToastContext` — success/error toasts.
- `ThemeContext` — light/dark.
- Server data via axios services + local hooks; no global store needed (React Query optional).

## Services (`src/services`)
- `api.js` — axios instance, baseURL `/api`, `withCredentials: true`, attaches `Authorization`, single-flight 401 refresh + retry.
- Modules: `auth.js`, `products.js`, `inventory.js`, `suppliers.js`, `sales.js`, `purchaseOrders.js`, `ocr.js`, `recommendations.js`, `dashboard.js`, `reports.js`, `notifications.js`, `users.js`.

## Pages & Key Features
| Page | Highlights |
|---|---|
| Login/Register | RHF + Zod forms |
| Dashboard | StatCards, HealthScoreRing, ForecastChart, SalesTrendChart, alert lists |
| Products | table + CRUD dialog, search |
| Inventory | filters (status/expiring), batch table, adjust qty, expiry badges |
| OCR Upload | drag-drop upload, progress, poll status |
| OCR Review | OcrReviewTable inline edit → commit |
| Recommendations | filterable cards with accept/dismiss |
| Reports | generate + download CSV |
| Notifications | bell dropdown + full page, unread count |
| Users (admin) | manage roles/active |

## Styling
- Tailwind + shadcn/ui components in `src/components/ui`.
- Framer Motion for page transitions, stat animations, recommendation cards.
- Recharts for forecast/sales/category charts.

## Form Handling
- react-hook-form + zodResolver; shared zod schemas in `src/utils/validation.js`.

## Constants (`src/constants`)
- Roles, recommendation types, expiry thresholds, status colors, chart palette.

## Error UX
- Axios error interceptor → toast + optional redirect on 401.
- Error boundary per page; skeleton loading; empty-state components.
