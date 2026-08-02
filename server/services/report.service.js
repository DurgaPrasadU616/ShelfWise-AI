import { Inventory } from '../models/inventory.model.js';
import { Recommendation } from '../models/recommendation.model.js';
import { Parser } from 'json2csv';
import xl from 'excel4node';
import PDFDocument from 'pdfkit';

export const fetchReportData = async (type) => {
  let rawData = [];
  
  switch (type) {
    case 'inventory': {
      const batches = await Inventory.find({ quantity: { $gt: 0 } }).populate('product', 'name sku').lean();
      rawData = batches.map(b => ({
        SKU: b.product?.sku || 'N/A',
        Product: b.product?.name || 'Unknown',
        Quantity: b.quantity,
        'Unit Cost': b.unitCost,
        'Batch No': b.batchNo,
        Expiry: b.expiryDate ? new Date(b.expiryDate).toISOString().split('T')[0] : 'None'
      }));
      break;
    }

    case 'expiry': {
      const now = new Date();
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const expiring = await Inventory.find({ quantity: { $gt: 0 }, expiryDate: { $lte: nextMonth } }).populate('product', 'name sku').lean();
      rawData = expiring.map(b => ({
        SKU: b.product?.sku || 'N/A',
        Product: b.product?.name || 'Unknown',
        Quantity: b.quantity,
        Expiry: b.expiryDate ? new Date(b.expiryDate).toISOString().split('T')[0] : 'None',
        'Status': new Date(b.expiryDate) < now ? 'Expired' : 'Expiring Soon'
      }));
      break;
    }

    case 'recommendation': {
      const recs = await Recommendation.find({ status: 'open' }).populate('product', 'name sku').lean();
      rawData = recs.map(r => ({
        SKU: r.product?.sku || 'N/A',
        Product: r.product?.name || 'Unknown',
        Type: r.type,
        Priority: r.priority,
        'Suggested Action': r.suggestedAction
      }));
      break;
    }

    default:
      rawData = [{ Note: `Report type ${type} data not implemented yet.` }];
  }

  return rawData;
};

export const exportToCsv = (data) => {
  if (!data || data.length === 0) return '';
  const parser = new Parser();
  return parser.parse(data);
};

export const exportToExcel = async (data) => {
  return new Promise((resolve) => {
    const wb = new xl.Workbook();
    const ws = wb.addWorksheet('Report Data');

    if (data && data.length > 0) {
      const keys = Object.keys(data[0]);
      
      // Headers
      keys.forEach((key, colIndex) => {
        ws.cell(1, colIndex + 1).string(key);
      });

      // Rows
      data.forEach((row, rowIndex) => {
        keys.forEach((key, colIndex) => {
          const val = row[key];
          if (val === null || val === undefined) {
            ws.cell(rowIndex + 2, colIndex + 1).string('');
          } else if (typeof val === 'number') {
            ws.cell(rowIndex + 2, colIndex + 1).number(val);
          } else {
            ws.cell(rowIndex + 2, colIndex + 1).string(String(val));
          }
        });
      });
    }

    wb.writeToBuffer().then((buffer) => resolve(buffer));
  });
};

export const exportToPdf = async (data) => {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 30 });
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    doc.fontSize(16).text('ShelfWise AI Data Report', { align: 'center' });
    doc.moveDown();

    if (data && data.length > 0) {
      const keys = Object.keys(data[0]);
      doc.fontSize(10);
      
      data.forEach((row, index) => {
        let line = '';
        keys.forEach(key => {
          line += `${key}: ${row[key]} | `;
        });
        doc.text(line);
        if ((index + 1) % 40 === 0) doc.addPage();
      });
    } else {
      doc.text('No data available.');
    }

    doc.end();
  });
};
