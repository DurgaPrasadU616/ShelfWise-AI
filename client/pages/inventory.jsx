import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Boxes,
  Download,
  FileText,
  Inbox,
  PackagePlus,
  RefreshCw,
  X,
} from 'lucide-react';
import inventoryService from '../services/inventory.service';
import { PageHeader } from '../components/ui/page-header';
import { DataTable } from '../components/ui/data-table';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Select } from '../components/ui/select';
import { Alert } from '../components/ui/alert';
import { useToast } from '../components/ui/toast';
import { usePermission } from '../hooks/use-permission';
import { cn } from '../utils/cn';

const DAY = 86400000;

function daysFromNow(days) {
  return new Date(Date.now() + days * DAY).toISOString();
}

const DEMO_ITEMS = [
  { _id: 'd01', product: { name: 'Paracetamol 500mg', sku: 'PAR-500', category: 'Medicine' }, supplier: { name: 'MedSupply Co.' }, quantity: 320, unitCost: 1.2, expiryDate: daysFromNow(240), batchNo: 'B-2401', location: 'A1', status: 'in_stock' },
  { _id: 'd02', product: { name: 'ORS Sachet', sku: 'ORS-100', category: 'Medicine' }, supplier: { name: 'MedSupply Co.' }, quantity: 142, unitCost: 0.85, expiryDate: daysFromNow(180), batchNo: 'B-2398', location: 'A1', status: 'in_stock' },
  { _id: 'd03', product: { name: 'Vitamin C Gummies', sku: 'VIT-C', category: 'Medicine' }, supplier: { name: 'NutriPharm' }, quantity: 6, unitCost: 4.5, expiryDate: daysFromNow(160), batchNo: 'B-2391', location: 'A2', status: 'low' },
  { _id: 'd04', product: { name: 'Cough Syrup 100ml', sku: 'COU-100', category: 'Medicine' }, supplier: { name: 'MedSupply Co.' }, quantity: 0, unitCost: 3.1, expiryDate: daysFromNow(300), batchNo: 'B-2385', location: 'A2', status: 'low' },
  { _id: 'd05', product: { name: 'Antacid Tablets', sku: 'ANT-50', category: 'Medicine' }, supplier: { name: 'NutriPharm' }, quantity: 88, unitCost: 2.4, expiryDate: daysFromNow(28), batchNo: 'B-2402', location: 'A3', status: 'in_stock' },
  { _id: 'd06', product: { name: 'Ibuprofen 200mg', sku: 'IBU-200', category: 'Medicine' }, supplier: { name: 'MedSupply Co.' }, quantity: 214, unitCost: 1.75, expiryDate: daysFromNow(365), batchNo: 'B-2403', location: 'A1', status: 'in_stock' },
  { _id: 'd07', product: { name: 'Amoxicillin 250mg', sku: 'AMX-250', category: 'Medicine' }, supplier: { name: 'BioCure Labs' }, quantity: 34, unitCost: 2.9, expiryDate: daysFromNow(12), batchNo: 'B-2377', location: 'A1', status: 'in_stock' },
  { _id: 'd08', product: { name: 'Digital Thermometer', sku: 'THM-D', category: 'Supplies' }, supplier: { name: 'HealthTech' }, quantity: 41, unitCost: 8.5, expiryDate: daysFromNow(720), batchNo: 'B-2300', location: 'C1', status: 'in_stock' },
  { _id: 'd09', product: { name: 'Disposable Gloves (M)', sku: 'GLV-M', category: 'Supplies' }, supplier: { name: 'SafetyFirst' }, quantity: 502, unitCost: 0.3, expiryDate: daysFromNow(540), batchNo: 'B-2311', location: 'C2', status: 'in_stock' },
  { _id: 'd10', product: { name: 'Bandage Roll', sku: 'BND-R', category: 'Supplies' }, supplier: { name: 'SafetyFirst' }, quantity: 57, unitCost: 0.95, expiryDate: daysFromNow(420), batchNo: 'B-2312', location: 'C2', status: 'in_stock' },
  { _id: 'd11', product: { name: 'Surgical Mask (Box)', sku: 'MSK-50', category: 'Supplies' }, supplier: { name: 'SafetyFirst' }, quantity: 4, unitCost: 2.2, expiryDate: daysFromNow(200), batchNo: 'B-2309', location: 'C1', status: 'low' },
  { _id: 'd12', product: { name: 'Insulin Pen', sku: 'INS-P', category: 'Medicine' }, supplier: { name: 'BioCure Labs' }, quantity: 18, unitCost: 22.0, expiryDate: daysFromNow(-9), batchNo: 'B-2350', location: 'A3', status: 'expired' },
  { _id: 'd13', product: { name: 'Saline Solution 500ml', sku: 'SAL-500', category: 'Medicine' }, supplier: { name: 'BioCure Labs' }, quantity: 96, unitCost: 1.1, expiryDate: daysFromNow(90), batchNo: 'B-2399', location: 'A2', status: 'in_stock' },
  { _id: 'd14', product: { name: 'Hand Sanitizer 250ml', sku: 'SAN-250', category: 'Supplies' }, supplier: { name: 'SafetyFirst' }, quantity: 130, unitCost: 1.6, expiryDate: daysFromNow(480), batchNo: 'B-2314', location: 'C2', status: 'in_stock' },
  { _id: 'd15', product: { name: 'Green Tea (Box)', sku: 'TEA-25', category: 'Food & Bev' }, supplier: { name: 'DailyFresh' }, quantity: 64, unitCost: 3.4, expiryDate: daysFromNow(45), batchNo: 'B-2420', location: 'B1', status: 'in_stock' },
  { _id: 'd16', product: { name: 'Protein Shake', sku: 'PRT-400', category: 'Food & Bev' }, supplier: { name: 'NutriPharm' }, quantity: 0, unitCost: 5.6, expiryDate: daysFromNow(320), batchNo: 'B-2418', location: 'B1', status: 'low' },
  { _id: 'd17', product: { name: 'Chocolate Energy Bar', sku: 'BAR-50', category: 'Food & Bev' }, supplier: { name: 'DailyFresh' }, quantity: 210, unitCost: 1.2, expiryDate: daysFromNow(75), batchNo: 'B-2421', location: 'B2', status: 'in_stock' },
  { _id: 'd18', product: { name: 'Coconut Water 330ml', sku: 'COC-330', category: 'Food & Bev' }, supplier: { name: 'DailyFresh' }, quantity: 88, unitCost: 1.4, expiryDate: daysFromNow(18), batchNo: 'B-2415', location: 'B2', status: 'in_stock' },
  { _id: 'd19', product: { name: 'Face Moisturizer', sku: 'MOI-50', category: 'Cosmetics' }, supplier: { name: 'BeautyHub' }, quantity: 27, unitCost: 6.2, expiryDate: daysFromNow(210), batchNo: 'B-2501', location: 'D1', status: 'in_stock' },
  { _id: 'd20', product: { name: 'Lip Balm SPF15', sku: 'LIP-4', category: 'Cosmetics' }, supplier: { name: 'BeautyHub' }, quantity: 9, unitCost: 2.1, expiryDate: daysFromNow(150), batchNo: 'B-2502', location: 'D1', status: 'low' },
  { _id: 'd21', product: { name: 'Shampoo 200ml', sku: 'SHM-200', category: 'Cosmetics' }, supplier: { name: 'BeautyHub' }, quantity: 74, unitCost: 3.8, expiryDate: daysFromNow(260), batchNo: 'B-2504', location: 'D2', status: 'in_stock' },
  { _id: 'd22', product: { name: 'Sunscreen SPF50', sku: 'SUN-100', category: 'Cosmetics' }, supplier: { name: 'BeautyHub' }, quantity: 15, unitCost: 7.4, expiryDate: daysFromNow(400), batchNo: 'B-2503', location: 'D1', status: 'in_stock' },
  { _id: 'd23', product: { name: 'Antiseptic Cream', sku: 'ANT-CRM', category: 'Medicine' }, supplier: { name: 'MedSupply Co.' }, quantity: 52, unitCost: 2.8, expiryDate: daysFromNow(8), batchNo: 'B-2380', location: 'A3', status: 'in_stock' },
  { _id: 'd24', product: { name: 'Thermal Scanner', sku: 'SCN-T', category: 'Supplies' }, supplier: { name: 'HealthTech' }, quantity: 12, unitCost: 18.0, expiryDate: daysFromNow(800), batchNo: 'B-2301', location: 'C1', status: 'in_stock' },
  { _id: 'd25', product: { name: 'IV Drip Set', sku: 'IVR-1', category: 'Supplies' }, supplier: { name: 'HealthTech' }, quantity: 0, unitCost: 1.9, expiryDate: daysFromNow(30), batchNo: 'B-2305', location: 'C3', status: 'low' },
  { _id: 'd26', product: { name: 'Milk Powder 1kg', sku: 'MLK-1K', category: 'Food & Bev' }, supplier: { name: 'DailyFresh' }, quantity: 38, unitCost: 8.9, expiryDate: daysFromNow(-3), batchNo: 'B-2410', location: 'B3', status: 'expired' },
  { _id: 'd27', product: { name: 'Instant Noodles', sku: 'NDL-6', category: 'Food & Bev' }, supplier: { name: 'DailyFresh' }, quantity: 145, unitCost: 0.8, expiryDate: daysFromNow(120), batchNo: 'B-2422', location: 'B2', status: 'in_stock' },
  { _id: 'd28', product: { name: 'Vitamin D3 Drops', sku: 'VD3-30', category: 'Medicine' }, supplier: { name: 'NutriPharm' }, quantity: 5, unitCost: 5.2, expiryDate: daysFromNow(55), batchNo: 'B-2390', location: 'A2', status: 'low' },
  { _id: 'd29', product: { name: 'First Aid Kit', sku: 'FAK-1', category: 'Supplies' }, supplier: { name: 'SafetyFirst' }, quantity: 22, unitCost: 12.5, expiryDate: daysFromNow(365), batchNo: 'B-2315', location: 'C3', status: 'in_stock' },
  { _id: 'd30', product: { name: 'Probiotic Sachets', sku: 'PRB-30', category: 'Medicine' }, supplier: { name: 'NutriPharm' }, quantity: 61, unitCost: 4.9, expiryDate: daysFromNow(21), batchNo: 'B-2392', location: 'A3', status: 'in_stock' },
  { _id: 'd31', product: { name: 'Toothpaste 150g', sku: 'TTH-150', category: 'Cosmetics' }, supplier: { name: 'BeautyHub' }, quantity: 93, unitCost: 1.7, expiryDate: daysFromNow(540), batchNo: 'B-2506', location: 'D2', status: 'in_stock' },
  { _id: 'd32', product: { name: 'Cotton Balls (Pack)', sku: 'CTN-100', category: 'Cosmetics' }, supplier: { name: 'BeautyHub' }, quantity: 120, unitCost: 0.9, expiryDate: daysFromNow(600), batchNo: 'B-2505', location: 'D2', status: 'in_stock' },
];

