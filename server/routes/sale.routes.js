import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  validateCreateSale,
  validateUpdateSale,
  validateSaleId,
} from '../validators/sale.validator.js';
import {
  listSales,
  getSale,
  createSale,
  updateSale,
  deleteSale,
} from '../controllers/sale.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', listSales);
router.get('/:id', validateSaleId, validate, getSale);
router.post('/', requireRole('manager', 'admin', 'inventory_staff'), validateCreateSale, validate, createSale);
router.put('/:id', validateUpdateSale, validate, updateSale);
router.delete('/:id', validateSaleId, validate, deleteSale);

export default router;