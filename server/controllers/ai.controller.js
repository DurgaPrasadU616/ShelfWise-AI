import asyncHandler from '../utils/asyncHandler.js';
import { getHealthSnapshot, getRevenueSaved, getFinancialLossPrediction } from '../ai/health.service.js';
import { generateRecommendations } from '../ai/recommendation.service.js';
import recommendationService from '../services/recommendation.service.js';

export const triggerAiAnalysis = asyncHandler(async (req, res) => {
  const recommendations = await generateRecommendations();
  res.status(200).json({ success: true, data: { generated: recommendations.length, recommendations } });
});

export const getHealthMetrics = asyncHandler(async (req, res) => {
  const [snapshot, revenueSaved, predictedLoss] = await Promise.all([
    getHealthSnapshot(),
    getRevenueSaved(),
    getFinancialLossPrediction(),
  ]);

  res.status(200).json({
    success: true,
    data: {
      healthScore:      snapshot.healthScore,
      productsAtRisk:   snapshot.productsAtRisk,
      criticalProducts: snapshot.criticalProducts,
      lowStockCount:    snapshot.lowStockCount,
      inventoryValue:   snapshot.inventoryValue,
      totalBatches:     snapshot.totalBatches,
      predictedLoss,
      revenueSaved,
    },
  });
});

export const getRecommendations = asyncHandler(async (req, res) => {
  const recommendations = await recommendationService.getOpenRecommendations();
  res.status(200).json({ success: true, data: recommendations });
});

export const actionRecommendation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;
  
  const recommendation = await recommendationService.updateRecommendationStatus(id, action);
  res.status(200).json({ success: true, data: recommendation });
});
