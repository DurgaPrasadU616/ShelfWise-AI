import { useState } from 'react';
import { Bell, Mail, Smartphone, Shield, Save, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';

const CHANNELS = [
  {
    id: 'dashboard',
    label: 'Dashboard Alerts',
    description: 'In-app notifications visible in the bell icon and notification center',
    icon: Bell,
    color: 'text-primary',
    bg: 'bg-primary/10',
    enabled: true,
    locked: true,
  },
  {
    id: 'email',
    label: 'Email Alerts',
    description: 'Receive notification emails at your registered address',
    icon: Mail,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    enabled: true,
    locked: false,
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    description: 'WhatsApp messages — coming soon',
    icon: Smartphone,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    enabled: false,
    locked: false,
    comingSoon: true,
  },
];

const ALERT_TYPES = [
  { id: 'expiry', label: 'Expiry Warnings', description: 'Products approaching expiration date' },
  { id: 'low_stock', label: 'Low Stock Alerts', description: 'Inventory below minimum threshold' },
  { id: 'ai', label: 'AI Recommendations', description: 'Smart suggestions from the AI engine' },
  { id: 'system', label: 'System Events', description: 'Report generation, OCR processing, etc.' },
];

export function NotificationPreferences() {
  const [channels, setChannels] = useState({
    dashboard: true,
    email: true,
    whatsapp: false,
  });
  const [alertTypes, setAlertTypes] = useState({
    expiry: true,
    low_stock: true,
    ai: true,
    system: false,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Channel Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            Notification Channels
          </CardTitle>
          <CardDescription>Choose how you want to receive alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {CHANNELS.map(channel => {
            const Icon = channel.icon;
            return (
              <div
                key={channel.id}
                className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                  channels[channel.id]
                    ? 'bg-card border-border'
                    : 'bg-muted/30 border-border/40 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${channel.bg}`}>
                    <Icon className={`h-4 w-4 ${channel.color}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{channel.label}</p>
                      {channel.comingSoon && (
                        <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{channel.description}</p>
                  </div>
                </div>

                {channel.locked ? (
                  <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">Always on</span>
                ) : (
                  <button
                    role="switch"
                    aria-checked={channels[channel.id]}
                    aria-label={`Toggle ${channel.label}`}
                    onClick={() => !channel.comingSoon && setChannels(prev => ({ ...prev, [channel.id]: !prev[channel.id] }))}
                    disabled={channel.comingSoon}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      channels[channel.id] ? 'bg-primary' : 'bg-muted'
                    } ${channel.comingSoon ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                        channels[channel.id] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Alert Type Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            Alert Types
          </CardTitle>
          <CardDescription>Select which alert categories you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {ALERT_TYPES.map(type => (
            <div
              key={type.id}
              className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                alertTypes[type.id]
                  ? 'bg-card border-border'
                  : 'bg-muted/30 border-border/40 opacity-60'
              }`}
            >
              <div>
                <p className="text-sm font-medium text-foreground">{type.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{type.description}</p>
              </div>
              <button
                role="switch"
                aria-checked={alertTypes[type.id]}
                aria-label={`Toggle ${type.label}`}
                onClick={() => setAlertTypes(prev => ({ ...prev, [type.id]: !prev[type.id] }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                  alertTypes[type.id] ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                    alertTypes[type.id] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2">
          {saved ? (
            <>
              <Check className="h-4 w-4" />
              Saved
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
