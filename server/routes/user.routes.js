import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  validateCreateUser,
  validateUpdateUser,
  validateUserId,
} from '../validators/user.validator.js';
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/user.controller.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/', listUsers);
router.post('/', validateCreateUser, validate, createUser);
router.put('/:id', validateUpdateUser, validate, updateUser);
router.delete('/:id', validateUserId, validate, deleteUser);

export default router;
