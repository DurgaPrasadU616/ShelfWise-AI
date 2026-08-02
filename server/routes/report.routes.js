import express from 'express';
import { getReports, generateReport, getReport, downloadReport } from '../controllers/report.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { objectIdParam } from '../validators/index.js';
import validate from '../middleware/validate.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', requireRole('manager', 'admin', 'inventory_staff'), getReports);
router.post('/generate', requireRole('manager', 'admin', 'inventory_staff'), generateReport);
router.get('/:id', requireRole('manager', 'admin', 'inventory_staff'), objectIdParam('id'), validate, getReport);
router.get('/:id/download', requireRole('manager', 'admin', 'inventory_staff'), objectIdParam('id'), validate, downloadReport);

export default router;
