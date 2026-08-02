// ─── Local OCR text extraction (fallback) ───────────────────────────────
// Uses tesseract.js to pull raw text from an image when the Gemini engine
// is unavailable. Returns an empty string on failure so the caller can
// fall through to a manual-review flow instead of throwing.

import logger from '../utils/logger.js';

let workerPromise = null;
let tesseractModule = null;

// Lazy-load the heavy tesseract dependency only when actually needed.
async function loadTesseract() {
  if (!tesseractModule) {
    tesseractModule = await import('tesseract.js');
  }
  return tesseractModule;
}

async function getWorker() {
  if (!workerPromise) {
    const { createWorker } = await loadTesseract();
    workerPromise = createWorker('eng', 1, {
      logger: (msg) => {
        if (msg?.status === 'recognizing text') {
          logger.debug('Local OCR progress', { progress: Math.round((msg.progress || 0) * 100) });
        }
      },
    });
    workerPromise.catch(() => {
      workerPromise = null;
    });
  }
  return workerPromise;
}

// ─── Extract raw text from an image buffer ─────────────────────────────
export async function extractTextLocally(fileBuffer, mimeType) {
  let worker;
  try {
    worker = await getWorker();
  } catch (err) {
    logger.warn('Local OCR unavailable (worker init failed)', { error: err.message });
    return '';
  }

  try {
    const { data } = await worker.recognize(fileBuffer);
    return String(data?.text || '').trim();
  } catch (err) {
    logger.warn('Local OCR recognition failed', { error: err.message });
    return '';
  } finally {
    // Release the lock so a short-lived fallback doesn't hold the worker.
  }
}

// ─── Graceful teardown (avoid hanging the process on exit) ─────────────
export async function stopOcrWorker() {
  if (workerPromise) {
    try {
      const w = await workerPromise;
      await w.terminate();
    } catch {
      /* noop */
    }
    workerPromise = null;
  }
}

export default { extractTextLocally, stopOcrWorker };