import { useEffect, useMemo, useState } from 'react';
import { UserRoundCog, ShieldCheck, ShieldAlert, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useAuth } from '../contexts/auth-context';
import userService from '../services/user.service';
import { PageHeader } from '../components/ui/page-header';
import { DataTable } from '../components/ui/data-table';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select } from '../components/ui/select';
import { Modal } from '../components/ui/modal';
import { Alert } from '../components/ui/alert';
import { EmptyState } from '../components/ui/empty-state';
import { useToast } from '../components/ui/toast';
import { cn } from '../utils/cn';

const ROLES = ['admin', 'manager', 'inventory_staff', 'viewer'];

const ROLE_META = {
  admin: { label: 'Admin', cls: 'bg-red-500/10 text-red-400 ring-red-500/20' },
  manager: { label: 'Manager', cls: 'bg-amber-500/10 text-amber-400 ring-amber-500/20' },
  inventory_staff: { label: 'Inventory Staff', cls: 'bg-sky-500/10 text-sky-400 ring-sky-500/20' },
  viewer: { label: 'Viewer', cls: 'bg-muted text-muted-foreground ring-border' },
};

const ROLE_ICON = {
  admin: <ShieldCheck className="h-4 w-4" />,
  manager: <ShieldAlert className="h-4 w-4" />,
  inventory_staff: <ShieldCheck className="h-4 w-4" />,
  viewer: <ShieldCheck className="h-4 w-4" />,
};

