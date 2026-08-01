import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: [true, 'Product reference is required'] },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    quantity: { type: Number, required: [true, 'Quantity is required'], min: [0, 'Quantity cannot be negative'] },
    unitCost: { type: Number, required: [true, 'Unit cost is required'], min: [0, 'Unit cost cannot be negative'] },
    expiryDate: { type: Date, index: true },
    batchNo: { type: String, trim: true },
    location: { type: String, trim: true },
    receivedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: {
        values: ['in_stock', 'low', 'expired'],
        message: '{VALUE} is not a valid status'
      },
      default: 'in_stock'
    },
  },
  { timestamps: true }
);

inventorySchema.index({ product: 1, batchNo: 1, expiryDate: 1 }, { unique: true });
inventorySchema.index({ createdAt: -1 });

export const Inventory = mongoose.model('Inventory', inventorySchema);
