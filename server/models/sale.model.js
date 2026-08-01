import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: [true, 'Product reference is required'] },
    quantity: { type: Number, required: [true, 'Quantity is required'], min: [1, 'Quantity must be at least 1'] },
    unitPrice: { type: Number, required: [true, 'Unit price is required'], min: [0, 'Unit price cannot be negative'] },
    saleDate: { type: Date, required: [true, 'Sale date is required'], default: Date.now, index: true },
    invoiceRef: { type: String, trim: true },
  },
  { timestamps: true }
);

saleSchema.index({ product: 1, saleDate: -1 });
saleSchema.index({ createdAt: -1 });

export const Sale = mongoose.model('Sale', saleSchema);
