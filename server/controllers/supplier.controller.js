import asyncHandler from '../utils/asyncHandler.js';
import supplierService from '../services/supplier.service.js';
import auditLogService from '../services/auditLog.service.js';

export const getSuppliers = asyncHandler(async (req, res) => {
  const result = await supplierService.getSuppliers(req.query);
  res.status(200).json({ success: true, data: result });
});

export const getSupplierById = asyncHandler(async (req, res) => {
  const supplier = await supplierService.getSupplierById(req.params.id);
  res.status(200).json({ success: true, data: { supplier } });
});

export const createSupplier = asyncHandler(async (req, res) => {
  const supplier = await supplierService.createSupplier(req.body);

  await auditLogService.logAction(req, 'CREATE', 'Supplier', supplier._id, {
    name: supplier.name,
  });

  res.status(201).json({ success: true, data: { supplier } });
});

export const updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await supplierService.updateSupplier(req.params.id, req.body);

  await auditLogService.logAction(req, 'UPDATE', 'Supplier', supplier._id, {
    updates: req.body,
  });

  res.status(200).json({ success: true, data: { supplier } });
});

export const deleteSupplier = asyncHandler(async (req, res) => {
  const supplier = await supplierService.deleteSupplier(req.params.id);

  await auditLogService.logAction(req, 'DELETE', 'Supplier', supplier._id, {
    action: 'delete',
  });

  res.status(200).json({ success: true, data: { supplier } });
});
