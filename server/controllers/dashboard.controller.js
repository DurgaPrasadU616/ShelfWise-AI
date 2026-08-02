import asyncHandler from '../utils/asyncHandler.js';
import { getDashboardAnalytics, getCategoryDistribution } from '../services/dashboard.service.js';

export const getDashboardAnalyticsHandler = asyncHandler(async (_req, res) => {
  const analytics = await getDashboardAnalytics();
  res.status(200).json({ success: true, data: analytics });
});

export const getCategoryDistributionHandler = asyncHandler(async (_req, res) => {
  const categories = await getCategoryDistribution();
  res.status(200).json({ success: true, data: categories });
});

export default { getDashboardAnalyticsHandler, getCategoryDistributionHandler };