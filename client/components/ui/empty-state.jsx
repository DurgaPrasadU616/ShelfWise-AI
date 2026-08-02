import { cn } from '../../utils/cn';

export function EmptyState({ icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-5 py-14 text-center', className)}>
      {icon && (
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-primary/10 blur-xl" aria-hidden="true" />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground/60 shadow-sm">
            {icon}
          </div>
        </div>
      )}
      <div>
        <p className="font-display text-base font-semibold tracking-tight text-foreground">{title}</p>
        {description && (
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
