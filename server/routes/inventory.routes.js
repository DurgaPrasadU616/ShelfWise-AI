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
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getInventory);
router.get('/expiring', getExpiring);
router.get('/expired', getExpired);

// Write ops require manager or admin
router.post('/', requireRole('manager', 'admin'), createInventoryValidator, createInventory);
router.put('/:id', requireRole('manager', 'admin'), updateInventoryValidator, updateInventory);
router.post('/:id/adjust', requireRole('manager', 'admin'), adjustInventoryValidator, adjustInventory);

// Admin only
router.delete('/:id', requireRole('admin'), deleteInventory);

export default router;
