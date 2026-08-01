import { describe, it, expect } from 'vitest';
import TokenService from '../../../server/services/token.service.js';

const service = new TokenService({
  accessSecret: 'test-access-secret',
  refreshSecret: 'test-refresh-secret',
  accessTtl: '5m',
  refreshTtl: '1d',
});

const user = { id: '507f1f77bcf86cd799439011', role: 'manager', refreshTokenVersion: 0 };

describe('TokenService', () => {
  it('signs and verifies an access token', () => {
    const token = service.signAccess(user);
    const payload = service.verifyAccess(token);
    expect(payload.sub).toBe(user.id);
    expect(payload.role).toBe('manager');
    expect(payload.type).toBe('access');
  });

  it('signs and verifies a refresh token with version', () => {
    const token = service.signRefresh(user);
    const payload = service.verifyRefresh(token);
    expect(payload.sub).toBe(user.id);
    expect(payload.ver).toBe(0);
    expect(payload.type).toBe('refresh');
  });

  it('rejects an access token that was signed with the wrong secret', () => {
    const other = new TokenService({
      accessSecret: 'different-secret',
      refreshSecret: 'different-secret',
      accessTtl: '5m',
      refreshTtl: '1d',
    });
    const token = other.signAccess(user);
    expect(() => service.verifyAccess(token)).toThrow();
  });

  it('rejects a refresh token used as an access token', () => {
    const refreshToken = service.signRefresh(user);
    expect(() => service.verifyAccess(refreshToken)).toThrow();
  });
});
