import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, LogOut, Menu, Moon, Sun, Clock } from 'lucide-react';
import { NAV_SECTIONS } from '../../constants/nav';
import { notificationTypeConfig } from '../../constants/notifications';
import { useAuth } from '../../contexts/auth-context';
import { useTheme } from '../../contexts/theme-context';
import { useNotifications } from '../../contexts/notification-context';
import { formatRelativeTime } from '../../utils/format';
import { cn } from '../../utils/cn';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

export function Navbar({ onMenuClick }) {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const { unreadCount, recentNotifications, markRead, markAllRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentPage = NAV_SECTIONS.flatMap((s) => s.items).find((i) => i.path === location.pathname);

  useEffect(() => {
    document.title = currentPage ? `${currentPage.label} · ShelfWise AI` : 'ShelfWise AI';
  }, [currentPage]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    };
    const handleKey = (e) => e.key === 'Escape' && setOpen(false);
    if (open) {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleKey);
    }
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const handleNotificationClick = async (n) => {
    if (!n.read) await markRead(n._id);
    setOpen(false);
    navigate('/notifications');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-border/80 bg-background/80 px-4 backdrop-blur-xl md:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </Button>

      <h1 className="min-w-0 truncate font-display text-base font-semibold tracking-tight text-foreground">
        {currentPage?.label || 'ShelfWise AI'}
      </h1>

      <div className="flex-1" />

      <Link
        to="/recommendations"
        className="hidden items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
        </span>
        AI active
      </Link>

      <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
        {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
      </Button>

      {/* Notification Bell with Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="relative"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>

        {open && (
          <div className="absolute top-full right-0 z-50 mt-2 max-w-[calc(100vw-2rem)] w-80 overflow-hidden rounded-xl border border-border/80 bg-card/95 shadow-popover backdrop-blur-xl sm:w-96">
            <div className="flex items-center justify-between border-b border-border/80 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">Notifications</span>
                {unreadCount > 0 && <Badge variant="destructive">{unreadCount}</Badge>}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Read all
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {recentNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Bell className="mb-2 h-7 w-7 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                recentNotifications.map((n) => {
                  const config = notificationTypeConfig(n.type);
                  const Icon = config.icon;
                  return (
                    <button
                      key={n._id}
                      onClick={() => handleNotificationClick(n)}
                      className={cn(
                        'flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors last:border-0 hover:bg-muted/40',
                        !n.read && 'bg-primary/4',
                      )}
                    >
                      <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', config.bg, config.color)}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn('block text-sm leading-snug', !n.read ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                          {n.title}
                        </span>
                        <span className="mt-0.5 line-clamp-1 block text-xs text-muted-foreground">{n.message}</span>
                        <span className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground/60">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(n.createdAt)}
                        </span>
                      </span>
                      {!n.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                    </button>
                  );
                })
              )}
            </div>

            <div className="border-t border-border/80 px-4 py-2.5">
              <button
                onClick={() => {
                  setOpen(false);
                  navigate('/notifications');
                }}
                className="w-full rounded-lg py-1.5 text-center text-sm font-medium text-primary transition-colors hover:bg-muted/40"
              >
                View all notifications
              </button>
            </div>
          </div>
        )}
      </div>

      <Button variant="outline" size="sm" onClick={handleLogout} aria-label="Sign out">
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Sign out</span>
      </Button>
    </header>
  );
}
