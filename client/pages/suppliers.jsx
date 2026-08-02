import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Download,
  FileText,
  Mail,
  MapPin,
  Phone,
  Pencil,
  Plus,
  Trash2,
  Truck,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import supplierService from '../services/supplier.service';
import { PageHeader } from '../components/ui/page-header';
import { DataTable } from '../components/ui/data-table';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Modal } from '../components/ui/modal';
import { Alert } from '../components/ui/alert';
import { useToast } from '../components/ui/toast';
import { usePermission } from '../hooks/use-permission';
import { formatDate } from '../utils/format';

const DEMO_SUPPLIERS = [
  {
    _id: 's1',
    name: 'PharmaCorp Distributors',
    contactName: 'Ravi Menon',
    email: 'orders@pharmacorp.example',
    phone: '+91 98765 43210',
    address: '12 Industrial Estate, Mumbai',
  },
  {
    _id: 's2',
    name: 'NutriPharm Labs',
    contactName: 'Anita Desai',
    email: 'supply@nutripharm.example',
    phone: '+91 91234 56789',
    address: 'Plot 45, MIDC Pune',
  },
  {
    _id: 's3',
    name: 'HealthTech Devices',
    contactName: 'Vikram Shah',
    email: 'b2b@healthtech.example',
    phone: '+91 99887 76655',
    address: 'Tower B, Sector 21, Gurugram',
  },
  {
    _id: 's4',
    name: 'DailyFresh Trading',
    contactName: 'Sana Khan',
    email: 'accounts@dailyfresh.example',
    phone: '+91 97766 55443',
    address: '22 Vegetable Market, Nashik',
  },
];

