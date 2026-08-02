import { cn } from '../../utils/cn';

export function Select({ className, children, ...props }) {
  return (
    <select
      className={cn(
        'h-10 cursor-pointer rounded-lg border border-input bg-card px-3 pr-8 text-sm text-foreground shadow-inset transition-colors',
        'hover:border-border',
        'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
