import { Recommendation } from '../models/recommendation.model.js';
import AppError from '../utils/AppError.js';

class RecommendationService {
  async getOpenRecommendations() {
    return Recommendation.aggregate([
      { $match: { status: 'open' } },
      { $addFields: { priorityOrder: { $switch: {
        branches: [
          { case: { $eq: ['$priority', 'high'] },   then: 1 },
          { case: { $eq: ['$priority', 'medium'] }, then: 2 },
          { case: { $eq: ['$priority', 'low'] },    then: 3 },
        ],
        default: 4,
      }}}},
      { $sort: { priorityOrder: 1, createdAt: -1 } },
      { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'product' } },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      { $project: { priorityOrder: 0 } },
    ]);
  }

  async updateRecommendationStatus(id, action) {
    if (!['apply', 'dismiss'].includes(action)) {
      throw new AppError('Invalid action. Use apply or dismiss.', 400, 'BAD_REQUEST');
    }

    const recommendation = await Recommendation.findById(id);
    if (!recommendation) {
      throw new AppError('Recommendation not found', 404, 'NOT_FOUND');
    }

    recommendation.status = action === 'apply' ? 'accepted' : 'dismissed';
    await recommendation.save();

    return recommendation;
  }
}

export default new RecommendationService();
