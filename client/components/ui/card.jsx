import { cn } from '../../utils/cn';

export function Card({ className, hover = false, ...props }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border/70 bg-card shadow-card transition-colors',
        hover && 'hover:border-border hover:bg-card',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('flex flex-col gap-1 p-5', className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return (
    <h3 className={cn('font-display text-[15px] font-semibold tracking-tight', className)} {...props} />
  );
}

export function CardDescription({ className, ...props }) {
  return <p className={cn('text-[13px] leading-relaxed text-muted-foreground', className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-5 pt-0', className)} {...props} />;
}

export function CardFooter({ className, ...props }) {
  return <div className={cn('flex items-center p-5 pt-0', className)} {...props} />;
}
