import express from 'express';
import { getDashboardAnalyticsHandler, getCategoryDistributionHandler } from '../controllers/dashboard.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', requireRole('admin', 'manager', 'inventory_staff'), getDashboardAnalyticsHandler);
router.get('/categories', requireRole('admin', 'manager', 'inventory_staff'), getCategoryDistributionHandler);

export default router;