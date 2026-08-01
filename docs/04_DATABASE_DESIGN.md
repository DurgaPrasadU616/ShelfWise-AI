# 04 — Database Design

DB: **MongoDB Atlas** | ODM: **Mongoose**

## Collections

### `users`
```
{ _id, name, email (unique, index), passwordHash, role,
  isActive, refreshTokenVersion, createdAt, updatedAt }
```
- `role ∈ {admin, manager, inventory_staff, viewer}`
- `refreshTokenVersion` allows server-side invalidation of sessions.

### `products`
```
{ _id, name, sku (unique, index), category, brand, unit,
  description, isActive, createdAt, updatedAt }
```

### `inventory`
```
{ _id, product (ref products), supplier (ref suppliers),
  quantity, unitCost, expiryDate (index), batchNo,
  location, receivedAt, status: 'in_stock'|'low'|'expired',
  createdAt, updatedAt }
```
- Unique compound index `(product, batchNo, expiryDate)` to block duplicate batches.

### `suppliers`
```
{ _id, name, contactName, email, phone, address, createdAt, updatedAt }
```

### `sales`
```
{ _id, product (ref), quantity, unitPrice, saleDate (index),
  invoiceRef, createdAt }
```
- Index `(product, saleDate)` to power forecasting queries.

### `purchase_orders`
```
{ _id, orderNo, supplier (ref), items: [{ product, quantity, unitCost, expectedDate }],
  status: 'draft'|'placed'|'received'|'cancelled', createdAt, updatedAt }
```
- Received PO → creates/updates inventory lines.

### `recommendations`
```
{ _id, product (ref), type: 'discount'|'restock'|'dispose'|'donate'|'reprice',
  priority: 'high'|'medium'|'low', reason, suggestedDiscountPct,
  suggestedQuantity, expectedOutcome, status: 'open'|'accepted'|'dismissed',
  source: 'ai'|'rule', createdAt }
```
- TTL/index on `createdAt` for cleanup; index `(status, priority)`.

### `notifications`
```
{ _id, userId (ref), title, message, type: 'info'|'warning'|'danger',
  read, link, createdAt }
```

### `audit_logs`
```
{ _id, userId, action, resource, resourceId, details, ip, createdAt }
```

### `reports`
```
{ _id, name, type: 'inventory'|'expiry'|'sales'|'loss'|'demand',
  generatedBy (ref users), filters, data (embedded), createdAt }
```

### `invoice_uploads`
```
{ _id, userId (ref), filename, mimeType, size, ocrEngine,
  rawText, extractedItems: [ { productName, sku, quantity,
  unitCost, expiryDate, lineTotal } ],
  status: 'processing'|'needs_review'|'committed'|'failed',
  error, duplicateOf (ref invoice_uploads), createdAt }
```
- OCR output is staged here BEFORE manual correction; commit only after user approval.
- Checksum/filename dedupe prevents duplicate invoice uploads.

## Indexes & Rules

- All collections: `createdAt` index where queried by date range.
- `users.email`, `products.sku`: unique.
- Timestamps via Mongoose `{ timestamps: true }`.
- Use `id` naming consistently (Mongoose default `_id`; expose `id` in API layer).

## Relationships (logical)

```
users 1—N invoice_uploads / notifications / audit_logs / reports
suppliers 1—N inventory / purchase_orders
products 1—N inventory / sales / recommendations
```

No cross-collection joins at runtime beyond `.populate()` where appropriate and limited to one level.
