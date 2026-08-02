// ─── Rule-based invoice parser ──────────────────────────────────────────
// Extracts the same product schema as the AI parser, but purely from OCR
// text using regex. Used as an automatic fallback when the AI engine is
// unavailable (rate limit, timeout, network error, invalid response).
// It never throws — it returns the best it can salvage from the text.

const CATEGORY_HINTS = [
  { label: 'Medicine', pattern: /paracetamol|ibuprofen|aspirin|capsule|caps |tablet|tab |syrup|drops|ointment|gel |antibiotic|insulin|pharma|dolo|crocin|calpol|panadol|augmentin|amoxicillin|metformin|vitamin|b-complex|oral|zinc|calcium/i },
  { label: 'Food & Bev', pattern: /tea |coffee|juice|milk |biscuit|cookie|chips|snack|water|soda|energy|ice ?cream|bread|cereal|yogurt|pasta|oats|haldiram|bikaji/i },
  { label: 'Cosmetics', pattern: /cream|shampoo|soap|perfume|lotion|serum|mask|deodorant|lip[ -]?balm|sunscreen|vaseline/i },
  { label: 'Supplies', pattern: /glove|mask|gauze|bandage|syringe|needle|cotton|swab|sanitizer|disinfectant|gown|thermometer|surgical|detergent/i },
  { label: 'Electronics', pattern: /charger|battery|cable|device|headphone|speaker|sensor|iot/i },
];

function inferCategory(line = '') {
  for (const hint of CATEGORY_HINTS) if (hint.pattern.test(line)) return hint.label;
  return 'Other';
}

function toNumber(value) {
  const cleaned = String(value ?? '').replace(/₹|Rs\.?|INR|\$|€|£|,/g, '');
  if (!cleaned.trim()) return 0;
  let parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return 0;
  if (Number.isInteger(parsed) && cleaned.includes('.')) parsed = Number(cleaned);
  return parsed;
}

// Lines that must never be treated as line items.
const HEADER_FOOTER = /^(.*\b)(supplier|vendor|bill ?(to|from)|sold ?by|customer|invoice( ?no| ?#)?|date|phone|tel|gst|cst|pan|total|sub.?total|grand.?total|amount|balance|qty|quantity|rate|price|gst|tax|cgst|sgst|igst|sl.?no|sl|item|description|pcs|b\.?ar|page|payment|due|party|address).*$/i;

function parseQty(value) {
  const n = toNumber(value);
  return Number.isInteger(n) && n >= 0 ? n : 0;
}

function parseDate(str) {
  const s = String(str || '').trim();
  if (!s) return null;
  const dmy = s.match(/\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b/);
  if (dmy) {
    const [, p1, p2, p3] = dmy.map((x) => Number(x));
    let y, m, d;
    if (p1 >= 1000) { y = p1; m = p2; d = p3; }
    else { d = p1; m = p2; y = p3 < 100 ? 2000 + p3 : p3; }
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      const date = new Date(y, m - 1, d);
      if (!Number.isNaN(date.getTime())) return date;
    }
  }
  const mon = s.match(/\b(0?\d|1[0-2])[/\-.]\d{2,4}\b/);
  return null;
}

// Extract [quantity, unitPrice, lineTotal] from a row line.
function extractNumbers(line) {
  const cleaned = line.replace(/,/g, '').trim();
  // Collect all decimal + integer money tokens
  const decimals = [...cleaned.matchAll(/\b(\d+\.\d{2})\b/g)].map((m2) => Number(m2[1]));
  let xQty = 0;
  const xm = cleaned.match(/(\d{1,4})\s*[xX×@*]\s*(\d+(?:\.\d{1,2})?)/);
  if (xm) {
    xQty = Number(xm[1]);
    decimals.push(Number(xm[2]));
  }

  let unitPrice = 0;
  let lineTotal = 0;
  let qty = 0;

  if (decimals.length >= 2) {
    lineTotal = decimals[decimals.length - 1];
    unitPrice = decimals[decimals.length - 2];
  } else if (decimals.length === 1) {
    unitPrice = decimals[0];
    lineTotal = decimals[0];
  }

  // Quantity: explicit "N x" wins; else derive from total/rate if integer.
  if (xQty > 0) {
    qty = xQty;
    if (decimals.length === 1) {
      lineTotal = unitPrice * qty;
    }
  } else if (lineTotal > 0 && unitPrice > 0) {
    const derived = lineTotal / unitPrice;
    if (Number.isInteger(derived) && derived >= 1 && derived <= 9999) qty = derived;
  }

  return { qty, unitPrice, lineTotal, justNumbers: decimals.length === 0 };
}

// Strip numeric cruft from the product name.
function cleanName(line, qty, unitPrice, lineTotal) {
  let name = line.trim();
  // Replace repeated separators
  name = name.replace(/[.=………_]{2,}/g, ' ');
  name = name.replace(/\s+/g, ' ').trim();
  // Remove a leading row index "1." / "1)" / "1 -" / "1 "
  name = name.replace(/^\s*\d{1,3}\s*[.)\-:]\s+/, ' ');
  name = name.replace(/^\d{1,3}\s+(?=[A-Za-z])/, ' ');
  name = name.replace(/\s+/g, ' ').trim();
  // Remove trailing amounts
  name = name.replace(/\s*\d+(?:\.\d{1,2})?(\s+\d+(?:\.\d{1,2})?)?\s*$/, ' ');
  name = name.replace(/\s+\d+\.\d{2}\s*$/, ' ');
  name = name.replace(/\s+/g, ' ').trim();
  return name;
}

