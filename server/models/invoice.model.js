import mongoose from 'mongoose';

const extractedItemSchema = new mongoose.Schema({
  productName: { type: String, trim: true },
  sku: { type: String, trim: true },
  quantity: { type: Number, min: 0 },
  unitCost: { type: Number, min: 0 },
  expiryDate: { type: Date },
  lineTotal: { type: Number, min: 0 }
});

const invoiceUploadSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    filename: { type: String, required: true },
    mimeType: { type: String },
    size: { type: Number },
    ocrEngine: { type: String },
    rawText: { type: String },
    extractedItems: [extractedItemSchema],
    status: {
      type: String,
      enum: ['processing', 'needs_review', 'committed', 'failed'],
      default: 'processing'
    },
    error: { type: String },
    duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'InvoiceUpload' }
  },
  { timestamps: true }
);

invoiceUploadSchema.index({ createdAt: -1 });
invoiceUploadSchema.index({ filename: 1, size: 1 });

export const InvoiceUpload = mongoose.model('InvoiceUpload', invoiceUploadSchema);
