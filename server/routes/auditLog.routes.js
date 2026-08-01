import express from 'express';
import { getAuditLogs } from '../controllers/auditLog.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('admin'));

router.get('/', getAuditLogs);

export default router;
