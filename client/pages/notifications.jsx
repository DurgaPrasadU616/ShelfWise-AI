import { useState, useEffect, useCallback } from 'react';
import {
  Bell, BellOff, Check, CheckCheck, Trash2,
  MailCheck, Send, Smartphone,
  Clock, X, Plus
} from 'lucide-react';
import notificationService from '../services/notification.service';
import { useNotifications } from '../contexts/notification-context';
import { notificationTypeConfig } from '../constants/notifications';
import { formatRelativeTime } from '../utils/format';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { PageHeader } from '../components/ui/page-header';
import { Alert } from '../components/ui/alert';
import { Skeleton } from '../components/ui/skeleton';
import { EmptyState } from '../components/ui/empty-state';
import { useToast } from '../components/ui/toast';

function NotificationItem({ notification, onRead, onDelete }) {
  const config = notificationTypeConfig(notification.type);
  const Icon = config.icon;
  const isUnread = !notification.read;

  return (
    <div
      className={`group flex gap-4 p-4 rounded-xl border transition-all duration-200 ${
        isUnread
          ? `${config.bg} ${config.border} shadow-sm`
          : 'bg-card/50 border-border/40 hover:bg-muted/30 hover:border-border/60'
      }`}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 mt-0.5 ${config.color}`}>
        <div className={`relative p-2 rounded-lg ${isUnread ? 'bg-white/80 dark:bg-black/20' : 'bg-muted/50'}`}>
          <Icon className="h-4 w-4" />
          {isUnread && (
            <span className={`absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full ${config.dot} ring-2 ring-background`} />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className={`text-sm leading-snug ${isUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'}`}>
                {notification.title}
              </p>
              <Badge variant={config.badge} className="text-[10px] px-1.5 py-0">
                {config.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed line-clamp-2">
              {notification.message}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 mt-2.5">
          <span className="flex items-center gap-1 text-xs text-muted-foreground/70">
            <Clock className="h-3 w-3" />
            {formatRelativeTime(notification.createdAt)}
          </span>

          {/* Channel indicators */}
          <div className="flex items-center gap-1.5">
            {notification.channels?.dashboard && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground/60" title="Dashboard">
                <Bell className="h-3 w-3" />
              </span>
            )}
            {notification.channels?.email?.sent && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400" title="Email sent">
                <MailCheck className="h-3 w-3" />
                <span className="hidden sm:inline">Email</span>
              </span>
            )}
            {notification.channels?.whatsapp?.sent && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400" title="WhatsApp sent">
                <Smartphone className="h-3 w-3" />
                <span className="hidden sm:inline">WhatsApp</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-start gap-1 opacity-100 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 sm:opacity-0">
        {isUnread && (
          <button
            onClick={() => onRead(notification._id)}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            title="Mark as read"
          >
            <Check className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => onDelete(notification._id)}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function groupByDate(items) {
  const groups = {};
  items.forEach(item => {
    const date = new Date(item.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let key;
    if (date.toDateString() === today.toDateString()) {
      key = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = 'Yesterday';
    } else {
      key = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }

    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });
  return groups;
}

export default function Notifications() {
  const {
    recentNotifications,
    unreadCount,
    loading,
    refresh,
    fetchRecent,
    markRead,
    markAllRead,
    deleteNotification,
  } = useNotifications();

  const [notifications, setNotifications] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);

  // Test notification form
  const [showTestForm, setShowTestForm] = useState(false);
  const [testTitle, setTestTitle] = useState('Low Stock Alert');
  const [testMessage, setTestMessage] = useState('Aspirin 500mg is running low — only 5 units remaining.');
  const [testType, setTestType] = useState('warning');
  const [testEmail, setTestEmail] = useState(false);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const fetchNotifications = useCallback(async () => {
    try {
      setPageLoading(true);
      const res = await notificationService.getAll({ unread: filter === 'unread' ? true : undefined, limit: 50 });
      setNotifications(res.data?.items || []);
      setError(null);
    } catch (err) {
      setError('Failed to load notifications');
    } finally {
      setPageLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleRead = async (id) => {
    await markRead(id);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
  };

  const handleDelete = async (id) => {
    await deleteNotification(id);
    setNotifications(prev => prev.filter(n => n._id !== id));
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleSendTest = async () => {
    try {
      setSending(true);
      await notificationService.sendTest({ title: testTitle, message: testMessage, type: testType, sendEmail: testEmail });
      await fetchNotifications();
      await refresh();
      setShowTestForm(false);
      toast({ title: 'Test notification sent', description: `“${testTitle}” delivered to configured channels.`, variant: 'success' });
    } catch (err) {
      setError('Failed to send test notification');
    } finally {
      setSending(false);
    }
  };

  const grouped = groupByDate(notifications);
  const hasNotifications = notifications.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Notifications"
        description={
          unreadCount > 0
            ? `${unreadCount} unread alert${unreadCount !== 1 ? 's' : ''} requiring attention`
            : 'All caught up — no pending alerts'
        }
        icon={<Bell className="h-5 w-5" />}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowTestForm((v) => !v)}
        >
          {showTestForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showTestForm ? 'Cancel' : 'Test Alert'}
        </Button>
        {unreadCount > 0 && (
          <Button size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="h-4 w-4" />
            Mark All Read
          </Button>
        )}
      </PageHeader>

      {/* Error */}
      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Test Alert Composer */}
      {showTestForm && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" />
              Send Test Notification
            </CardTitle>
            <CardDescription>Fire a real notification to test the pipeline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="test-title">Title</Label>
                <Input
                  id="test-title"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="test-type">Type</Label>
                <select
                  id="test-type"
                  className="h-10 w-full cursor-pointer rounded-lg border border-input bg-card px-3 pr-8 text-sm text-foreground shadow-inset transition-colors hover:border-border focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:outline-none"
                  value={testType}
                  onChange={(e) => setTestType(e.target.value)}
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="danger">Danger</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="test-message">Message</Label>
              <textarea
                id="test-message"
                className="w-full resize-none rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground shadow-inset transition-colors placeholder:text-muted-foreground/70 hover:border-border focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:outline-none"
                rows={2}
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                <input
                  type="checkbox"
                  checked={testEmail}
                  onChange={(e) => setTestEmail(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                <MailCheck className="h-4 w-4" />
                Send email copy
              </label>
              <Button size="sm" onClick={handleSendTest} disabled={sending} loading={sending}>
                {!sending && <Send className="h-4 w-4" />}
                {sending ? 'Sending…' : 'Send Now'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Tabs + Stats */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-fit">
          {[
            { id: 'all', label: 'All', count: notifications.length },
            { id: 'unread', label: 'Unread', count: unreadCount },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                filter === f.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {f.label}
              {f.count > 0 && (
                <span className={`ml-1.5 text-xs ${filter === f.id ? 'text-primary' : 'text-muted-foreground/60'}`}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Notification List */}
      {pageLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : !hasNotifications ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="p-6">
            <EmptyState
              icon={<BellOff className="h-6 w-6" />}
              title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              description={
                filter === 'unread'
                  ? "You're all caught up! All notifications have been read."
                  : 'Notifications from AI analysis, expiry alerts, and system events will appear here.'
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{dateLabel}</span>
                <div className="flex-1 h-px bg-border/50" />
                <span className="text-xs text-muted-foreground/50">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map(n => (
                  <NotificationItem
                    key={n._id}
                    notification={n}
                    onRead={handleRead}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
