import express from 'express';
import { triggerAiAnalysis, getHealthMetrics, getRecommendations, actionRecommendation } from '../controllers/ai.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.post('/trigger', requireRole('admin', 'manager', 'inventory_staff'), triggerAiAnalysis);
router.get('/health', requireRole('admin', 'manager', 'inventory_staff'), getHealthMetrics);
router.get('/recommendations', requireRole('admin', 'manager', 'inventory_staff'), getRecommendations);
router.patch('/recommendations/:id/action', requireRole('admin', 'manager', 'inventory_staff'), actionRecommendation);

export default router;
