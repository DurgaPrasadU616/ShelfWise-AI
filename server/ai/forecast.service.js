import { Sale } from '../models/sale.model.js';
import mongoose from 'mongoose';

/**
 * Computes a demand forecast based on a simple moving average of the last 30 days.
 * @param {string|mongoose.Types.ObjectId} productId 
 * @returns {Promise<{dailyAvg: number, expectedDemand14d: number}>}
 */
export const getForecastForProduct = async (productId) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sales = await Sale.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId), saleDate: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: null,
        totalQuantity: { $sum: "$quantity" }
      }
    }
  ]);

  const totalSold = sales.length > 0 ? sales[0].totalQuantity : 0;
  
  // To avoid zero-demand anomalies for new products, assume a minimum epsilon if completely zero
  const dailyAvg = totalSold > 0 ? (totalSold / 30) : 0.1;
  const expectedDemand14d = dailyAvg * 14;

  return { dailyAvg, expectedDemand14d };
};
