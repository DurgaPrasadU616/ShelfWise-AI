import { cn } from '../../utils/cn';
import { Spinner } from './spinner';

const VARIANTS = {
  primary: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
  accent: 'bg-accent text-accent-foreground shadow-sm hover:bg-accent/90',
  secondary: 'bg-muted text-foreground hover:bg-border',
  outline: 'border border-border bg-card/60 text-foreground shadow-sm hover:bg-muted/60',
  ghost: 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
  destructive: 'bg-destructive text-white shadow-sm hover:bg-destructive/90',
};

const SIZES = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-sm',
  icon: 'h-10 w-10',
  'icon-sm': 'h-8 w-8',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className,
  children,
  ...props
}) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-all duration-150',
        'active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        loading && 'cursor-wait opacity-70',
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner size={15} className="text-current" />}
      {children}
    </button>
  );
}
