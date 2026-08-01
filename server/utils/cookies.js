import config from '../config/env.js';
import AppError from '../utils/AppError.js';

const cookieBase = {
  httpOnly: true,
  secure: config.cookie.secure,
  sameSite: config.cookie.sameSite,
  path: config.cookie.path,
};

export const setRefreshCookie = (res, token) => {
  res.cookie(config.cookie.name, token, cookieBase);
};

export const clearRefreshCookie = (res) => {
  res.clearCookie(config.cookie.name, cookieBase);
};

export default { setRefreshCookie, clearRefreshCookie };
