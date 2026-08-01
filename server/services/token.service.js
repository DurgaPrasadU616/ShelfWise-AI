import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import AppError from '../utils/AppError.js';

class TokenService {
  constructor({
    accessSecret = config.jwt.accessSecret,
    refreshSecret = config.jwt.refreshSecret,
    accessTtl = config.jwt.accessTtl,
    refreshTtl = config.jwt.refreshTtl,
  } = {}) {
    this.accessSecret = accessSecret;
    this.refreshSecret = refreshSecret;
    this.accessTtl = accessTtl;
    this.refreshTtl = refreshTtl;
  }

  signAccess(user) {
    return jwt.sign(
      { sub: user.id, role: user.role, type: 'access' },
      this.accessSecret,
      { expiresIn: this.accessTtl }
    );
  }

  signRefresh(user) {
    return jwt.sign(
      { sub: user.id, ver: user.refreshTokenVersion, type: 'refresh' },
      this.refreshSecret,
      { expiresIn: this.refreshTtl }
    );
  }

  verifyAccess(token) {
    try {
      const payload = jwt.verify(token, this.accessSecret);
      if (payload.type !== 'access') {
        throw new AppError('UNAUTHORIZED', 'Invalid token type', 401);
      }
      return payload;
    } catch (error) {
      throw new AppError('UNAUTHORIZED', 'Invalid or expired access token', 401);
    }
  }

  verifyRefresh(token) {
    try {
      const payload = jwt.verify(token, this.refreshSecret);
      if (payload.type !== 'refresh') {
        throw new AppError('UNAUTHORIZED', 'Invalid token type', 401);
      }
      return payload;
    } catch (error) {
      throw new AppError('UNAUTHORIZED', 'Invalid or expired refresh token', 401);
    }
  }
}

export default TokenService;
