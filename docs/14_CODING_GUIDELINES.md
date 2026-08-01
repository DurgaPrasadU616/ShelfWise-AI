# 14 — Coding Guidelines

## General
- No comments unless they explain non-obvious intent (project default: prefer self-documenting code).
- Kebab-case for files/folders; camelCase for variables/functions; PascalCase for components/classes/models.
- 2-space indentation; single quotes; semicolons; trailing commas.
- Follow existing file conventions before adding new code (this spec is the source of truth).

## Client (React 19 + Vite + JS)
- Components in `src/components/` — one component per file.
- Named exports for hooks/services/constants; default export only for pages.
- Forms: react-hook-form + zodResolver only; schemas centralized in `utils/validation.js`.
- API calls only through `services/*` (never raw fetch/axios in components).
- Props typed via JSDoc `@typedef` or `PropTypes` (no TypeScript per spec).
- Tailwind utility classes; theme tokens from shadcn variables; no inline `<style>`.
- Page data fetching in custom hooks (`useInventory`, ...).

## Server (Node + Express)
- Controllers thin: parse → call service → send standardized response.
- Services hold business logic; repositories hold Mongoose access.
- No Mongoose calls in controllers; no `res` in services (services return data or throw `AppError`).
- Validation via express-validator chains in `validators/`, applied in routes.
- Async handlers wrapped with `asyncHandler`; never unhandled rejections.
- Dates always UTC (`new Date().toISOString()`, `moment-free` date utils).
- Config via `config/env.js` reading `process.env` with defaults; no magic numbers in code — use constants module.

## API Contract
- Responses always `{ success, data }` or `{ success, error }` (doc 05).
- Naming: resources plural in routes; `_id` internal, `id` in API responses.
- HTTP status codes per doc 11.

## Security Rules
- No secrets in code or logs. No console.log of tokens/passwords.
- All write endpoints validated + role-checked.
- `req.body` sanitized via `express-mongo-sanitize` globally.

## Git Hygiene
- Feature branches (`feat/ocr`, `fix/expiry`); PRs squashed.
- Conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `chore:`, `refactor:`.
- Never commit `.env`, `node_modules`, `dist`, OCR image uploads.

## Do NOT Create
- `frontend/`, `backend/`, `src_old/`, `temp/`, duplicate folders (spec.md).
