import { Sale } from '../models/sale.model.js';
import { Product } from '../models/product.model.js';
import AppError from '../utils/AppError.js';

class SaleService {
  async list({ q, page = 1, limit = 20 } = {}) {
    const filter = {};
    const skip = (page - 1) * limit;
    const base = Sale.find(filter).sort({ saleDate: -1 }).skip(skip).limit(limit);
    const [items, total] = await Promise.all([
      base.populate('product', 'name sku category').lean(),
      Sale.countDocuments(filter),
    ]);
    return { items, total, page: Number(page), limit: Number(limit) };
  }

  async getById(id) {
    const sale = await Sale.findById(id).populate('product', 'name sku category').lean();
    if (!sale) throw new AppError('NOT_FOUND', 'Sale not found', 404);
    return { sale };
  }

  async create({ product, quantity, unitPrice, saleDate, invoiceRef }) {
    const productExists = await Product.findById(product);
    if (!productExists) throw new AppError('NOT_FOUND', 'Product not found', 404);
    const sale = await Sale.create({
      product,
      quantity,
      unitPrice,
      saleDate: saleDate ? new Date(saleDate) : new Date(),
      invoiceRef,
    });
    const hydrated = await Sale.findById(sale._id).populate('product', 'name sku category').lean();
    return { sale: hydrated };
  }

  async update(id, data) {
    if (data.product) {
      const productExists = await Product.findById(data.product);
      if (!productExists) throw new AppError('NOT_FOUND', 'Product not found', 404);
    }
    const update = { ...data };
    if (update.saleDate) update.saleDate = new Date(update.saleDate);
    const sale = await Sale.findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .populate('product', 'name sku category')
      .lean();
    if (!sale) throw new AppError('NOT_FOUND', 'Sale not found', 404);
    return { sale };
  }

  async remove(id) {
    const sale = await Sale.findByIdAndDelete(id);
    if (!sale) throw new AppError('NOT_FOUND', 'Sale not found', 404);
    return { sale: { id: sale._id.toString() } };
  }
}

export default SaleService;