import { GoogleGenAI } from '@google/genai';
import config from '../config/env.js';
import logger from '../utils/logger.js';
import { InvoiceUpload } from '../models/invoice.model.js';
import { parseInvoiceWithRules } from './ruleParser.js';
import { extractTextLocally } from './localOcr.js';

// User-friendly message shown when the AI engine is unavailable.
const RULE_FALLBACK_MESSAGE =
  'AI extraction is temporarily unavailable. Basic OCR extraction has been used. Please review the extracted fields.';

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

// ─── Classify a Gemini failure so we can log it clearly and decide the
//     appropriate recovery path (always graceful, never user-facing) ─────
function classifyGeminiError(err) {
  const status = err?.status || err?.code || err?.statusCode || err?.response?.status || 0;
  const message = String(err?.message || '');

  if (status === 429 || message.toUpperCase().includes('RESOURCE_EXHAUSTED') || message.toUpperCase().includes('429')) {
    return 'rate_limit';
  }
  if (status === 408 || message.toLowerCase().includes('timeout')) {
    return 'timeout';
  }
  if (status === 403 && message.toUpperCase().includes('API_KEY')) {
    return 'auth_error';
  }
  if (message.toLowerCase().includes('network') || message.toLowerCase().includes('fetch failed') || /ENOTFOUND|ECONNREFUSED|ECONNRESET|ETIMEDOUT/i.test(message)) {
    return 'network';
  }
  if (err instanceof SyntaxError || message.toLowerCase().includes('json') || message.toLowerCase().includes('invalid') || status === 422) {
    return 'invalid_response';
  }
  return 'other';
}

// ─── Call Gemini Vision ───────────────────────────────────────────────────────
async function callGeminiVision(fileBuffer, mimeType) {
  const client = getGeminiClient();
  if (!client) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const base64Data = fileBuffer.toString('base64');

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => {
      const e = new Error(`Gemini OCR timeout after ${config.gemini.ocrTimeoutMs}ms`);
      e.status = 408;
      reject(e);
    }, config.gemini.ocrTimeoutMs)
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

  try {
    return JSON.parse(raw.trim());
  } catch {
    // Invalid response — carry the raw text so the caller can still attempt
    // the rule-based fallback on it.
    const e = new Error('Gemini returned an invalid or unparseable response');
    e.status = 422;
    e.rawText = raw;
    throw e;
  }
}

// ─── Parse extracted output into our internal schema ────────────────────────
// Accepts both the AI result (uses `unitCost`) and the rule parser result
// (uses `unitPrice`) — maps both to `unitCost` for the review screen.
function parseExtracted(result) {
  const items = (result?.items || []).map((item, i) => ({
    productName:   item.productName || 'Unknown Product',
    sku:           item.sku         || `SKU-${Date.now()}-${i}`,
    category:      item.category    || 'Other',
    quantity:      Number(item.quantity)  || 0,
    unitCost:      Number.isFinite(Number(item.unitCost)) ? Number(item.unitCost) : (Number.isFinite(Number(item.unitPrice)) ? Number(item.unitPrice) : 0),
    expiryDate:    item.expiryDate  ? new Date(item.expiryDate)  : null,
    purchaseDate:  item.purchaseDate ? new Date(item.purchaseDate) : new Date(),
    lineTotal:     Number(item.lineTotal) || Number(item.quantity || 0) * Number(item.unitCost || item.unitPrice || 0),
  }));

  return {
    supplier:      result?.supplier      || null,
    invoiceNumber: result?.invoiceNumber || null,
    purchaseDate:  result?.purchaseDate  ? new Date(result.purchaseDate) : new Date(),
    items,
  };
}

// ─── Rule-based fallback: pull raw text locally, then parse with regex ─────
async function extractWithRules(fileBuffer, mimeType, priorRawText) {
  // 1) If Gemini already produced raw text (invalid JSON case), reuse it.
  let ocrText = priorRawText || '';
  // 2) Otherwise run local OCR (tesseract) to obtain text.
  if (!ocrText && /image/i.test(mimeType)) {
    ocrText = await extractTextLocally(fileBuffer, mimeType);
  }
  if (!ocrText.trim()) {
    return { items: [] };
  }
  const ruleResult = parseInvoiceWithRules(ocrText);
  return { ...ruleResult, rawText: ocrText };
}

// ─── Background OCR runner ────────────────────────────────────────────────────
async function runOcrInBackground(invoiceId, fileBuffer, mimeType) {
  let invoice;
  try {
    invoice = await InvoiceUpload.findById(invoiceId);
    if (!invoice) return;

    logger.info('OCR started', { invoiceId: invoice._id, engine: 'gemini' });

    const geminiResult = await callGeminiVision(fileBuffer, mimeType);
    const parsed = parseExtracted(geminiResult);

    invoice.ocrEngine     = `gemini/${config.gemini.model}`;
    invoice.rawText       = JSON.stringify(geminiResult);
    invoice.extractedItems = parsed.items;
    invoice.status        = 'needs_review';
    await invoice.save();

    logger.info('OCR completed', {
      invoiceId: invoice._id,
      engine: 'gemini',
      itemsFound: parsed.items.length,
    });
  } catch (err) {
    const kind = classifyGeminiError(err);
    logger.warn('Gemini extraction failed — switching to rule-based fallback', {
      invoiceId,
      failure: kind,
      detail: err.message,
      hasRawText: Boolean(err.rawText),
    });

    if (!invoice) return;

    try {
      const fallback = await extractWithRules(fileBuffer, mimeType, err.rawText);
      const parsed = parseExtracted(fallback);

      invoice.ocrEngine       = 'rule (fallback)';
      invoice.rawText         = fallback?.rawText || err.rawText || '';
      invoice.extractedItems  = parsed.items;
      invoice.status          = 'needs_review';
      invoice.severity        = parsed.items.length > 0 ? 'warning' : 'error';
      // Friendly message for the Review & Confirm screen. Technical error
      // details are only logged, never surfaced to the user.
      invoice.error          = RULE_FALLBACK_MESSAGE;

      await invoice.save();

      logger.info('OCR completed via rule-based fallback', {
        invoiceId: invoice._id,
        itemsFound: parsed.items.length,
        failure: kind,
      });
    } catch (fallbackErr) {
      logger.error('Rule-based fallback also failed', {
        invoiceId,
        original: kind,
        fallback: fallbackErr.message,
      });
      invoice.status        = 'needs_review';
      invoice.ocrEngine     = 'rule-based (failed)';
      invoice.extractedItems = [];
      invoice.severity      = 'error';
      // Never leak API errors to the user.
      invoice.error         = RULE_FALLBACK_MESSAGE;
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
