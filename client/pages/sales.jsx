import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Receipt, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import saleService from '../services/sale.service';
import productService from '../services/product.service';
import { PageHeader } from '../components/ui/page-header';
import { DataTable } from '../components/ui/data-table';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Select } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Modal } from '../components/ui/modal';
import { Alert } from '../components/ui/alert';
import { useToast } from '../components/ui/toast';
import { usePermission } from '../hooks/use-permission';

const DEMO_SALES = [
  { _id: 's1', product: { _id: 'p1', name: 'Paracetamol 500mg', sku: 'PAR-500' }, quantity: 24, unitPrice: 4.5, saleDate: new Date().toISOString(), invoiceRef: 'INV-1042' },
  { _id: 's2', product: { _id: 'p3', name: 'Digital Thermometer', sku: 'THM-D' }, quantity: 6, unitPrice: 19.99, saleDate: new Date().toISOString(), invoiceRef: 'INV-1041' },
  { _id: 's3', product: { _id: 'p2', name: 'Vitamin C Gummies', sku: 'VIT-C' }, quantity: 12, unitPrice: 8.25, saleDate: new Date().toISOString(), invoiceRef: 'INV-1040' },
];

const toDate = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—');

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const canManage = usePermission(['admin', 'manager', 'inventory_staff']);
  const { toast } = useToast();

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const res = await saleService.getAll({ limit: 500 });
      setSales(res.data?.items || res.data || []);
      setUsingDemo(false);
    } catch {
      setSales(DEMO_SALES);
      setUsingDemo(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await productService.getAll({ limit: 500 });
      setProducts(res.data?.items || res.data || []);
    } catch {
      setProducts([]);
    }
  }, []);

  useEffect(() => {
    fetchSales();
    fetchProducts();
  }, [fetchSales, fetchProducts]);

  const columns = useMemo(() => [
    {
      key: 'product.name',
      header: 'Product',
      sortable: true,
      render: (row) => (
        <div className="min-w-0 leading-tight">
          <p className="truncate font-medium">{row.product?.name || '—'}</p>
          <p className="font-mono text-[11px] text-muted-foreground">{row.product?.sku || ''}</p>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Qty',
      sortable: true,
      align: 'right',
      render: (row) => <span className="font-mono tabular-nums">{row.quantity}</span>,
    },
    {
      key: 'unitPrice',
      header: 'Unit Price',
      sortable: true,
      align: 'right',
      render: (row) => <span className="font-mono tabular-nums">₹{Number(row.unitPrice).toFixed(2)}</span>,
    },
    {
      key: 'total',
      header: 'Total',
      sortable: true,
      sortValue: (r) => (r.quantity || 0) * (r.unitPrice || 0),
      align: 'right',
      render: (row) => (
        <Badge variant="success" className="font-mono">
          ₹{(row.quantity * row.unitPrice).toFixed(2)}
        </Badge>
      ),
    },
    {
      key: 'saleDate',
      header: 'Date',
      sortable: true,
      sortValue: (r) => (r.saleDate ? new Date(r.saleDate).getTime() : 0),
      render: (row) => <span className="text-muted-foreground">{toDate(row.saleDate)}</span>,
    },
    {
      key: 'invoiceRef',
      header: 'Invoice',
      sortable: true,
      className: 'hidden md:table-cell',
      headerClassName: 'hidden md:table-cell',
      render: (row) => <span className="font-mono text-xs text-muted-foreground">{row.invoiceRef || '—'}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) =>
        canManage ? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Delete sale"
            className="text-rose-400 hover:text-rose-300"
            onClick={() => setDeleteTarget(row)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null,
    },
  ], [canManage]);

  const handleExport = () => {
    const rows = sales.filter((s) => s.product);
    if (rows.length === 0) return;
    const lines = rows.map((s) =>
      [s.product.name, s.product.sku, s.quantity, s.unitPrice, (s.quantity * s.unitPrice).toFixed(2), toDate(s.saleDate), s.invoiceRef || '']
        .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')
    );
    const blob = new Blob([['Product,SKU,Qty,Unit Price,Total,Date,Invoice', ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Export ready', description: `${rows.length} sales exported.`, variant: 'info' });
  };

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { product: '', quantity: '', unitPrice: '', saleDate: new Date().toISOString().slice(0, 10), invoiceRef: '' },
  });

  const onSubmit = async (data) => {
    try {
      await saleService.create({
        product: data.product,
        quantity: Number(data.quantity),
        unitPrice: Number(data.unitPrice),
        saleDate: data.saleDate || undefined,
        invoiceRef: data.invoiceRef,
      });
      toast({ title: 'Sale recorded', description: 'Sale has been added.', variant: 'success' });
      setIsModalOpen(false);
      reset();
      fetchSales();
    } catch (err) {
      toast({ title: 'Failed to record sale', description: err?.response?.data?.error?.message || err.message, variant: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await saleService.delete(deleteTarget._id);
      toast({ title: 'Sale deleted', description: 'Sale removed from records.', variant: 'success' });
    } catch (err) {
      toast({ title: 'Delete failed', description: err?.response?.data?.error?.message || err.message, variant: 'error' });
    }
    setDeleteTarget(null);
    fetchSales();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales"
        description="Record sales and track demand to feed forecasting and analytics."
        icon={<Receipt className="h-5 w-5" />}
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={sales.length === 0}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={() => setIsModalOpen(true)} disabled={!canManage}>
            <Plus className="h-4 w-4" />
            Record Sale
          </Button>
        </div>
      </PageHeader>

      {usingDemo && (
        <Alert variant="warning" title="Showing sample data" onClose={() => setUsingDemo(false)}>
          Sales service is unreachable — start the API server to see live records.
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={sales}
        keyField="_id"
        loading={loading}
        searchable
        searchKeys={['product.name', 'product.sku', 'invoiceRef']}
        searchPlaceholder="Search by product, SKU, or invoice…"
        pageSize={10}
        emptyIcon={<Receipt className="h-6 w-6" />}
        emptyTitle="No sales yet"
        emptyDescription="Record your first sale to start building demand history."
      />

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Sale"
        description="Log a sale against your product catalog."
        icon={<Receipt className="h-5 w-5" />}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="sale-form" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save Sale'}
            </Button>
          </>
        }
      >
        <form id="sale-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="sale-product">Product</Label>
            <Select {...register('product', { required: 'Select a product' })} className="w-full">
              <option value="">Select product…</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>
              ))}
            </Select>
            {errors.product && <p className="text-xs text-destructive">{errors.product.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="sale-qty">Quantity</Label>
              <Input id="sale-qty" type="number" min="1" step="1" {...register('quantity', { required: 'Quantity is required', min: 1 })} placeholder="e.g. 10" />
              {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sale-price">Unit Price (₹)</Label>
              <Input id="sale-price" type="number" min="0" step="0.01" {...register('unitPrice', { required: 'Unit price is required', min: 0 })} placeholder="e.g. 12.50" />
              {errors.unitPrice && <p className="text-xs text-destructive">{errors.unitPrice.message}</p>}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="sale-date">Sale Date</Label>
              <Input id="sale-date" type="date" {...register('saleDate')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sale-invoice">Invoice Ref</Label>
              <Input id="sale-invoice" type="text" {...register('invoiceRef')} placeholder="e.g. INV-1043" />
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete sale"
        description="This will permanently remove the sale record."
        icon={<Trash2 className="h-5 w-5" />}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete the sale of{' '}
          <span className="font-medium text-foreground">{deleteTarget?.product?.name}</span>{' '}
          ({deleteTarget?.quantity} units)?
        </p>
      </Modal>
    </div>
  );
}