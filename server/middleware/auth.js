import TokenService from '../services/token.service.js';
import AppError from '../utils/AppError.js';

const tokenService = new TokenService();

export const requireAuth = (req, _res, next) => {
  // DEMO MODE: Bypass auth completely
  req.user = { id: 'demo-user', role: 'admin', name: 'Demo User' };
  return next();
};

export const requireRole = (...roles) => (req, _res, next) => {
  // DEMO MODE: Bypass role checks
  return next();
};

export default { requireAuth, requireRole };
