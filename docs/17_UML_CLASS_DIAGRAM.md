# 17 — UML Class Diagram

## Class Diagram (backend core)

```
UserRepository      ProductRepository     InventoryRepository   SupplierRepository
  + findByEmail         + findBySku            + findByProduct        + findById
  + findById            + upsert               + findByStatus         + list
  + updateVersion       + search               + adjustQty            + create
                                                 + findExpiring       ...
┌────────────────────── AuthService ──────────────────────┐
│ + register, login, refresh, logout, me                   │
└──────────────────────────┬───────────────────────────────┘
    ┌─────────────┬────────┴─────────────┬───────────────┐
InventoryService  OcrService          AiService        RecommendationService
  + createBatch    + processUpload       + runAll         + list
  + adjust         + review + commit     + forecast       + setStatus
  + expiring                            + expiryRisk
                                        + healthScore

class hierarchy: repositories implement IRepository<T>; services depend on interfaces.
```

## Object Model

```
User ──1:N──▶ InvoiceUpload | Notification | AuditLog | Report
Supplier ──1:N──▶ Inventory | PurchaseOrder
Product ──1:N──▶ Inventory | Sales | Recommendation
```

## State Machines

### InvoiceUpload
`processing → needs_review → committed` / `processing → failed` / `duplicate`

### PurchaseOrder
`draft → placed → received` / `draft|cancelled → cancelled`

### Recommendation
`open → accepted | dismissed`

## Use Case Diagram
Actors: Admin, Manager, Inventory Staff, Viewer.
- Admin: manage users, all CRUD, delete.
- Manager: inventory/product/supplier CRUD, OCR review, sales, PO, reports, accept recs.
- Inventory Staff: product/inventory entry, OCR upload + correction.
- Viewer: view dashboard, reports, recommendations (read-only).
- System: AI daily job, OCR pipeline, notifications.

## Component (package) Diagram
```
client/
  router → pages → components/features → components/ui
  contexts ← services ← api.js
server/
  routes → middleware + validators → controllers → services → repositories → models
  services → ai/ | ocr/ | jobs/ | utils/
```
Full UML diagrams live in `../diagrams/` as Mermaid source.
