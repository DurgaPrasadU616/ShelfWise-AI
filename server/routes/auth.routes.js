import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import config from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { validateRegister, validateLogin } from '../validators/auth.validator.js';
import {
  register,
  login,
  refresh,
  logout,
  me,
} from '../controllers/auth.controller.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: config.authRateLimit.windowMs,
  max: config.authRateLimit.max,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many attempts, try again later.' },
  },
});

router.post('/register', authLimiter, validateRegister, validate, register);
router.post('/login', authLimiter, validateLogin, validate, login);
router.post('/refresh', authLimiter, refresh);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, me);

export default router;
