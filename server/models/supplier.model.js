import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Supplier name is required'], trim: true },
    contactName: { type: String, trim: true },
    email: { 
      type: String, 
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
    },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
  },
  { timestamps: true }
);

supplierSchema.index({ createdAt: -1 });

export const Supplier = mongoose.model('Supplier', supplierSchema);
