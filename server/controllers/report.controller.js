import asyncHandler from '../utils/asyncHandler.js';
import { Report } from '../models/report.model.js';
import { fetchReportData, exportToCsv, exportToExcel, exportToPdf } from '../services/report.service.js';
import AppError from '../utils/AppError.js';

export const getReports = asyncHandler(async (req, res) => {
  const reports = await Report.find().sort({ createdAt: -1 }).populate('generatedBy', 'name email').lean();
  res.status(200).json({ success: true, data: { items: reports } });
});

export const generateReport = asyncHandler(async (req, res) => {
  const { type, filters } = req.body;
  
  if (!['inventory', 'expiry', 'recommendation'].includes(type)) {
    throw new AppError('Invalid report type', 422, 'VALIDATION_ERROR');
  }

  const data = await fetchReportData(type);
  
  const report = await Report.create({
    name: `${type}-report-${new Date().toISOString().split('T')[0]}`,
    type,
    generatedBy: req.user.id,
    filters: filters || {},
    data
  });

  res.status(201).json({ success: true, data: { report } });
});

export const getReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id).populate('generatedBy', 'name email').lean();
  if (!report) throw new AppError('Report not found', 404, 'NOT_FOUND');
  
  res.status(200).json({ success: true, data: report });
});

export const downloadReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id).lean();
  if (!report) throw new AppError('Report not found', 404, 'NOT_FOUND');
  
  const format = req.query.format || 'csv';
  const filename = `${report.name}.${format === 'excel' ? 'xlsx' : format}`;
  
  let buffer;
  let contentType;

  if (format === 'csv') {
    buffer = Buffer.from(exportToCsv(report.data));
    contentType = 'text/csv';
  } else if (format === 'excel') {
    buffer = await exportToExcel(report.data);
    contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  } else if (format === 'pdf') {
    buffer = await exportToPdf(report.data);
    contentType = 'application/pdf';
  } else {
    throw new AppError('Invalid format requested', 400, 'VALIDATION_ERROR');
  }

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
});