// Extract a single item row.
export function parseItemLine(line, invoiceDate) {
  const text = String(line || '').trim();
  if (!text) return null;

  const { qty, unitPrice, lineTotal, justNumbers } = extractNumbers(text);
  let name = cleanName(text);
  if (name.length < 2) return null;

  // Skip footer/header/ballet lines even if they have numbers.
  if (HEADER_FOOTER.test(name.toLowerCase().trim())) return null;
  if (name.replace(/\d+/g, '').trim().length < 2) return null;
  if (!/[a-zA-Z]/.test(name) && unitPrice === 0 && qty === 0) return null;

  // A real line item almost always carries a price. Drop pure label/address
  // rows that have no money value.
  if (unitPrice === 0 && lineTotal === 0) return null;

  // Strip a trailing bare quantity integer that the name clean left behind.
  if (qty > 0) {
    const re = new RegExp(`\\s*${qty}\\s*$`);
    if (re.test(name)) name = name.replace(re, ' ').trim();
  }

  return {
    productName: name.slice(0, 120),
    sku: null,
    category: inferCategory(name),
    quantity: qty,
    unitPrice,
    lineTotal,
  };
}

export function parseInvoiceWithRules(ocrText) {
  const lines = String(ocrText || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  let supplier = null;
  let invoiceNumber = null;
  let purchaseDate = null;

  for (const line of lines) {
    if (!supplier && /(supplier|vendor|sold ?by|billed? ?by|distribut)/i.test(line) && !/invoice/i.test(line)) {
      const m = line.replace(/^.*?(supplier|vendor|sold ?by|billed? ?by):?-?\s*/i, '').trim();
      if (m) supplier = m.slice(0, 120);
    }
    if (!invoiceNumber) {
      const m = line.match(/invoice\s*(?:no\.?|#|n\.?)?\s*[:#-]?\s*([A-Za-z0-9\-/]+)/i);
      if (m) invoiceNumber = m[1].slice(0, 60);
    }
    if (!purchaseDate) {
      const d = parseDate(line);
      if (d) purchaseDate = d;
    }
  }

  const items = [];
  for (const line of lines) {
    if (/^(sl|sr|no|item|qty|rate|amount|total|sub|grand|balance|description|product|particular)/i.test(line.trim()) && items.length === 0) {
      continue;
    }
    const item = parseItemLine(line);
    if (item) items.push(item);
  }

  const seen = new Set();
  const unique = [];
  for (const it of items) {
    const key = `${it.productName}|${it.unitPrice}`;
    if (!seen.has(key)) { seen.add(key); unique.push(it); }
  }

  return {
    supplier: supplier || null,
    invoiceNumber: invoiceNumber || null,
    purchaseDate: purchaseDate || new Date(),
    items: unique,
  };
}

export default { parseInvoiceWithRules: parseInvoiceWithRules, parseItemLine };