import { memo } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Card } from './card';

const TONES = {
  primary: 'bg-primary/10 text-primary',
  accent: 'bg-accent/10 text-accent',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
};

export const StatCard = memo(function StatCard({ label, value, sublabel, delta, icon: Icon, tone = 'primary', className }) {
  const TrendIcon = delta?.trend === 'up' ? ArrowUpRight : delta?.trend === 'down' ? ArrowDownRight : Minus;
  const deltaColor =
    delta?.positive === true
      ? 'text-success'
      : delta?.positive === false
        ? 'text-destructive'
        : 'text-muted-foreground';

  return (
    <Card className={cn('group', className)}>
      <div className="p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[13px] font-medium text-muted-foreground">{label}</p>
          {Icon && (
            <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', TONES[tone])}>
              <Icon className="h-4 w-4" />
            </span>
          )}
        </div>

        <p className="mt-3 font-mono text-[22px] leading-none font-semibold tracking-tight text-foreground tabular-nums">
          {value}
        </p>

        {(delta || sublabel) && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            {delta && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-semibold tabular-nums ring-1 ring-inset',
                  deltaColor,
                  delta.positive === true && 'bg-success/10 ring-success/25',
                  delta.positive === false && 'bg-destructive/10 ring-destructive/25',
                  delta.positive == null && 'bg-muted ring-border/60',
                )}
              >
                <TrendIcon className="h-3 w-3" />
                {delta.value}
              </span>
            )}
            {sublabel && <span className="truncate">{sublabel}</span>}
          </div>
        )}
      </div>
    </Card>
  );
});
