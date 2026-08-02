import { Inventory } from '../models/inventory.model.js';
import { Product } from '../models/product.model.js';
import { Recommendation } from '../models/recommendation.model.js';
import { getForecastForProduct } from './forecast.service.js';
import { enrichRecommendation } from './gemini.service.js';

export const generateRecommendations = async () => {
  const products = await Product.find().lean();
  const newRecommendations = [];

  for (const product of products) {
    const forecast = await getForecastForProduct(product._id);
    const batches = await Inventory.find({ product: product._id, quantity: { $gt: 0 } }).lean();
    
    let totalAvailable = 0;
    let earliestExpiry = null;

    batches.forEach(b => {
      totalAvailable += b.quantity;
      if (b.expiryDate) {
        if (!earliestExpiry || new Date(b.expiryDate) < earliestExpiry) {
          earliestExpiry = new Date(b.expiryDate);
        }
      }
    });

    const now = new Date();
    const daysToExpiry = earliestExpiry ? Math.floor((earliestExpiry - now) / (1000 * 60 * 60 * 24)) : 999;

    // Rule 1: Discount Recommendation
    if (daysToExpiry <= 30 && totalAvailable > forecast.expectedDemand14d) {
      const ruleReason = `Batch expiring in ${daysToExpiry} days. Stock (${totalAvailable}) exceeds 14-day demand (${Math.round(forecast.expectedDemand14d)}).`;
      const suggestedDiscount = daysToExpiry < 7 ? 50 : 20;
      const suggestedAction = `Apply a ${suggestedDiscount}% discount to accelerate sell-through.`;
      
      const enriched = await enrichRecommendation(product.name, ruleReason, suggestedAction);

      newRecommendations.push({
        product: product._id,
        type: 'discount',
        priority: daysToExpiry < 7 ? 'high' : 'medium',
        reason: enriched.reason,
        suggestedAction: enriched.suggestedAction,
        expectedOutcome: enriched.expectedOutcome,
        estimatedRevenueSaved: enriched.estimatedRevenueSaved,
        estimatedLossPrevented: enriched.estimatedLossPrevented,
        confidenceScore: enriched.confidenceScore,
        source: enriched.source,
        status: 'open'
      });
    }

    // Rule 2: Reorder Recommendation
    const safetyStock = forecast.dailyAvg * 7; // 7 days safety
    if (forecast.expectedDemand14d + safetyStock > totalAvailable) {
      const ruleReason = `Current stock (${totalAvailable}) is below the required 14-day demand + safety stock (${Math.round(forecast.expectedDemand14d + safetyStock)}).`;
      const suggestedOrder = Math.max(10, Math.round((forecast.expectedDemand14d * 2) - totalAvailable));
      const suggestedAction = `Reorder ${suggestedOrder} units from the supplier.`;

      const enriched = await enrichRecommendation(product.name, ruleReason, suggestedAction);

      newRecommendations.push({
        product: product._id,
        type: 'restock',
        priority: 'high',
        reason: enriched.reason,
        suggestedAction: enriched.suggestedAction,
        expectedOutcome: enriched.expectedOutcome,
        estimatedRevenueSaved: enriched.estimatedRevenueSaved,
        estimatedLossPrevented: enriched.estimatedLossPrevented,
        confidenceScore: enriched.confidenceScore,
        source: enriched.source,
        status: 'open'
      });
    }
  }

  // Idempotency: clear open recommendations before inserting new ones
  await Recommendation.deleteMany({ status: 'open' });
  
  if (newRecommendations.length > 0) {
    await Recommendation.insertMany(newRecommendations);
  }

  return newRecommendations;
};
