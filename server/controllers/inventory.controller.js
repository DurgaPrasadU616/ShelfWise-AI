import asyncHandler from '../utils/asyncHandler.js';
import inventoryService from '../services/inventory.service.js';
import auditLogService from '../services/auditLog.service.js';

export const getInventory = asyncHandler(async (req, res) => {
  const result = await inventoryService.getInventory(req.query);
  res.status(200).json({ success: true, data: result });
});

export const createInventory = asyncHandler(async (req, res) => {
  const inventory = await inventoryService.createInventory(req.body);
  
  await auditLogService.logAction(req, 'CREATE', 'Inventory', inventory._id, {
    batchNo: inventory.batchNo,
    quantity: inventory.quantity
  });

  res.status(201).json({ success: true, data: { inventory } });
});

export const updateInventory = asyncHandler(async (req, res) => {
  const inventory = await inventoryService.updateInventory(req.params.id, req.body);
  
  await auditLogService.logAction(req, 'UPDATE', 'Inventory', inventory._id, {
    updates: req.body
  });

  res.status(200).json({ success: true, data: { inventory } });
});

export const adjustInventory = asyncHandler(async (req, res) => {
  const { delta, reason } = req.body;
  const result = await inventoryService.adjustInventory(req.params.id, delta, reason);
  
  await auditLogService.logAction(req, 'ADJUST', 'Inventory', result.id, {
    delta,
    reason,
    previousQuantity: result.previousQuantity,
    newQuantity: result.quantity
  });

  res.status(200).json({ success: true, data: result });
});

export const getExpiring = asyncHandler(async (req, res) => {
  const days = req.query.days || 14;
  const result = await inventoryService.getExpiring(days);
  res.status(200).json({ success: true, data: result });
});

export const getExpired = asyncHandler(async (req, res) => {
  const result = await inventoryService.getExpired();
  res.status(200).json({ success: true, data: result });
});

export const deleteInventory = asyncHandler(async (req, res) => {
  const inventory = await inventoryService.deleteInventory(req.params.id);
  
  await auditLogService.logAction(req, 'DELETE', 'Inventory', inventory._id, {
    action: 'hard_delete'
  });

  res.status(200).json({ success: true, data: { inventory } });
});
