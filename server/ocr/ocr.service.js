import { GoogleGenAI } from '@google/genai';
import config from '../config/env.js';
import logger from '../utils/logger.js';
import { InvoiceUpload } from '../models/invoice.model.js';

// ─── Gemini client (lazy — only initialised if key present) ───────────────────
let geminiClient = null;
function getGeminiClient() {
  if (!geminiClient && config.gemini.apiKey) {
    geminiClient = new GoogleGenAI({ apiKey: config.gemini.apiKey });
  }
  return geminiClient;
}

// ─── Extraction prompt ────────────────────────────────────────────────────────
const EXTRACTION_PROMPT = `
You are an expert AI invoice parser for an inventory management system.
Analyse this invoice image / document carefully and extract every line item.

Return ONLY a valid JSON object — no markdown, no code fences, no extra text.

Schema:
{
  "supplier": "string or null",
  "invoiceNumber": "string or null",
  "purchaseDate": "ISO8601 date string or null",
  "items": [
    {
      "productName": "string",
      "sku": "string or null",
      "category": "string — infer from product name if not stated (e.g. Medicine, Food & Bev, Cosmetics, Supplies, Other)",
      "quantity": number,
      "unitCost": number,
      "expiryDate": "ISO8601 date string or null",
      "lineTotal": number
    }
  ]
}

Rules:
- Every numeric field must be a plain number (no currency symbols).
- If a field cannot be determined, use null.
- If you cannot find any line items at all, return { "items": [] }.
- Do NOT include commentary, only the JSON object.
`;

// ─── Call Gemini Vision ───────────────────────────────────────────────────────
async function callGeminiVision(fileBuffer, mimeType) {
  const client = getGeminiClient();
  if (!client) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const base64Data = fileBuffer.toString('base64');

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Gemini OCR timeout')), config.gemini.ocrTimeoutMs)
  );

  const callPromise = client.models.generateContent({
    model: config.gemini.model,
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
          { text: EXTRACTION_PROMPT },
        ],
      },
    ],
  });

  const response = await Promise.race([callPromise, timeoutPromise]);

  // @google/genai v2: response.text is a property, not a method
  let raw = (typeof response.text === 'function' ? response.text() : response.text);
  if (!raw) {
    // Fallback: dig into candidates
    raw = response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
  raw = String(raw).trim();

  // Strip markdown fences if model wraps output
  if (raw.startsWith('```json')) raw = raw.slice(7);
  else if (raw.startsWith('```')) raw = raw.slice(3);
  if (raw.endsWith('```')) raw = raw.slice(0, -3);

  return JSON.parse(raw.trim());
}

// ─── Parse Gemini output into our internal schema ─────────────────────────────
function parseExtracted(geminiResult, fileMimeType) {
  const items = (geminiResult?.items || []).map((item) => ({
    productName: item.productName || 'Unknown Product',
    sku:         item.sku        || `SKU-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    category:    item.category   || 'Other',
    quantity:    Number(item.quantity)  || 0,
    unitCost:    Number(item.unitCost)  || 0,
    expiryDate:  item.expiryDate  ? new Date(item.expiryDate)  : null,
    purchaseDate:item.purchaseDate ? new Date(item.purchaseDate) : new Date(),
    lineTotal:   Number(item.lineTotal) || Number(item.quantity || 0) * Number(item.unitCost || 0),
  }));

  return {
    supplier:      geminiResult?.supplier      || null,
    invoiceNumber: geminiResult?.invoiceNumber || null,
    purchaseDate:  geminiResult?.purchaseDate  ? new Date(geminiResult.purchaseDate) : new Date(),
    items,
  };
}

// ─── Background OCR runner ────────────────────────────────────────────────────
async function runOcrInBackground(invoiceId, fileBuffer, mimeType) {
  let invoice;
  try {
    invoice = await InvoiceUpload.findById(invoiceId);
    if (!invoice) return;

    logger.info('OCR started', { invoiceId: invoice._id, engine: 'gemini' });

    const geminiResult = await callGeminiVision(fileBuffer, mimeType);
    const parsed = parseExtracted(geminiResult, mimeType);

    invoice.ocrEngine     = `gemini/${config.gemini.model}`;
    invoice.rawText       = JSON.stringify(geminiResult);
    invoice.extractedItems = parsed.items;
    invoice.status        = 'needs_review';
    await invoice.save();

    logger.info('OCR completed', {
      invoiceId: invoice._id,
      itemsFound: parsed.items.length,
    });
  } catch (err) {
    logger.error('OCR failed', { invoiceId, error: err.message });
    if (invoice) {
      invoice.ocrEngine     = 'gemini (failed)';
      invoice.extractedItems = [];
      invoice.status        = 'needs_review';
      invoice.error         = `OCR could not extract items automatically: ${err.message}. Please fill in the items manually.`;
      await invoice.save().catch(() => {});
    }
  }
}

// ─── Public entry point ───────────────────────────────────────────────────────
export const processInvoiceUpload = async (userId, file) => {
  // Duplicate detection: same filename + size within last 24 h
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const existing = await InvoiceUpload.findOne({
    filename: file.originalname,
    size:     file.size,
    createdAt: { $gte: cutoff },
  });
  if (existing) {
    const error = new Error('Duplicate upload detected');
    error.name       = 'DuplicateUpload';
    error.duplicateOf = existing._id;
    throw error;
  }

  // Save invoice record immediately — status: processing
  const invoice = await InvoiceUpload.create({
    userId,
    filename:  file.originalname,
    mimeType:  file.mimetype,
    size:      file.size,
    ocrEngine: 'gemini (queued)',
    status:    'processing',
  });

  // Kick off Gemini OCR in the background — upload API returns instantly
  const fileBuffer = file.buffer;
  const mimeType   = file.mimetype;
  setImmediate(() => runOcrInBackground(invoice._id, fileBuffer, mimeType));

  return invoice;
};

// ─── Retry entry point (used by retryUpload controller) ──────────────────────
// File buffer is not persisted after the initial HTTP request, so a retry
// without re-uploading the file degrades gracefully: mark needs_review so the
// user can fill items manually, or use the upload route to re-submit the file.
export const rerunOcrOnInvoice = async (invoiceId) => {
  const invoice = await InvoiceUpload.findById(invoiceId);
  if (!invoice) return;

  // Buffer is unavailable — surface a helpful error to the user
  invoice.status         = 'needs_review';
  invoice.extractedItems = [];
  invoice.error          = 'Retry requires re-uploading the file. Please use the upload form again or fill in items manually.';
  await invoice.save();
};
