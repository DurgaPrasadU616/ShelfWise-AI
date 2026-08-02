import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { Notification } from '../models/notification.model.js';
import { createNotification } from '../services/notify.js';

// GET /api/notifications — paginated, user's own
export const getNotifications = asyncHandler(async (req, res) => {
  const { unread, page = 1, limit = 20 } = req.query;
  const query = { userId: req.user.id };
  if (unread === 'true') query.read = false;

  const skip = (Number(page) - 1) * Math.min(Number(limit), 100);
  const [items, total, unreadCount] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ userId: req.user.id, read: false })
  ]);

  res.status(200).json({
    success: true,
    data: { items, total, page: Number(page), limit: Number(limit), unreadCount }
  });
});

// PUT /api/notifications/:id/read
export const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { read: true },
    { new: true }
  );
  if (!notification) throw new AppError('NOT_FOUND', 'Notification not found', 404);

  res.status(200).json({ success: true, data: { read: true } });
});

// PUT /api/notifications/read-all
export const markAllRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
  res.status(200).json({ success: true, data: { updated: result.modifiedCount } });
});

// DELETE /api/notifications/:id
export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!notification) throw new AppError('NOT_FOUND', 'Notification not found', 404);
  res.status(200).json({ success: true, data: null });
});

// POST /api/notifications/test — send a test notification (manager+)
export const sendTestNotification = asyncHandler(async (req, res) => {
  const { title = 'Test Notification', message = 'This is a test alert.', type = 'info', sendEmail = false } = req.body;
  const notification = await createNotification({
    userId: req.user.id,
    title,
    message,
    type,
    sendEmail
  });
  res.status(201).json({ success: true, data: { notification } });
});
