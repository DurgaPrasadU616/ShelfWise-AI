import { NavLink } from 'react-router-dom';
import { PackageSearch, X } from 'lucide-react';
import { NAV_SECTIONS } from '../../constants/nav';
import { useAuth } from '../../contexts/auth-context';
import { cn } from '../../utils/cn';
import { Button } from '../ui/button';

function NavItem({ item, onNavigate }) {
  return (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isActive
            ? 'bg-primary/8 text-primary'
            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            aria-hidden="true"
            className={cn(
              'absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary transition-all',
              isActive ? 'opacity-100' : 'opacity-0',
            )}
          />
          <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
          {item.label}
        </>
      )}
    </NavLink>
  );
}

export function Sidebar({ open, onClose }) {
  const { user } = useAuth();

  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.hidden && (!item.adminOnly || user?.roles?.includes('admin'))),
  })).filter((section) => section.items.length > 0);

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-border/80 bg-card/85 backdrop-blur-xl',
          'transition-transform duration-200 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <PackageSearch className="h-4.5 w-4.5" strokeWidth={1.75} />
            </span>
            <div className="leading-tight">
              <p className="font-display text-[15px] font-semibold tracking-tight text-foreground">
                ShelfWise
                <span className="text-muted-foreground"> AI</span>
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={onClose} aria-label="Close menu">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {sections.map((section) => (
            <div key={section.label} className="mb-6">
              <p className="mb-1.5 px-3 text-[11px] font-medium tracking-widest text-muted-foreground/60 uppercase">
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.path}>
                    <NavItem item={item} onNavigate={onClose} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="space-y-3 border-t border-border/80 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground uppercase">
              {user?.name?.charAt(0) || 'G'}
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-medium text-foreground">{user?.name || 'Guest'}</p>
              <p className="truncate text-xs text-muted-foreground capitalize">
                {user?.roles?.[0]?.replace('_', ' ') || 'viewer'}
              </p>
            </div>
          </div>
          <p className="px-2 font-mono text-[11px] text-muted-foreground/50">v0.1.0</p>
        </div>
      </aside>
    </>
  );
}
