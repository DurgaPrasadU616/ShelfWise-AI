# 07 — OCR Pipeline

Location: `server/ocr/`

## Flow

```
1. Upload Invoice  (POST /api/ocr/upload, multer, allowed: png/jpg/webp/pdf)
        ↓
2. Image Enhancement   (brightness/contrast normalize, deskew, grayscale)
        ↓
3. OCR                (Google Vision API → Tesseract.js fallback)
        ↓
4. Extract Products   (regex + Gemini structured extraction on text)
        ↓
5. Validate           (required fields, qty ≥ 0, expiry parse)
        ↓
6. Manual Correction  (UI review — user edits extracted rows)
        ↓
7. Save Inventory     (commit to inventory + products on approval)
```

## Stage Details

### 1. Upload
- Multer in-memory, size cap 10MB, mime allow-list.
- Filename hash computed → duplicate detection against `invoice_uploads.filename` (or content hash) → reject as duplicate.

### 2. Image Enhancement
- Pure JS/Canvas-free approach: use sharp for resize/contrast/brightness/deskew to grayscale, output PNG.
- If sharp unavailable → pass original to OCR engine.

### 3. OCR
- **Primary:** Google Vision API `documentTextDetection`.
- **Fallback:** Tesseract.js (bundled worker) when Vision key missing or request fails.
- Record `ocrEngine` used on the upload record.

### 4. Product Extraction
Two-pass approach:
- Pass A: line/pattern extraction for common invoice line format
  `qty x name — unit cost — line total`.
- Pass B: Gemini API with prompt:
  ```
  Extract line items (name, sku, quantity, unitCost, expiryDate, lineTotal)
  from the OCR text. Use "YYYY-MM-DD". Return ONLY JSON array.
  ```
- Merge rules: prefer Gemini when present; fall back to regex-only if Gemini fails.

### 5. Validation
Per item:
- name required; quantity integer ≥ 0; unitCost number ≥ 0; expiryDate valid & in future (or null → flagged `missing_expiry`); lineTotal ≈ qty × unitCost (tolerance).
- Items failing validation are marked with `errors[]` and kept for manual review (never silently dropped).
- Duplicate SKUs within invoice merged with summed quantity.

### 6. Manual Correction
- Frontend `OcrReviewTable`: inline editing, add/remove rows, mark fields correct.
- `PUT /api/ocr/:uploadId` sends the corrected item array → re-validated server-side.

### 7. Commit
- Transaction: upsert `products` (by SKU), create `inventory` batches, mark upload `committed`, write audit log.
- Zero-committed items → rejected as `failed`.

## Error Handling
- Unreadable invoice → `status: failed`, error surfaced in UI, user can retry with other engine or manual entry.
- Duplicate upload → 409 with `duplicateOf` reference.
- Vision timeout/5xx → automatic Tesseract fallback in same request.

## Config (env)
```
GOOGLE_APPLICATION_CREDENTIALS (or VISION_API_KEY)
OCR_MAX_IMAGE_SIZE_MB=10
OCR_DEFAULT_DAYS_AHEAD=14
```
