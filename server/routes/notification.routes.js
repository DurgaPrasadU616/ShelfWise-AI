import express from 'express';
import {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification,
  sendTestNotification
} from '../controllers/notification.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { objectIdParam } from '../validators/index.js';
import validate from '../middleware/validate.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getNotifications);
router.put('/read-all', markAllRead);
router.put('/:id/read', objectIdParam('id'), validate, markRead);
router.delete('/:id', objectIdParam('id'), validate, deleteNotification);
router.post('/test', requireRole('manager', 'admin'), sendTestNotification);

export default router;
