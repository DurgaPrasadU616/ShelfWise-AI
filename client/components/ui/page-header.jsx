import { cn } from '../../utils/cn';

export function PageHeader({ title, description, icon, eyebrow, className, children }) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
            {eyebrow}
          </p>
        )}
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/40 text-muted-foreground shadow-sm">
              {icon}
            </div>
          )}
          <h1 className="font-display text-[26px] leading-tight font-semibold tracking-tight text-foreground">
            {title}
          </h1>
        </div>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
