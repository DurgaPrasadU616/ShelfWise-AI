import { Inventory } from '../models/inventory.model.js';
import { Product } from '../models/product.model.js';
import { Sale } from '../models/sale.model.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthKey(date) {
  // 1-indexed month label offset 1 so we can index into MONTHS easily
  return date.getFullYear() * 12 + date.getMonth();
}

function toMonthLabel(ym) {
  const month = ym % 12;
  return MONTHS[month];
}

// ─── Inventory value trend (last 6 months, grouped by receivedAt) ────────────
export const getValueTrend = async () => {
  const since = new Date();
  since.setMonth(since.getMonth() - 5);
  since.setDate(1);

  const rows = await Inventory.aggregate([
    { $match: { quantity: { $gt: 0 }, receivedAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$receivedAt' } },
        value: { $sum: { $multiply: ['$quantity', '$unitCost'] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const byKey = new Map();
  rows.forEach((r) => byKey.set(r._id, r.value));

  const result = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    result.push({ month: toMonthLabel(monthKey(d)), value: Math.round(byKey.get(key) || 0) });
  }
  return result;
};

// ─── Expiry timeline (units expiring each of the next 8 weeks) ───────────────
export const getExpiryTimeline = async () => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 8 * 7);

  const batches = await Inventory.find({
    quantity: { $gt: 0 },
    expiryDate: { $gte: start, $lt: end },
  })
    .select('quantity expiryDate')
    .lean();

  const buckets = Array.from({ length: 7 }, (_, i) => ({ week: `Wk ${i + 1}`, units: 0 }));

  batches.forEach((b) => {
    const diffMs = new Date(b.expiryDate) - start;
    const diffDays = Math.floor(diffMs / 864e5);
    const weekIndex = Math.floor(diffDays / 7);
    if (weekIndex >= 0 && weekIndex < 7) {
      buckets[weekIndex].units += b.quantity || 0;
    }
  });

  return buckets;
};

// ─── Demand forecast (actual sales + naive forecast for next period) ─────────
export const getDemandForecast = async () => {
  const since = new Date();
  since.setMonth(since.getMonth() - 5);
  since.setDate(1);

  const rows = await Sale.aggregate([
    { $match: { saleDate: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$saleDate' } },
        units: { $sum: '$quantity' },
      },
    },
  ]);

  const byKey = new Map();
  rows.forEach((r) => byKey.set(r._id, r.units));

  const now = new Date();
  const actual = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    actual.push({ ym: monthKey(d), label: toMonthLabel(monthKey(d)), value: byKey.get(key) || 0 });
  }

  // Naive forecast: average of the observed months, applied to the next 2 periods.
  const avg = actual.reduce((sum, a) => sum + a.value, 0) / Math.max(actual.length, 1);
  const forecast = [Math.round(avg), Math.round(avg)];

  const result = [];
  for (let i = 0; i < actual.length; i++) {
    result.push({ month: actual[i].label, actual: actual[i].value, forecast: null });
  }
  for (let f = 0; f < forecast.length; f++) {
    const d = new Date(now.getFullYear(), now.getMonth() + 1 + f, 1);
    result.push({ month: toMonthLabel(monthKey(d)), actual: null, forecast: forecast[f] });
  }
  return result;
};

// ─── Category distribution (active products by category) ──────────────────────
export const getCategoryDistribution = async () => {
  const rows = await Product.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const total = rows.reduce((sum, r) => sum + r.count, 0) || 1;
  return rows.map((r) => ({
    name: r._id || 'Uncategorized',
    value: Math.round((r.count / total) * 100),
    count: r.count,
  }));
};

// ─── Full dashboard snapshot ──────────────────────────────────────────────────
export const getDashboardAnalytics = async () => {
  const [valueTrend, expiryTimeline, forecast, categories] = await Promise.all([
    getValueTrend(),
    getExpiryTimeline(),
    getDemandForecast(),
    getCategoryDistribution(),
  ]);

  return {
    valueTrend,
    expiryTimeline,
    demandForecast: forecast,
    categoryDistribution: categories,
  };
};