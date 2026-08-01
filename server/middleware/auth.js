import TokenService from '../services/token.service.js';
import AppError from '../utils/AppError.js';

const tokenService = new TokenService();

export const requireAuth = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError('UNAUTHORIZED', 'Missing access token', 401));
  }
  const token = header.slice(7);
  const payload = tokenService.verifyAccess(token);
  req.user = { id: payload.sub, role: payload.role };
  return next();
};

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError('FORBIDDEN', 'Insufficient permissions', 403));
  }
  return next();
};

export default { requireAuth, requireRole };
