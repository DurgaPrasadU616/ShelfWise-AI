import asyncHandler from '../utils/asyncHandler.js';
import { processInvoiceUpload, rerunOcrOnInvoice } from '../ocr/ocr.service.js';
import { commitInvoice } from '../services/ocr.commit.service.js';
import { InvoiceUpload } from '../models/invoice.model.js';
import AppError from '../utils/AppError.js';

export const uploadInvoice = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('INVALID_FILE', 'No file uploaded', 400);
  }

  try {
    const invoice = await processInvoiceUpload(req.user.id, req.file);
    res.status(201).json({
      success: true,
      data: {
        uploadId:   invoice._id,
        fileName:   invoice.filename,
        mimeType:   invoice.mimeType,
        size:       invoice.size,
        uploadedAt: invoice.createdAt,
        status:     'uploaded',
      },
    });
  } catch (err) {
    if (err.name === 'DuplicateUpload') {
      throw new AppError('DUPLICATE_UPLOAD', 'Invoice already uploaded', 409, { duplicateOf: err.duplicateOf });
    }
    throw err;
  }
});

export const getUploadStatus = asyncHandler(async (req, res) => {
  const invoice = await InvoiceUpload.findById(req.params.uploadId);
  if (!invoice) throw new AppError('NOT_FOUND', 'Invoice not found', 404);

  res.status(200).json({ success: true, data: invoice });
});

export const commitUpload = asyncHandler(async (req, res) => {
  const result = await commitInvoice(req, req.params.uploadId, req.body.extractedItems);
  res.status(200).json({ success: true, data: result });
});

export const rejectUpload = asyncHandler(async (req, res) => {
  const invoice = await InvoiceUpload.findById(req.params.uploadId);
  if (!invoice) throw new AppError('NOT_FOUND', 'Invoice not found', 404);

  invoice.status = 'failed';
  invoice.error  = req.body.reason || 'Manually rejected';
  await invoice.save();

  res.status(200).json({ success: true, data: { status: 'failed' } });
});

export const retryUpload = asyncHandler(async (req, res) => {
  const invoice = await InvoiceUpload.findById(req.params.uploadId);
  if (!invoice) throw new AppError('NOT_FOUND', 'Invoice not found', 404);
  if (invoice.status === 'committed') throw new AppError('CONFLICT', 'Cannot retry a committed invoice', 409);

  // Reset to processing and re-run real OCR
  invoice.status        = 'processing';
  invoice.error         = undefined;
  invoice.extractedItems = [];
  await invoice.save();

  // Re-run OCR in background (requires original file buffer — stored as null after initial upload
  // so we trigger a prompt to re-upload instead if buffer is unavailable)
  await rerunOcrOnInvoice(invoice._id);

  res.status(200).json({ success: true, data: { status: 'processing' } });
});