const EMPTY_FORM = {
  name: '',
  contactName: '',
  email: '',
  phone: '',
  address: '',
};

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingDemo, setUsingDemo] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const canManage = usePermission(['admin', 'manager']);
  const canDelete = usePermission(['admin']);
  const { toast } = useToast();

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await supplierService.getAll({ limit: 500 });
      setSuppliers(res.data?.items || res.data || []);
      setUsingDemo(false);
    } catch {
      setSuppliers(DEMO_SUPPLIERS);
      setUsingDemo(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: EMPTY_FORM,
  });

  const openCreate = () => {
    setEditing(null);
    reset(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (supplier) => {
    setEditing(supplier);
    Object.entries(EMPTY_FORM).forEach(([key]) => setValue(key, supplier[key] || ''));
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editing) {
        await supplierService.update(editing._id, data);
        toast({ title: 'Supplier updated', description: `${data.name} has been updated.`, variant: 'success' });
      } else {
        await supplierService.create(data);
        toast({ title: 'Supplier added', description: `${data.name} has been added.`, variant: 'success' });
      }
      setModalOpen(false);
      reset(EMPTY_FORM);
      fetchSuppliers();
    } catch (err) {
      toast({
        title: editing ? 'Failed to update supplier' : 'Failed to add supplier',
        description: err?.response?.data?.error?.message || err?.response?.data?.error || err.message,
        variant: 'error',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await supplierService.delete(deleting._id);
      toast({ title: 'Supplier deleted', description: `${deleting.name} has been removed.`, variant: 'success' });
      setDeleting(null);
      setConfirmDelete(false);
      fetchSuppliers();
    } catch (err) {
      toast({
        title: 'Failed to delete supplier',
        description: err?.response?.data?.error?.message || err?.response?.data?.error || err.message,
        variant: 'error',
      });
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'name',
        header: 'Supplier',
        sortable: true,
        render: (row) => (
          <div className="min-w-0 leading-tight">
            <p className="truncate font-medium">{row.name}</p>
            {row.contactName && <p className="text-[11px] text-muted-foreground">{row.contactName}</p>}
          </div>
        ),
      },
      {
        key: 'email',
        header: 'Contact',
        sortable: true,
        className: 'hidden sm:table-cell',
        headerClassName: 'hidden sm:table-cell',
        render: (row) => (
          <div className="min-w-0">
            {row.email && (
              <p className="flex items-center gap-1.5 truncate text-muted-foreground">
                <Mail className="h-3 w-3 shrink-0" />
                {row.email}
              </p>
            )}
            {row.phone && (
              <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                <Phone className="h-3 w-3 shrink-0" />
                {row.phone}
              </p>
            )}
            {!row.email && !row.phone && <span className="text-muted-foreground">—</span>}
          </div>
        ),
      },
      {
        key: 'address',
        header: 'Address',
        sortable: true,
        className: 'hidden md:table-cell',
        headerClassName: 'hidden md:table-cell',
        render: (row) => (
          <span className="flex items-center gap-1.5 truncate text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            {row.address || '—'}
          </span>
        ),
      },
      {
        key: 'createdAt',
        header: 'Added',
        sortable: true,
        className: 'hidden lg:table-cell',
        headerClassName: 'hidden lg:table-cell',
        render: (row) => (
          <span className="text-muted-foreground">{row.createdAt ? formatDate(row.createdAt) : '—'}</span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        className: 'w-20',
        headerClassName: 'text-right',
        render: (row) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => openEdit(row)}
              disabled={!canManage}
              aria-label={`Edit ${row.name}`}
              className="text-muted-foreground hover:text-primary"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setDeleting(row);
                setConfirmDelete(false);
              }}
              disabled={!canDelete}
              aria-label={`Delete ${row.name}`}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [canManage, canDelete],
  );

  const handleExport = () => {
    if (suppliers.length === 0) return;
    const header = ['Supplier', 'Contact', 'Email', 'Phone', 'Address'];
    const body = suppliers.map((s) =>
      [s.name, s.contactName || '', s.email || '', s.phone || '', s.address || '']
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    );

    const blob = new Blob([[header.join(','), ...body].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `suppliers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Export ready', description: `${suppliers.length} suppliers exported.`, variant: 'info' });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        description="Manage supplier contacts, details, and purchasing relationships."
        icon={<Truck className="h-5 w-5" />}
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={suppliers.length === 0}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={openCreate} disabled={!canManage}>
            <Plus className="h-4 w-4" />
            Add Supplier
          </Button>
        </div>
      </PageHeader>

      {usingDemo && (
        <Alert variant="warning" title="Showing sample data" onClose={() => setUsingDemo(false)}>
          Supplier service is unreachable — start the API server to see live records.
        </Alert>
      )}

      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={suppliers}
        keyField="_id"
        loading={loading}
        searchable
        searchKeys={['name', 'contactName', 'email', 'phone']}
        searchPlaceholder="Search suppliers…"
        pageSize={10}
        emptyIcon={<Truck className="h-6 w-6" />}
        emptyTitle="No suppliers yet"
        emptyDescription="Add your suppliers to keep purchasing relationships organized."
        toolbar={
          <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex">
            <FileText className="h-3.5 w-3.5" />
            <span className="font-mono">{suppliers.length}</span> suppliers
          </span>
        }
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Supplier' : 'Add New Supplier'}
        description={editing ? `Update ${editing.name}'s details.` : 'Create a supplier record.'}
        icon={<Truck className="h-5 w-5" />}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="supplier-form" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : editing ? 'Save Changes' : 'Add Supplier'}
            </Button>
          </>
        }
      >
        <form id="supplier-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="supplier-name">Supplier Name</Label>
            <Input
              id="supplier-name"
              type="text"
              {...register('name', { required: 'Supplier name is required' })}
              placeholder="e.g. PharmaCorp Distributors"
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="supplier-contact">Contact Name</Label>
              <Input id="supplier-contact" type="text" {...register('contactName')} placeholder="Primary contact" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="supplier-phone">Phone</Label>
              <Input id="supplier-phone" type="tel" {...register('phone')} placeholder="+91 …" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="supplier-email">Email</Label>
            <Input
              id="supplier-email"
              type="email"
              {...register('email', {
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Please use a valid email address' },
              })}
              placeholder="orders@supplier.com"
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="supplier-address">Address</Label>
            <Input id="supplier-address" type="text" {...register('address')} placeholder="Street, city" />
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => {
          setDeleting(null);
          setConfirmDelete(false);
        }}
        title="Delete supplier"
        description={confirmDelete ? 'This will permanently remove the supplier record.' : `${deleting?.name || 'This supplier'} will be permanently removed.`}
        size="sm"
        icon={<Trash2 className="h-5 w-5" />}
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setDeleting(null);
                setConfirmDelete(false);
              }}
            >
              Cancel
            </Button>
            {confirmDelete ? (
              <Button variant="destructive" onClick={handleDelete}>
                Confirm delete
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={() => setConfirmDelete(true)}
              >
                Delete supplier
              </Button>
            )}
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Deleting {deleting?.name} will not affect existing inventory records, but you won't be able to undo this action.
        </p>
      </Modal>
    </div>
  );
}
