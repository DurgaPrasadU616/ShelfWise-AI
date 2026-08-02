import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Download,
  FileText,
  Inbox,
  Package,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
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
import { cn } from '../utils/cn';

// Demo data for fallback
const DEMO_PRODUCTS = [
  { _id: 'p1', name: 'Paracetamol 500mg', sku: 'PAR-500', category: 'Medicine', brand: 'PharmaCorp', unit: 'box', isActive: true },
  { _id: 'p2', name: 'Vitamin C Gummies', sku: 'VIT-C', category: 'Medicine', brand: 'NutriPharm', unit: 'bottle', isActive: true },
  { _id: 'p3', name: 'Digital Thermometer', sku: 'THM-D', category: 'Supplies', brand: 'HealthTech', unit: 'piece', isActive: true },
  { _id: 'p4', name: 'Disposable Gloves (M)', sku: 'GLV-M', category: 'Supplies', brand: 'SafetyFirst', unit: 'box', isActive: true },
  { _id: 'p5', name: 'Green Tea (Box)', sku: 'TEA-25', category: 'Food & Bev', brand: 'DailyFresh', unit: 'box', isActive: false },
  { _id: 'p6', name: 'Face Moisturizer', sku: 'MOI-50', category: 'Cosmetics', brand: 'BeautyHub', unit: 'tube', isActive: true },
];

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingDemo, setUsingDemo] = useState(false);
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all'); // 'all', 'active', 'inactive'
  const [selectedKeys, setSelectedKeys] = useState(() => new Set());
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const canManage = usePermission(['admin', 'manager']);
  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await productService.getAll({ limit: 500 });
      setProducts(res.data?.items || res.data || []);
      setUsingDemo(false);
    } catch {
      setProducts(DEMO_PRODUCTS);
      setUsingDemo(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))].sort(),
    [products]
  );

  const filtered = useMemo(() => {
    let list = products;
    if (category !== 'all') list = list.filter((p) => p.category === category);
    if (status !== 'all') {
      const wantActive = status === 'active';
      list = list.filter((p) => p.isActive === wantActive);
    }
    return list;
  }, [products, category, status]);

  const columns = useMemo(() => [
    {
      key: 'name',
      header: 'Product Name',
      sortable: true,
      render: (row) => (
        <div className="min-w-0 leading-tight">
          <p className="truncate font-medium">{row.name}</p>
          <p className="font-mono text-[11px] text-muted-foreground">{row.sku}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      className: 'hidden sm:table-cell',
      headerClassName: 'hidden sm:table-cell',
      render: (row) => <span className="text-muted-foreground">{row.category}</span>,
    },
    {
      key: 'brand',
      header: 'Brand',
      sortable: true,
      className: 'hidden md:table-cell',
      headerClassName: 'hidden md:table-cell',
      render: (row) => <span className="text-muted-foreground">{row.brand || '—'}</span>,
    },
    {
      key: 'unit',
      header: 'Unit',
      sortable: true,
      className: 'hidden lg:table-cell',
      headerClassName: 'hidden lg:table-cell',
      render: (row) => <span className="text-muted-foreground">{row.unit}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      sortValue: (r) => r.isActive ? 1 : 0,
      render: (row) => (
        <Badge variant={row.isActive ? 'success' : 'secondary'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ], []);

  const handleExport = () => {
    if (filtered.length === 0) return;
    const header = ['Name', 'SKU', 'Category', 'Brand', 'Unit', 'Status'];
    const body = filtered.map((p) => [
      p.name, p.sku, p.category, p.brand || '', p.unit, p.isActive ? 'Active' : 'Inactive'
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    
    const blob = new Blob([[header.join(','), ...body].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Export ready', description: `${filtered.length} products exported.`, variant: 'info' });
  };

  // Form state via react-hook-form
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      name: '',
      sku: '',
      category: 'Food & Bev',
      brand: '',
      unit: '',
    },
  });

  const onSubmit = async (data) => {
    try {
      await productService.create(data);
      toast({ title: 'Product created', description: `${data.name} has been added to catalog.`, variant: 'success' });
      setIsModalOpen(false);
      reset();
      fetchProducts(); // Refresh list
    } catch (err) {
      toast({ title: 'Failed to create product', description: err?.response?.data?.error?.message || err.message, variant: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage your product catalog, SKUs, and categories."
        icon={<Package className="h-5 w-5" />}
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={filtered.length === 0}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={() => setIsModalOpen(true)} disabled={!canManage}>
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </PageHeader>

      {usingDemo && (
        <Alert
          variant="warning"
          title="Showing sample data"
          onClose={() => setUsingDemo(false)}
        >
          Product service is unreachable — start the API server to see live records.
        </Alert>
      )}

      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={filtered}
        keyField="_id"
        loading={loading}
        searchable
        searchKeys={['name', 'sku', 'brand']}
        searchPlaceholder="Search by name, SKU, or brand…"
        selectable
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        pageSize={10}
        emptyIcon={<Package className="h-6 w-6" />}
        emptyTitle={usingDemo ? 'No product records' : 'Catalog is empty'}
        emptyDescription="Add products manually or import them via OCR invoices."
        toolbar={
          <>
            <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-40">
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-36">
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
            <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex">
              <FileText className="h-3.5 w-3.5" />
              <span className="font-mono">{filtered.length}</span> products
            </span>
          </>
        }
      />
      
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Product"
        description="Create a product in your catalog."
        icon={<Package className="h-5 w-5" />}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="product-form" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save Product'}
            </Button>
          </>
        }
      >
        <form id="product-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="product-name">Product Name</Label>
            <Input
              id="product-name"
              type="text"
              {...register('name', { required: 'Product name is required' })}
              placeholder="e.g. Premium Roast Coffee"
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="product-sku">SKU</Label>
              <Input
                id="product-sku"
                type="text"
                {...register('sku', { required: 'SKU is required' })}
                placeholder="COF-PRM-250"
              />
              {errors.sku && <p className="text-xs text-destructive">{errors.sku.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product-category">Category</Label>
              <Select {...register('category', { required: 'Category is required' })} className="w-full">
                <option value="Food & Bev">Food & Bev</option>
                <option value="Medicine">Medicine</option>
                <option value="Cosmetics">Cosmetics</option>
                <option value="Supplies">Supplies</option>
              </Select>
              {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="product-brand">Brand</Label>
              <Input id="product-brand" type="text" {...register('brand')} placeholder="Brand name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product-unit">Unit</Label>
              <Input
                id="product-unit"
                type="text"
                {...register('unit', { required: 'Unit is required' })}
                placeholder="e.g. box, piece, bottle"
              />
              {errors.unit && <p className="text-xs text-destructive">{errors.unit.message}</p>}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
