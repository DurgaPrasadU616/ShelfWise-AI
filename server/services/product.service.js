import { Product } from '../models/product.model.js';
import AppError from '../utils/AppError.js';

class ProductService {
  async getProducts(query) {
    const { q, category, brand, isActive, page = 1, limit = 20 } = query;
    const filter = {};

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { sku: { $regex: q, $options: 'i' } }
      ];
    }
    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter)
    ]);

    return {
      items,
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit) || 1
    };
  }

  async getProductById(id) {
    const product = await Product.findById(id);
    if (!product) {
      throw new AppError('NOT_FOUND', 'Product not found', 404);
    }
    return product;
  }

  async createProduct(data) {
    // Check for duplicate SKU
    const existing = await Product.findOne({ sku: data.sku });
    if (existing) {
      throw new AppError('DUPLICATE_SKU', 'Product with this SKU already exists', 409);
    }
    
    const product = await Product.create(data);
    return product;
  }

  async updateProduct(id, data) {
    if (data.sku) {
      const existing = await Product.findOne({ sku: data.sku, _id: { $ne: id } });
      if (existing) {
        throw new AppError('DUPLICATE_SKU', 'Product with this SKU already exists', 409);
      }
    }

    const product = await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!product) {
      throw new AppError('NOT_FOUND', 'Product not found', 404);
    }
    return product;
  }

  async softDeleteProduct(id) {
    const product = await Product.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!product) {
      throw new AppError('NOT_FOUND', 'Product not found', 404);
    }
    return product;
  }
}

export default new ProductService();
