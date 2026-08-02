import mongoose from 'mongoose';

const recommendationSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: [true, 'Product reference is required'] },
    type: { 
      type: String, 
      required: true,
      enum: ['discount', 'restock', 'dispose', 'donate', 'reprice']
    },
    priority: {
      type: String,
      required: true,
      enum: ['high', 'medium', 'low']
    },
    reason: { type: String, required: true },
    suggestedDiscountPct: { type: Number, min: 0, max: 100 },
    suggestedQuantity: { type: Number, min: 0 },
    expectedOutcome: { type: String },
    estimatedRevenueSaved: { type: Number },
    estimatedLossPrevented: { type: Number },
    confidenceScore: { type: Number, min: 0, max: 100 },
    status: {
      type: String,
      enum: ['open', 'accepted', 'dismissed'],
      default: 'open'
    },
    source: {
      type: String,
      enum: ['ai', 'rule'],
      required: true
    }
  },
  { timestamps: true }
);

recommendationSchema.index({ status: 1, priority: 1 });
recommendationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

export const Recommendation = mongoose.model('Recommendation', recommendationSchema);
