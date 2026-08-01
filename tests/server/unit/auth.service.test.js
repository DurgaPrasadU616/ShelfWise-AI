import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import AuthService from '../../../server/services/auth.service.js';
import AppError from '../../../server/utils/AppError.js';

describe('AuthService', () => {
  let authService;
  let mockUserRepository;
  let mockTokenService;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: vi.fn(),
      findByEmailWithPassword: vi.fn(),
      create: vi.fn(),
      findById: vi.fn(),
      incrementRefreshVersion: vi.fn(),
    };

    mockTokenService = {
      signAccess: vi.fn().mockReturnValue('mock-access-token'),
      signRefresh: vi.fn().mockReturnValue('mock-refresh-token'),
      verifyRefresh: vi.fn(),
      accessTtl: '15m',
    };

    authService = new AuthService(mockUserRepository, mockTokenService);
  });

  describe('register', () => {
    it('creates a new user and hashes password', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockImplementation(async (data) => ({ id: '1', ...data }));

      const result = await authService.register({ name: 'Test', email: 'test@example.com', password: 'password123' });

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(result.user).toBeDefined();
      expect(result.user.name).toBe('Test');
    });

    it('throws error if email already exists', async () => {
      mockUserRepository.findByEmail.mockResolvedValue({ id: '1' });
      await expect(
        authService.register({ name: 'Test', email: 'test@example.com', password: 'password123' })
      ).rejects.toThrow(AppError);
    });
  });

  describe('login', () => {
    it('returns tokens on valid credentials', async () => {
      const hash = await bcrypt.hash('password123', 1);
      mockUserRepository.findByEmailWithPassword.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        isActive: true,
        passwordHash: hash
      });

      const result = await authService.login({ email: 'test@example.com', password: 'password123' });
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(result.user).toBeDefined();
    });

    it('throws error on invalid password', async () => {
      const hash = await bcrypt.hash('password123', 1);
      mockUserRepository.findByEmailWithPassword.mockResolvedValue({
        id: '1',
        isActive: true,
        passwordHash: hash
      });

      await expect(
        authService.login({ email: 'test@example.com', password: 'wrong' })
      ).rejects.toThrow('Invalid credentials');
    });
  });
});
