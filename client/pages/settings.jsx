import { Bell, Building2, Save } from 'lucide-react';
import { useAuth } from '../contexts/auth-context';
import { PageHeader } from '../components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { NotificationPreferences } from '../components/notification-preferences';
import { useToast } from '../components/ui/toast';

const ROLE_LABEL = {
  admin: 'Admin',
  manager: 'Manager',
  inventory_staff: 'Inventory Staff',
  viewer: 'Viewer',
};

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure workspace, notification, and account preferences."
        icon={<Building2 className="h-5 w-5" />}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription>Your profile and sign-in details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-lg font-semibold text-white">
              {(user?.name || '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-foreground">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">Role</p>
              <p className="mt-1 text-sm font-medium capitalize text-foreground">
                {ROLE_LABEL[user?.role] || user?.role || '—'}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">Status</p>
              <div className="mt-1">
                <Badge variant="success">Active</Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toast({ title: 'Contact support', description: 'admin@shelfwise.app', variant: 'info' })}
            >
              <Save className="mr-2 h-4 w-4" />
              Manage via Users page (admin only)
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Bell className="h-4 w-4" />
        Notifications
      </div>
      <NotificationPreferences />
    </div>
  );
}