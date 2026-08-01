# 06 — AI Engine

Location: `server/ai/`

## Design Decisions (confirmed)

- **Forecasting:** Moving average / exponential smoothing implemented in plain JS (no heavy dependencies), plus an optional weekly seasonality index. LLM is NOT used for core math — it is used for narrative explanations and free-text recommendation reasons.
- **Recommendation Engine:** Rule-based ranking first, then LLM enrichment for human-readable reasons.
- **Gemini:** used for structured extraction of recommendation summaries and (optionally) qualitative analysis of sales text.

## Inputs

- `inventory` (quantity, unitCost, expiryDate per batch)
- `sales` (per-product daily quantities over rolling 90 days)
- `products` (SKU, category)
- Constants: `reorderLeadTimeDays`, `safetyStockDays`, `discountWindowDays`

## Modules

### 1. Expiry Prediction
For each batch:
```
daysToExpiry = expiryDate - today
riskScore = baseScore(daysToExpiry) * quantityFactor * categoryFactor
status = expired | critical (≤ threshold) | warning | ok
predictedLoss = quantity * unitCost * lossProbability(daysToExpiry, sellRate)
```
- `sellRate = avg daily sales for product over last 30d (min epsilon)`.
- If `sellRate` is high, low risk; if near-zero, high risk.

### 2. Demand Forecast
- Simple moving average (window W=7) + exponential smoothing (α=0.3) blended forecast.
- Optional weekly seasonality index `s[dow]` computed from last 8 weeks.
- Forecast horizon: 14 days. Output: `{ daily[], total, confidence }`.

### 3. Discount Recommendation
Triggered when:
- `daysToExpiry <= discountWindowDays` AND stock > expected 14-day demand.
- Suggested discount: `min(50, f(daysToExpiry))` — steeper as expiry nears.
- Expected outcome: additional units sold = `priceElasticity * forecast`.

### 4. Stock Optimization
```
expectedDemand14d = sum(forecast)
safetyStock = safetyStockDays * dailyAvg
reorderPoint = leadTimeDemand + safetyStock
suggestedOrderQty = max(0, reorderPoint - available + backorder)
```

### 5. Revenue Saved Prediction
Estimated from accepted discount recommendations:
```
revenueSaved += (unitsSaved * unitPrice) - (unitsSaved * discountLoss)
```
Units saved = units that would otherwise expire, discounted and sold before expiry.

### 6. Financial Loss Prediction
```
lossPotential = Σ (expired_qty * unitCost) + Σ (predicted_to_expire * unitCost * lossProbability)
```

### 7. Inventory Health Score (0–100)
Weighted blend:
- Expiry risk (30%) — fewer critical/expired → higher
- Stock balance (25%) — penalize overstock + shortage
- Turnover (25%) — fast-moving ratio
- Data completeness (20%) — % of batches with expiry/supplier/unit cost

## Recommendation Engine (Rule + LLM)

Rules produce ranked candidates with `priority`, `type`, `suggested` values.
Gemini prompt (structured JSON response):
```
Given product context + rule result, produce { reason, suggestedAction, expectedOutcome }.
Return ONLY JSON.
```
LLM output is sanitized/validated; on timeout/failure the rule reason is used as fallback.

## Scheduler (node-cron)
- Daily 02:00 server time: run all modules → persist `recommendations`, `notifications`, `reports`.
- Hourly: low-stock + newly-expired detection.
- Cron runs are idempotent: clear `open` recommendations older than the run window before writing new ones.

## Failure Handling
- Gemini timeout (5s) → fallback to rule text; mark `source: 'rule'`.
- Missing sales data → forecast = flat (daily avg of available window, else 0).
- Mongo failure → log, do not cascade partial writes (single transaction where possible).
