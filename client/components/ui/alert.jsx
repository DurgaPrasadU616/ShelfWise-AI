import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';

const VARIANTS = {
  info: { icon: Info, classes: 'border-accent/20 bg-accent/5 text-accent' },
  success: { icon: CheckCircle2, classes: 'border-success/20 bg-success/8 text-success' },
  warning: { icon: AlertTriangle, classes: 'border-warning/20 bg-warning/8 text-warning' },
  error: { icon: AlertCircle, classes: 'border-destructive/20 bg-destructive/8 text-destructive' },
};

export function Alert({ variant = 'info', title, children, onClose, className }) {
  const config = VARIANTS[variant] || VARIANTS.info;
  const Icon = config.icon;
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn('flex items-start gap-3 rounded-lg border px-4 py-3 text-sm', config.classes, className)}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={cn('leading-relaxed', title && 'mt-0.5')}>{children}</div>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 rounded-md p-1 opacity-60 transition-opacity hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
