import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bell, BellOff, Clock } from 'lucide-react';
import { notificationTypeConfig } from '../constants/notifications';
import { useNotifications } from '../contexts/notification-context';
import { formatRelativeTime } from '../utils/format';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { cn } from '../utils/cn';

export function AlertsWidget() {
  const { recentNotifications, unreadCount, loading } = useNotifications();
  const navigate = useNavigate();

  const alerts = recentNotifications.slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            Recent activity
          </CardTitle>
          <CardDescription>
            {unreadCount > 0 ? (
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {unreadCount} unread
              </span>
            ) : (
              'No pending alerts'
            )}
          </CardDescription>
        </div>
        <button
          onClick={() => navigate('/notifications')}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted/40 text-muted-foreground/40">
              <BellOff className="h-5 w-5" />
            </span>
            <p className="text-sm text-muted-foreground">All clear — no activity to show</p>
          </div>
        ) : (
          <div className="space-y-1">
            {alerts.map((n) => {
              const config = notificationTypeConfig(n.type);
              const Icon = config.icon;
              return (
                <button
                  key={n._id}
                  onClick={() => navigate('/notifications')}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted/40',
                    !n.read && 'bg-primary/4',
                  )}
                >
                  <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', config.bg, config.color)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn('block truncate text-sm', !n.read ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                      {n.title}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground/60">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(n.createdAt)}
                    </span>
                  </span>
                  {!n.read && <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
