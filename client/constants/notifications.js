import { AlertTriangle, Info, Zap } from 'lucide-react';

export const NOTIFICATION_TYPES = {
  info: {
    label: 'Info',
    icon: Info,
    color: 'text-sky-500',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
    dot: 'bg-sky-500',
    badge: 'info',
  },
  warning: {
    label: 'Warning',
    icon: AlertTriangle,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    dot: 'bg-amber-500',
    badge: 'warning',
  },
  danger: {
    label: 'Alert',
    icon: Zap,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    dot: 'bg-red-500',
    badge: 'destructive',
  },
};

export function notificationTypeConfig(type) {
  return NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.info;
}
