import { Supplier } from '../models/supplier.model.js';
import AppError from '../utils/AppError.js';

class SupplierService {
  async getSuppliers(query) {
    const { q, page = 1, limit = 20 } = query;
    const filter = {};

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { contactName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Supplier.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Supplier.countDocuments(filter),
    ]);

    return {
      items,
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit) || 1,
    };
  }

  async getSupplierById(id) {
    const supplier = await Supplier.findById(id);
    if (!supplier) {
      throw new AppError('Supplier not found', 404, 'NOT_FOUND');
    }
    return supplier;
  }

  async createSupplier(data) {
    const existing = await Supplier.findOne({
      $or: [
        { email: data.email && data.email.trim() ? data.email : 'NONEXISTENT__' },
        { name: data.name },
      ],
    });
    if (existing) {
      throw new AppError('Supplier with this name or email already exists', 409, 'DUPLICATE_SUPPLIER');
    }

    const supplier = await Supplier.create(data);
    return supplier;
  }

  async updateSupplier(id, data) {
    const supplier = await Supplier.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!supplier) {
      throw new AppError('Supplier not found', 404, 'NOT_FOUND');
    }
    return supplier;
  }

  async deleteSupplier(id) {
    const supplier = await Supplier.findByIdAndDelete(id);
    if (!supplier) {
      throw new AppError('Supplier not found', 404, 'NOT_FOUND');
    }
    return supplier;
  }
}

export default new SupplierService();
