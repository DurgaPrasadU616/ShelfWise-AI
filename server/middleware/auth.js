import TokenService from '../services/token.service.js';
import AppError from '../utils/AppError.js';

const tokenService = new TokenService();

export const requireAuth = (req, _res, next) => {
  // DEMO MODE: Bypass auth completely (must be a valid 24-hex ObjectId)
  req.user = { id: '5f9b3b3b3b3b3b3b3b3b3b3b', role: 'admin', name: 'Demo User' };
  return next();
};

export const requireRole = (...roles) => (req, _res, next) => {
  // DEMO MODE: Bypass role checks
  return next();
};

export default { requireAuth, requireRole };
