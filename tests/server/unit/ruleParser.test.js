import { describe, it, expect } from 'vitest';
import { parseInvoiceWithRules, parseItemLine } from '../../../server/ocr/ruleParser.js';

const SAMPLE = [
  'MedPlus Distributors',
  'Invoice No: INV-8990      Date: 12/07/2026',
  '',
  'Item                  Qty   Rate    Amount',
  '1  Amox 500 Capsule    5     25.00    125.00',
  '2  Cetrizine tablets   10    12.50    125.00',
  '3  Dolo 650 Tablet     6     13.50     81.00',
  '',
  'Sub Total                             331.00',
].join('\n');

describe('ruleParser', () => {
  it('extracts supplier, invoice number and date', () => {
    const out = parseInvoiceWithRules(SAMPLE);
    expect(out.supplier).toContain('MedPlus');
    expect(out.invoiceNumber).toContain('899');
    expect(out.purchaseDate).toBeInstanceOf(Date);
  });

  it('parses line items with quantity, unit price and line total', () => {
    const out = parseInvoiceWithRules(SAMPLE);
    expect(out.items.length).toBeGreaterThanOrEqual(2);
    const amox = out.items.find((i) => i.productName.includes('Amox'));
    expect(amox).toBeTruthy();
    expect(amox.quantity).toBe(5);
    expect(amox.unitPrice).toBe(25);
    expect(amox.lineTotal).toBe(125);
  });

  it('infers categories from product names', () => {
    const out = parseInvoiceWithRules(SAMPLE);
    const amox = out.items.find((i) => i.productName.includes('Amox'));
    expect(amox.category).toBe('Medicine');
  });

  it('never throws on empty or garbage input', () => {
    expect(() => parseInvoiceWithRules('')).not.toThrow();
    expect(() => parseInvoiceWithRules(null)).not.toThrow();
    expect(() => parseInvoiceWithRules(undefined)).not.toThrow();
  });

  it('drops totals and header rows from items', () => {
    const out = parseInvoiceWithRules(SAMPLE);
    const hasTotalRow = out.items.some((i) => /sub.?total|grand.?total/i.test(i.productName));
    expect(hasTotalRow).toBe(false);
  });

  it('handles an invalid-parse line gracefully', () => {
    // A line with no money value is not a valid line item
    const item = parseItemLine('A random note line without numbers');
    expect(item).toBeNull();
  });
});