const STATUS_META = {
  active: { label: 'Active', cls: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/20' },
  inactive: { label: 'Inactive', cls: 'bg-rose-500/15 text-rose-400 ring-rose-500/20' },
};

const FALLBACK_USERS = [
  { id: 'u1', name: 'Durgaprasad S', email: 'admin@shelfwise.app', role: 'admin', roles: ['admin'], isActive: true, createdAt: new Date().toISOString() },
  { id: 'u2', name: 'Maya Iyer', email: 'maya@shelfwise.app', role: 'manager', roles: ['manager'], isActive: true, createdAt: new Date().toISOString() },
  { id: 'u3', name: 'Ravi Kumar', email: 'ravi@shelfwise.app', role: 'inventory_staff', roles: ['inventory_staff'], isActive: true, createdAt: new Date().toISOString() },
  { id: 'u4', name: 'Priya Nair', email: 'priya@shelfwise.app', role: 'viewer', roles: ['viewer'], isActive: false, createdAt: new Date().toISOString() },
];

function RoleBadge({ role }) {
  const meta = ROLE_META[role] || { label: role, cls: 'bg-muted text-muted-foreground ring-border' };
  return (
    <Badge variant="outline" className={cn('gap-1.5', meta.cls)}>
      {ROLE_ICON[role]}
      {meta.label}
    </Badge>
  );
}

function StatusBadge({ active }) {
  const meta = active ? STATUS_META.active : STATUS_META.inactive;
  return (
    <Badge variant="outline" className={cn('gap-1.5', meta.cls)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-emerald-400' : 'bg-rose-400')} />
      {meta.label}
    </Badge>
  );
}

export default function UsersPage() {
  const { user: me, can } = useAuth();
  const { toast } = useToast();
  const { isAdmin } = { isAdmin: can(['admin']) };

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const [modal, setModal] = useState(null); // { mode: 'create'|'edit', user }
  const [deleting, setDeleting] = useState(null); // user
  const [saving, setSaving] = useState(false);

  const canManage = isAdmin;

  const load = async () => {
    setLoading(true);
    try {
      const res = await userService.getAll({ limit: 200 });
      setUsers(res.data.items);
      setUsingDemo(false);
    } catch (e) {
      setUsers(FALLBACK_USERS);
      setUsingDemo(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const columns = useMemo(
    () => [
      {
        header: 'User',
        key: 'name',
        sortable: true,
        render: (u) => (
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{u.name}</span>
            <span className="text-xs text-muted-foreground">{u.email}</span>
          </div>
        ),
      },
      {
        header: 'Role',
        key: 'role',
        sortable: true,
        render: (u) => <RoleBadge role={u.role} />,
      },
      {
        header: 'Status',
        key: 'isActive',
        sortable: true,
        render: (u) => <StatusBadge active={u.isActive} />,
      },
      {
        header: 'Joined',
        key: 'createdAt',
        sortable: true,
        render: (u) => <span className="text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</span>,
      },
      {
        header: '',
        key: 'actions',
        align: 'right',
        render: (u) =>
          isAdmin ? (
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Edit ${u.name}`}
                disabled={u.id === me?.id}
                onClick={() => setModal({ mode: 'edit', user: u })}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${u.name}`}
                className="text-rose-400 hover:text-rose-300"
                disabled={u.id === me?.id}
                onClick={() => setDeleting(u)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : null,
      },
    ],
    [me?.id]
  );

  const confirmSave = async (payload) => {
    setSaving(true);
    try {
      if (modal.mode === 'create') {
        await userService.create(payload);
        toast.success('User created');
      } else {
        await userService.update(modal.user.id, payload);
        toast.success('User updated');
      }
      setModal(null);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.error?.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async (u) => {
    setSaving(true);
    try {
      await userService.remove(u.id);
      toast.success('User deactivated');
      setDeleting(null);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.error?.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage user accounts, roles, and access permissions."
        icon={<UserPlusCog className="h-5 w-5" />}
        actions={
          canManage && (
            <Button onClick={() => setModal({ mode: 'create', user: null })}>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          )
        }
      />

      {usingDemo && (
        <Alert variant="warning" title="Demo data">
          Couldn't reach the server. Showing sample users — changes aren't saved.
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={users}
        keyField="id"
        loading={loading}
        searchable
        searchKeys={['name', 'email', 'role']}
        searchPlaceholder="Search users by name, email, or role…"
        emptyTitle="No users yet"
        emptyDescription="Add your first user to control who can access the workspace."
        emptyIcon={<UserPlusCog className="h-6 w-6" />}
        emptyAction={
          canManage && (
            <Button variant="outline" size="sm" onClick={() => setModal({ mode: 'create', user: null })}>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          )
        }
      />

<Modal
        open={Boolean(modal)}
        onClose={() => setModal(null)}
        title={modal?.mode === 'edit' ? 'Edit User' : 'Add User'}
        icon={<UserPlusCog className="h-5 w-5" />}
      >
        {modal && (
          <UserForm
            user={modal.user}
            saving={saving}
            onCancel={() => setModal(null)}
            onSubmit={confirmSubmit}
          />
        )}
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Deactivate user"
        description={`Remove access for ${deleting?.name} (${deleting?.email}). They can be re-enabled later.`}
        icon={<Trash2 className="h-5 w-5" />}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="destructive" loading={saving} onClick={() => confirmDelete(deleting)}>
              Deactivate
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          This won't delete their audit trail, but the account can no longer sign in.
        </p>
      </Modal>
    </div>
  );
}

function UserForm({ user, saving, onCancel, onSubmit }) {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(user?.role || 'inventory_staff');
  const [isActive, setIsActive] = useState(user ? user.isActive : true);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email';
    if (!user && password.length < 8) e.password = 'Password must be at least 8 characters';
    return e;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    const payload = { name, email, role };
    if (!user) payload.password = password;
    onSubmit(payload);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <UserPlusCog className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {user ? 'Edit User' : 'Add User'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {user ? `Manage access for ${user.name}` : 'Invite a new member to the workspace.'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <Field label="Full name" error={errors.name}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Surya Murugan" />
        </Field>
        <Field label="Email" error={errors.email}>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" />
        </Field>
        {!user && (
          <Field label="Password" error={errors.password}>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" />
          </Field>
        )}
        <Field label="Role">
          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_META[r].label}
              </option>
            ))}
          </Select>
        </Field>
        {user && (
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <div>
              <p className="text-sm font-medium text-foreground">Account active</p>
              <p className="text-xs text-muted-foreground">{isActive ? 'Member can sign in.' : 'Sign-in disabled.'}</p>
            </div>
          </label>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {user ? 'Save changes' : 'Create user'}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
}