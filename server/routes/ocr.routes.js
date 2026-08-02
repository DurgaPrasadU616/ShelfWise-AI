import express from 'express';
import multer from 'multer';
import { 
  uploadInvoice, 
  getUploadStatus, 
  commitUpload, 
  rejectUpload, 
  retryUpload 
} from '../controllers/ocr.controller.js';
import { commitOcrValidator } from '../validators/ocr.validator.js';
import { objectIdParam } from '../validators/index.js';
import validate from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

// Setup multer for in-memory upload. Max 10MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Invalid file type'), false);
    }
    cb(null, true);
  }
});

const router = express.Router();

router.use(requireAuth);

// All OCR actions require manager or admin (or inventory_staff if configured, but let's say manager/admin)
router.post('/upload', requireRole('manager', 'admin', 'inventory_staff'), upload.single('file'), uploadInvoice);
router.get('/:uploadId', requireRole('manager', 'admin', 'inventory_staff'), objectIdParam('uploadId'), validate, getUploadStatus);

router.put('/:uploadId', requireRole('manager', 'admin', 'inventory_staff'), objectIdParam('uploadId'), commitOcrValidator, commitUpload);
router.post('/:uploadId/reject', requireRole('manager', 'admin', 'inventory_staff'), objectIdParam('uploadId'), validate, rejectUpload);
router.post('/:uploadId/retry', requireRole('manager', 'admin', 'inventory_staff'), objectIdParam('uploadId'), validate, retryUpload);

export default router;
