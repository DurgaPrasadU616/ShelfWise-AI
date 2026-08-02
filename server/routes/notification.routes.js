import express from 'express';
import {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification,
  sendTestNotification
} from '../controllers/notification.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getNotifications);
router.put('/read-all', markAllRead);
router.put('/:id/read', markRead);
router.delete('/:id', deleteNotification);
router.post('/test', requireRole('manager', 'admin'), sendTestNotification);

export default router;
