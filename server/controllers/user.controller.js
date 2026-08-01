import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import UserService from '../services/user.service.js';

const userService = new UserService();

export const listUsers = asyncHandler(async (req, res) => {
  const { role, isActive, q, page, limit } = req.query;
  const result = await userService.list({ role, isActive, q, page, limit });
  return res.status(200).json({ success: true, data: result });
});

export const createUser = asyncHandler(async (req, res) => {
  const { user } = await userService.create(req.body);
  return res.status(201).json({ success: true, data: { user } });
});

export const updateUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) {
    throw new AppError('FORBIDDEN', 'Cannot update your own user here', 403);
  }
  const { user } = await userService.update(req.params.id, req.body);
  return res.status(200).json({ success: true, data: { user } });
});

export const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) {
    throw new AppError('FORBIDDEN', 'Cannot delete your own user', 403);
  }
  const { user } = await userService.softDelete(req.params.id);
  return res.status(200).json({ success: true, data: { user } });
});

export default { listUsers, createUser, updateUser, deleteUser };
