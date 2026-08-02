import { cn } from '../../utils/cn';

const VARIANTS = {
  default: 'bg-muted text-muted-foreground',
  secondary: 'bg-muted text-muted-foreground ring-1 ring-inset ring-border/60',
  outline: 'border border-border text-muted-foreground',
  success: 'bg-success/12 text-success ring-1 ring-inset ring-success/25',
  warning: 'bg-warning/12 text-warning ring-1 ring-inset ring-warning/25',
  destructive: 'bg-destructive/12 text-destructive ring-1 ring-inset ring-destructive/25',
  info: 'bg-accent/12 text-accent ring-1 ring-inset ring-accent/25',
  violet: 'bg-violet-500/12 text-violet-400 ring-1 ring-inset ring-violet-500/25',
};

export function Badge({ variant = 'default', className, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium leading-none whitespace-nowrap',
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
