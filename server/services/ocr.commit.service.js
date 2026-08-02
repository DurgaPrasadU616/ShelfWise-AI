import { InvoiceUpload } from '../models/invoice.model.js';
import { Product }       from '../models/product.model.js';
import { Inventory }     from '../models/inventory.model.js';
import auditLogService   from './auditLog.service.js';
import { generateRecommendations } from '../ai/recommendation.service.js';
import { calculateInventoryHealth, getFinancialLossPrediction } from '../ai/health.service.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

// ─── Fire-and-forget post-commit analysis ─────────────────────────────────────
function triggerInventoryAnalysis(invoiceId) {
  setImmediate(async () => {
    try {
      await generateRecommendations();
      logger.info('Post-commit AI analysis completed', { invoiceId });
    } catch (err) {
      logger.error('Post-commit AI analysis failed', { invoiceId, error: err.message });
    }
  });
}

// ─── Main commit function ─────────────────────────────────────────────────────
export const commitInvoice = async (req, uploadId, items) => {
  const invoice = await InvoiceUpload.findById(uploadId);
  if (!invoice) throw new AppError('Invoice not found', 404, 'NOT_FOUND');
  if (invoice.status === 'committed') throw new AppError('Already committed', 409, 'CONFLICT');

  let productsCreated = 0;
  let batchesCreated  = 0;

  for (const item of items) {
    // Normalise category — use extracted value or fall back to 'Imported'
    const category = (item.category && item.category.trim()) || 'Imported';

    // Upsert Product by SKU
    let product = await Product.findOne({ sku: item.sku });
    if (!product) {
      product = await Product.create({
        name:     item.productName,
        sku:      item.sku,
        category,
        unit:     'unit',
      });
      productsCreated++;
    } else if (product.category === 'Imported' && category !== 'Imported') {
      // Opportunistically update category if we now have a real one
      product.category = category;
      await product.save();
    }

    // Create Inventory Batch
    const batchNo = `OCR-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    await Inventory.create({
      product:    product._id,
      quantity:   item.quantity,
      unitCost:   item.unitCost,
      expiryDate: item.expiryDate  || null,
      receivedAt: item.purchaseDate || new Date(),
      batchNo,
    });
    batchesCreated++;
  }

  invoice.status         = 'committed';
  invoice.extractedItems = items;
  await invoice.save();

  // Audit trail
  await auditLogService.logAction(req, 'COMMIT_OCR', 'InvoiceUpload', invoice._id, {
    itemsProcessed: items.length,
    productsCreated,
    batchesCreated,
  });

  // Synchronously grab analytics snapshot for the response
  const [healthScore, predictedLoss] = await Promise.all([
    calculateInventoryHealth().catch(() => null),
    getFinancialLossPrediction().catch(() => null),
  ]);

  // Kick off full recommendation regeneration in background
  triggerInventoryAnalysis(invoice._id);

  return {
    committed: items.length,
    productsCreated,
    batchesCreated,
    analytics: {
      healthScore,
      predictedLoss,
    },
  };
};
