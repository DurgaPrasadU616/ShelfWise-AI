import { Notification } from '../models/notification.model.js';
import { User } from '../models/user.model.js';
import { sendEmailAlert } from '../services/notification.service.js';

/**
 * Create a notification and optionally send via email.
 * @param {object} opts
 * @param {string} opts.userId - Recipient user ID
 * @param {string} opts.title
 * @param {string} opts.message
 * @param {'info'|'warning'|'danger'} [opts.type='info']
 * @param {string} [opts.link]
 * @param {boolean} [opts.sendEmail=false]
 */
export const createNotification = async ({ userId, title, message, type = 'info', link, sendEmail = false }) => {
  const notification = await Notification.create({
    userId,
    title,
    message,
    type,
    link,
    channels: {
      dashboard: true,
      email: { sent: false },
      whatsapp: { sent: false }
    }
  });

  if (sendEmail) {
    try {
      const user = await User.findById(userId).select('email name').lean();
      if (user?.email) {
        const emailResult = await sendEmailAlert({
          to: user.email,
          subject: `[ShelfWise] ${title}`,
          title,
          message,
          type
        });
        if (emailResult.success) {
          await Notification.findByIdAndUpdate(notification._id, {
            'channels.email.sent': true,
            'channels.email.sentAt': new Date()
          });
        }
      }
    } catch (err) {
      console.error('[Notification] Email send failed:', err.message);
    }
  }

  return notification;
};

/**
 * Broadcast a notification to all managers and admins.
 */
export const broadcastAlert = async ({ title, message, type = 'info', link, sendEmail = false }) => {
  const managers = await User.find({ role: { $in: ['admin', 'manager'] }, isActive: true }).select('_id').lean();
  
  const promises = managers.map(m =>
    createNotification({ userId: m._id, title, message, type, link, sendEmail })
  );
  
  await Promise.allSettled(promises);
};
