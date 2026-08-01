import asyncHandler from '../utils/asyncHandler.js';
import { setRefreshCookie, clearRefreshCookie } from '../utils/cookies.js';
import AuthService from '../services/auth.service.js';

const authService = new AuthService();

export const register = asyncHandler(async (req, res) => {
  const { user } = await authService.register(req.body);
  return res.status(201).json({ success: true, data: { user } });
});

export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken, expiresIn } = await authService.login(req.body);
  setRefreshCookie(res, refreshToken);
  return res.status(200).json({
    success: true,
    data: { accessToken, expiresIn, user },
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.sw_refresh;
  const { accessToken, refreshToken: nextRefresh, expiresIn } = await authService.refresh(refreshToken);
  setRefreshCookie(res, nextRefresh);
  return res.status(200).json({
    success: true,
    data: { accessToken, expiresIn },
  });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user.id);
  clearRefreshCookie(res);
  return res.status(200).json({ success: true, data: null });
});

export const me = asyncHandler(async (req, res) => {
  const { user } = await authService.me(req.user.id);
  return res.status(200).json({ success: true, data: { user } });
});

export default { register, login, refresh, logout, me };
