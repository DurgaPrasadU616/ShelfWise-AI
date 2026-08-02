import asyncHandler from '../utils/asyncHandler.js';
import SaleService from '../services/sale.service.js';
import auditLogService from '../services/auditLog.service.js';

const saleService = new SaleService();

export const listSales = asyncHandler(async (req, res) => {
  const { q, page, limit } = req.query;
  const data = await saleService.list({ q, page, limit });
  return res.status(200).json({ success: true, data });
});

export const getSale = asyncHandler(async (req, res) => {
  const { sale } = await saleService.getById(req.params.id);
  return res.status(200).json({ success: true, data: { sale } });
});

export const createSale = asyncHandler(async (req, res) => {
  const { sale } = await saleService.create(req.body);
  await auditLogService.logAction(req, 'CREATE', 'Sale', sale._id, {
    product: sale.product?.name,
    quantity: sale.quantity,
  });
  return res.status(201).json({ success: true, data: { sale } });
});

export const updateSale = asyncHandler(async (req, res) => {
  const { sale } = await saleService.update(req.params.id, req.body);
  await auditLogService.logAction(req, 'UPDATE', 'Sale', sale._id, {
    quantity: sale.quantity,
  });
  return res.status(200).json({ success: true, data: { sale } });
});

export const deleteSale = asyncHandler(async (req, res) => {
  const { sale } = await saleService.remove(req.params.id);
  await auditLogService.logAction(req, 'DELETE', 'Sale', sale.id);
  return res.status(200).json({ success: true, data: { sale } });
});

export default { listSales, getSale, createSale, updateSale, deleteSale };