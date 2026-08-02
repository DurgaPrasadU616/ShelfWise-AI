import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import productRoutes from './product.routes.js';
import supplierRoutes from './supplier.routes.js';
import inventoryRoutes from './inventory.routes.js';
import auditLogRoutes from './auditLog.routes.js';
import ocrRoutes from './ocr.routes.js';
import aiRoutes from './ai.routes.js';
import reportRoutes from './report.routes.js';
import notificationRoutes from './notification.routes.js';
import saleRoutes from './sale.routes.js';
import dashboardRoutes from './dashboard.routes.js';

const router = Router();

router.use(healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/ocr', ocrRoutes);
router.use('/ai', aiRoutes);
router.use('/reports', reportRoutes);
router.use('/notifications', notificationRoutes);
router.use('/sales', saleRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
 