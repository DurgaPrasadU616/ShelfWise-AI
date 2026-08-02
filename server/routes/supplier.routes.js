import express from 'express';
import {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '../controllers/supplier.controller.js';
import { createSupplierValidator, updateSupplierValidator } from '../validators/supplier.validator.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getSuppliers);
router.get('/:id', getSupplierById);

router.post('/', requireRole('manager', 'admin'), createSupplierValidator, createSupplier);
router.put('/:id', requireRole('manager', 'admin'), updateSupplierValidator, updateSupplier);
router.delete('/:id', requireRole('admin'), deleteSupplier);

export default router;
