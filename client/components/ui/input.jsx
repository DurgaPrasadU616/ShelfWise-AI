import { cn } from '../../utils/cn';

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground shadow-inset transition-colors',
        'placeholder:text-muted-foreground/70',
        'hover:border-border',
        'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}
