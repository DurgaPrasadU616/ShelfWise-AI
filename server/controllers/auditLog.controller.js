import asyncHandler from '../utils/asyncHandler.js';
import auditLogService from '../services/auditLog.service.js';

export const getAuditLogs = asyncHandler(async (req, res) => {
  const result = await auditLogService.getLogs(req.query);
  res.status(200).json({ success: true, data: result });
});
