import { PackageSearch } from 'lucide-react';

export function PageLoader() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background"
      role="status"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 animate-pulse rounded-2xl bg-primary/10" aria-hidden="true" />
          <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-glow-emerald">
            <PackageSearch className="h-6 w-6" />
          </span>
        </div>
        <div className="space-y-1 text-center">
          <p className="font-display text-sm font-semibold tracking-tight text-foreground">ShelfWise AI</p>
          <p className="text-xs text-muted-foreground">Loading workspace…</p>
        </div>
      </div>
    </div>
  );
}