function getStatus(item) {
  const qty = item.quantity ?? 0;
  const exp = item.expiryDate ? new Date(item.expiryDate) : null;
  const days = exp ? Math.ceil((exp.getTime() - Date.now()) / DAY) : Infinity;

  if (exp && days < 0) return { key: 'expired', label: 'Expired', variant: 'destructive' };
  if (exp && days <= 30) return { key: 'expiring', label: 'Expiring Soon', variant: 'violet' };
  if (qty === 0) return { key: 'out', label: 'Out of Stock', variant: 'destructive' };
  if (item.status === 'low') return { key: 'low', label: 'Low Stock', variant: 'warning' };
  return { key: 'in', label: 'In Stock', variant: 'success' };
}

const STATUS_OPTIONS = [
  { key: 'all', label: 'All statuses' },
  { key: 'in', label: 'In Stock' },
  { key: 'low', label: 'Low Stock' },
  { key: 'out', label: 'Out of Stock' },
  { key: 'expiring', label: 'Expiring Soon' },
  { key: 'expired', label: 'Expired' },
];

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function ExpiryCell({ dateStr }) {
  if (!dateStr) return <span className="text-muted-foreground">—</span>;
  const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / DAY);
  const tone = days < 0 ? 'text-destructive' : days <= 30 ? 'text-violet-400' : 'text-muted-foreground/70';
  return (
    <div className="leading-tight">
      <p className="font-mono text-xs">{formatDate(dateStr)}</p>
      <p className={cn('text-[11px] tabular-nums', tone)}>{days < 0 ? `${Math.abs(days)}d past due` : `${days}d left`}</p>
    </div>
  );
}

