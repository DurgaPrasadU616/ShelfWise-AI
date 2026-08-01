import { NavLink } from 'react-router-dom';
import { PackageSearch, X } from 'lucide-react';
import { NAV_ITEMS } from '../../constants/nav';
import { useAuth } from '../../contexts/auth-context';
import { cn } from '../../utils/cn';
import { Button } from '../ui/button';

export function Sidebar({ open, onClose }) {
  const { user } = useAuth();

  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || user?.roles?.includes('admin'));

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-border bg-card transition-transform duration-200 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <PackageSearch className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <p className="font-semibold tracking-tight">ShelfWise AI</p>
              <p className="text-xs text-muted-foreground">Inventory Intelligence</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose} aria-label="Close menu">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {visibleItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )
                  }
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground uppercase">
              {user?.name?.charAt(0) || 'G'}
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-medium">{user?.name || 'Guest'}</p>
              <p className="truncate text-xs text-muted-foreground capitalize">{user?.roles?.[0]?.replace('_', ' ') || 'viewer'}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
