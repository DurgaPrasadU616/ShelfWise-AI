import { AuditLog } from '../models/auditLog.model.js';

class AuditLogService {
  /**
   * Log an action in the system
   * @param {Object} req - Express request object (to extract user and ip)
   * @param {String} action - e.g., 'CREATE', 'UPDATE', 'DELETE', 'ADJUST'
   * @param {String} resource - e.g., 'Product', 'Inventory'
   * @param {String} resourceId - The ID of the affected document
   * @param {Object} details - Additional details (e.g., previous state, new state)
   */
  async logAction(req, action, resource, resourceId = null, details = {}) {
    try {
      const userId = req.user?.id;
      if (!userId) return; // Do not log if no authenticated user

      // Simple IP extraction
      const ip = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '';

      await AuditLog.create({
        userId,
        action,
        resource,
        resourceId,
        details,
        ip
      });
    } catch (error) {
      console.error('AuditLog Service Error:', error);
      // We purposefully don't throw here to avoid failing the main request if logging fails
    }
  }

  async getLogs(query) {
    const { action, resource, from, to, page = 1, limit = 20 } = query;
    const filter = {};
    
    if (action) filter.action = action;
    if (resource) filter.resource = resource;
    
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('userId', 'name email'),
      AuditLog.countDocuments(filter)
    ]);

    return {
      items,
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit) || 1
    };
  }
}

export default new AuditLogService();
