import asyncHandler from '../utils/asyncHandler.js';
import productService from '../services/product.service.js';
import auditLogService from '../services/auditLog.service.js';

export const getProducts = asyncHandler(async (req, res) => {
  const result = await productService.getProducts(req.query);
  res.status(200).json({ success: true, data: result });
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  res.status(200).json({ success: true, data: { product } });
});

export const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body);
  
  await auditLogService.logAction(req, 'CREATE', 'Product', product._id, {
    sku: product.sku,
    name: product.name
  });

  res.status(201).json({ success: true, data: { product } });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  
  await auditLogService.logAction(req, 'UPDATE', 'Product', product._id, {
    updates: req.body
  });

  res.status(200).json({ success: true, data: { product } });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await productService.softDeleteProduct(req.params.id);
  
  await auditLogService.logAction(req, 'DELETE', 'Product', product._id, {
    action: 'soft_delete'
  });

  res.status(200).json({ success: true, data: { product } });
});
