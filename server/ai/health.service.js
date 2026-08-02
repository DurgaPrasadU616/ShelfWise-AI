import { Inventory } from '../models/inventory.model.js';
import { Recommendation } from '../models/recommendation.model.js';

// ─── Thresholds ────────────────────────────────────────────────────────────────
const LOW_STOCK_THRESHOLD = 10; // units — batches with qty < this are "low stock"
const NEAR_EXPIRY_DAYS    = 30;

// ─── Core health calculation (returns rich object, shared by all callers) ──────
export const getHealthSnapshot = async () => {
  const batches = await Inventory.find({ quantity: { $gt: 0 } }).lean();

  let expiredCount       = 0;
  let nearExpiryCount    = 0;
  let dataIncompleteCount = 0;
  let lowStockCount      = 0;
  let inventoryValue     = 0;

  const now                = new Date();
  const nearExpiryDeadline = new Date(now.getTime() + NEAR_EXPIRY_DAYS * 864e5);

  batches.forEach(batch => {
    // Inventory value
    if (batch.quantity && batch.unitCost) {
      inventoryValue += batch.quantity * batch.unitCost;
    }

    // Low stock
    if (batch.quantity < LOW_STOCK_THRESHOLD) {
      lowStockCount++;
    }

    if (!batch.expiryDate || !batch.unitCost) {
      dataIncompleteCount++;
    } else {
      const expiry = new Date(batch.expiryDate);
      if (expiry < now) {
        expiredCount++;
      } else if (expiry < nearExpiryDeadline) {
        nearExpiryCount++;
      }
    }
  });

  // Health score: 100 base, deductions for issues
  // -10 per expired batch, -5 per near-expiry, -2 per incomplete
  const score = Math.max(
    0,
    Math.min(100, 100 - expiredCount * 10 - nearExpiryCount * 5 - dataIncompleteCount * 2),
  );

  return {
    healthScore:      score,
    productsAtRisk:   nearExpiryCount,   // batches expiring within 30 days
    criticalProducts: expiredCount,       // batches already expired (still in stock)
    lowStockCount,
    inventoryValue:   Math.round(inventoryValue * 100) / 100,
    totalBatches:     batches.length,
  };
};

// ─── Backward-compat scalar exports (used by ocr.commit.service & controller) ─
export const calculateInventoryHealth     = async () => (await getHealthSnapshot()).healthScore;
export const getFinancialLossPrediction   = async () => {
  const batches = await Inventory.find({ quantity: { $gt: 0 } }).lean();
  const now = new Date();
  let loss = 0;
  batches.forEach(b => {
    if (b.expiryDate && b.unitCost && new Date(b.expiryDate) < now) {
      loss += b.quantity * b.unitCost;
    }
  });
  return Math.round(loss * 100) / 100;
};

// ─── Revenue saved: sum of expectedOutcome savings from accepted recommendations ─
// "Revenue saved" = accumulated value recovered from acted-on AI recommendations.
// Recommendations don't currently store a numeric outcome, so we use a proxy:
// accepted discount recommendations × (suggestedDiscountPct% of at-risk batches).
// This is a best-effort estimate; when a proper outcome tracking field is added,
// replace this function body — the interface stays the same.
export const getRevenueSaved = async () => {
  const accepted = await Recommendation
    .find({ status: 'accepted', type: { $in: ['discount', 'reprice'] } })
    .lean();

  // Each accepted recommendation carries a suggestedDiscountPct and suggestedQuantity
  // (or no quantity → treat as 0). We sum the implied revenue recovered.
  let total = 0;
  accepted.forEach(rec => {
    const qty      = rec.suggestedQuantity || 0;
    const pct      = rec.suggestedDiscountPct || 0;
    // Conservative proxy: avoid division by zero, assume avg unit price $5 if not stored
    total += qty * (pct / 100) * 5;
  });

  return Math.round(total * 100) / 100;
};
