import express from 'express';
import { 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from '../controllers/product.controller.js';
import { createProductValidator, updateProductValidator } from '../validators/product.validator.js';
import { objectIdParam } from '../validators/index.js';
import validate from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Require auth for all routes
router.use(requireAuth);

router.get('/', getProducts);
router.get('/:id', objectIdParam('id'), validate, getProductById);

// Require manager or admin for write operations
router.post('/', requireRole('manager', 'admin'), createProductValidator, createProduct);
router.put('/:id', requireRole('manager', 'admin'), objectIdParam('id'), updateProductValidator, updateProduct);
router.delete('/:id', requireRole('admin'), objectIdParam('id'), validate, deleteProduct);

export default router;
