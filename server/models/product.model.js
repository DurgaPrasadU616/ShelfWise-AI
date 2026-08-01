import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true },
    sku: { type: String, required: [true, 'SKU is required'], unique: true, trim: true, index: true },
    category: { type: String, required: [true, 'Category is required'], trim: true },
    brand: { type: String, trim: true },
    unit: { type: String, required: [true, 'Unit of measure is required (e.g., kg, pieces)'] },
    description: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ createdAt: -1 });

export const Product = mongoose.model('Product', productSchema);