function csvCell(value) {
  const str = value == null ? '' : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingDemo, setUsingDemo] = useState(false);
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [selectedKeys, setSelectedKeys] = useState(() => new Set());
  const [restocking, setRestocking] = useState(false);
  const canRestock = usePermission(['admin', 'manager']);
  const { toast } = useToast();

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await inventoryService.getAll({ limit: 200 });
      const data = res.data?.items || [];
      setItems(data);
      setUsingDemo(false);
    } catch {
      setItems(DEMO_ITEMS);
      setUsingDemo(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const categories = useMemo(
    () => [...new Set(items.map((i) => i.product?.category).filter(Boolean))].sort(),
    [items],
  );

  const filtered = useMemo(() => {
    let list = items;
    if (category !== 'all') list = list.filter((i) => i.product?.category === category);
    if (status !== 'all') list = list.filter((i) => getStatus(i).key === status);
    return list;
  }, [items, category, status]);

  const clearSelection = () => setSelectedKeys(new Set());

  const handleRestock = async () => {
    if (!canRestock) {
      setError("You don't have permission to restock inventory. Manager or admin access is required.");
      return;
    }
    setRestocking(true);
    setError(null);
    try {
      await Promise.all([...selectedKeys].map((id) => inventoryService.adjust(id, 50, 'restock')));
      const count = selectedKeys.size;
      setSelectedKeys(new Set());
      await fetchInventory();
      toast({ title: 'Restocked', description: `${count} item${count === 1 ? '' : 's'} updated by +50 units.`, variant: 'success' });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to restock selected items.');
    } finally {
      setRestocking(false);
    }
  };

  const handleExport = (rows) => {
    if (rows.length === 0) return;
    const header = ['Product', 'SKU', 'Category', 'Batch', 'Quantity', 'Unit Cost', 'Value', 'Expiry Date', 'Status'];
    const body = rows.map((i) =>
      [
        i.product?.name,
        i.product?.sku,
        i.product?.category,
        i.batchNo,
        i.quantity,
        i.unitCost?.toFixed(2),
        ((i.quantity || 0) * (i.unitCost || 0)).toFixed(2),
        i.expiryDate ? formatDate(i.expiryDate) : '',
        getStatus(i).label,
      ]
        .map(csvCell)
        .join(','),
    );
    const blob = new Blob([[header.join(','), ...body].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Export ready', description: `${rows.length} row${rows.length === 1 ? '' : 's'} exported to CSV.`, variant: 'info' });
  };

  const columns = useMemo(() => [
    {
      key: 'product',
      header: 'Product',
      sortable: true,
      sortValue: (r) => r.product?.name,
      render: (row) => (
        <div className="min-w-0 leading-tight">
          <p className="truncate font-medium">{row.product?.name || 'Unknown product'}</p>
          <p className="font-mono text-[11px] text-muted-foreground">{row.product?.sku}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      sortValue: (r) => r.product?.category,
      className: 'hidden md:table-cell',
      headerClassName: 'hidden md:table-cell',
      render: (row) => <span className="text-muted-foreground">{row.product?.category || '—'}</span>,
    },
    {
      key: 'batchNo',
      header: 'Batch',
      sortable: true,
      className: 'hidden lg:table-cell',
      headerClassName: 'hidden lg:table-cell',
      render: (row) => <span className="font-mono text-xs text-muted-foreground">{row.batchNo || '—'}</span>,
    },
    {
      key: 'expiryDate',
      header: 'Expiry',
      sortable: true,
      sortValue: (r) => (r.expiryDate ? new Date(r.expiryDate).getTime() : 0),
      render: (row) => <ExpiryCell dateStr={row.expiryDate} />,
    },
    {
      key: 'quantity',
      header: 'Stock',
      sortable: true,
      align: 'right',
      render: (row) => <span className="font-mono font-medium">{row.quantity?.toLocaleString() ?? '0'}</span>,
    },
    {
      key: 'value',
      header: 'Value',
      sortable: true,
      align: 'right',
      sortValue: (r) => (r.quantity || 0) * (r.unitCost || 0),
      className: 'hidden lg:table-cell',
      headerClassName: 'hidden lg:table-cell',
      render: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          ${((row.quantity || 0) * (row.unitCost || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      sortValue: (r) => getStatus(r).label,
      render: (row) => <Badge variant={getStatus(row).variant}>{getStatus(row).label}</Badge>,
    },
  ],
  []
);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Track stock lines, batches, quantities, and expiry dates."
        icon={<Boxes className="h-5 w-5" />}
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport(filtered)} disabled={filtered.length === 0}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="ghost" size="icon" onClick={fetchInventory} aria-label="Refresh inventory">
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </PageHeader>

      {usingDemo && (
        <Alert
          variant="warning"
          title="Showing sample data"
          onClose={() => setUsingDemo(false)}
        >
          Inventory service is unreachable — start the API server to see live records.
        </Alert>
      )}

      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <AnimatePresence>
        {selectedKeys.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.16 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
              <p className="text-sm">
                <span className="font-mono font-semibold tabular-nums">{selectedKeys.size}</span> selected
              </p>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={handleRestock} loading={restocking}>
                  <PackagePlus className="h-4 w-4" />
                  Restock
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleExport(items.filter((i) => selectedKeys.has(i._id)))}>
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Button size="sm" variant="ghost" onClick={clearSelection}>
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <DataTable
        columns={columns}
        data={filtered}
        keyField="_id"
        loading={loading}
        searchable
        searchKeys={['product.name', 'product.sku', 'batchNo']}
        searchPlaceholder="Search products, SKUs, batches…"
        selectable
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        pageSize={8}
        emptyIcon={<Inbox className="h-6 w-6" />}
        emptyTitle={usingDemo ? 'No inventory records' : 'Inventory is empty'}
        emptyDescription={
          usingDemo
            ? 'Start the API server to load live records.'
            : 'Stock batches will appear here once inventory is added or imported via OCR.'
        }
        toolbar={
          <>
            <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-40" aria-label="Filter by category">
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44" aria-label="Filter by status">
              {STATUS_OPTIONS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </Select>
            <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex">
              <FileText className="h-3.5 w-3.5" />
              <span className="font-mono">{filtered.length}</span> records
            </span>
          </>
        }
      />
    </div>
  );
}
