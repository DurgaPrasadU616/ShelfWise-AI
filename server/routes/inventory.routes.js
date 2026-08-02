import express from 'express';
import { 
  getInventory, 
  createInventory, 
  updateInventory, 
  adjustInventory,
  getExpiring,
  getExpired,
  deleteInventory 
} from '../controllers/inventory.controller.js';
import {
  createInventoryValidator, 
  updateInventoryValidator, 
  adjustInventoryValidator 
} from '../validators/inventory.validator.js';
import { objectIdParam } from '../validators/index.js';
import validate from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getInventory);
router.get('/expiring', getExpiring);
router.get('/expired', getExpired);

// Write ops require manager or admin
router.post('/', requireRole('manager', 'admin'), createInventoryValidator, createInventory);
router.put('/:id', requireRole('manager', 'admin'), objectIdParam('id'), updateInventoryValidator, updateInventory);
router.post('/:id/adjust', requireRole('manager', 'admin'), objectIdParam('id'), adjustInventoryValidator, adjustInventory);

// Admin only
router.delete('/:id', requireRole('admin'), objectIdParam('id'), validate, deleteInventory);

export default router;
