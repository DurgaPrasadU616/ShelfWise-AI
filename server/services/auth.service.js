import bcrypt from 'bcryptjs';
import UserRepository from '../repositories/user.repository.js';
import TokenService from './token.service.js';
import AppError from '../utils/AppError.js';

const BCRYPT_ROUNDS = 10;

class AuthService {
  constructor(
    userRepository = new UserRepository(),
    tokenService = new TokenService()
  ) {
    this.userRepository = userRepository;
    this.tokenService = tokenService;
  }

  async register({ name, email, password }) {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new AppError('DUPLICATE_EMAIL', 'Email is already registered', 409);
    }
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await this.userRepository.create({ name, email, passwordHash });
    return { user };
  }

  async login({ email, password }) {
    const user = await this.userRepository.findByEmailWithPassword(email);
    if (!user || !user.isActive) {
      throw new AppError('UNAUTHORIZED', 'Invalid credentials', 401);
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AppError('UNAUTHORIZED', 'Invalid credentials', 401);
    }
    const accessToken = this.tokenService.signAccess(user);
    const refreshToken = this.tokenService.signRefresh(user);
    return { user, accessToken, refreshToken, expiresIn: this.ttlSeconds(this.tokenService.accessTtl) };
  }

  async refresh(refreshToken) {
    if (!refreshToken) {
      throw new AppError('UNAUTHORIZED', 'Missing refresh token', 401);
    }
    const payload = this.tokenService.verifyRefresh(refreshToken);
    const user = await this.userRepository.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new AppError('UNAUTHORIZED', 'User not found', 401);
    }
    if (user.refreshTokenVersion !== payload.ver) {
      throw new AppError('UNAUTHORIZED', 'Refresh token revoked', 401);
    }
    const rotated = await this.userRepository.incrementRefreshVersion(user.id);
    const accessToken = this.tokenService.signAccess(user);
    const refreshTokenNext = this.tokenService.signRefresh(rotated);
    return { accessToken, refreshToken: refreshTokenNext, expiresIn: this.ttlSeconds(this.tokenService.accessTtl) };
  }

  async logout(userId) {
    await this.userRepository.incrementRefreshVersion(userId);
    return null;
  }

  async me(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user || !user.isActive) {
      throw new AppError('NOT_FOUND', 'User not found', 404);
    }
    return { user };
  }

  ttlSeconds(ttl) {
    const match = String(ttl).match(/^(\d+)([smhd])$/);
    if (!match) return 900;
    const value = Number(match[1]);
    const unit = match[2];
    const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
    return value * multipliers[unit];
  }
}

export default AuthService;
