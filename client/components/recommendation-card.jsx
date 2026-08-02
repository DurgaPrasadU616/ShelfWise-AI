import { motion, useReducedMotion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  Check,
  ShieldAlert,
  Sparkles,
  SlidersHorizontal,
  X,
  Zap,
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { formatCurrency } from '../utils/format';
import { cn } from '../utils/cn';

const RULE_BASED_OUTCOME = 'Based on standard inventory rules';

const PRIORITY_CONFIG = {
  critical: { label: 'Critical', icon: ShieldAlert, classes: 'bg-destructive/12 text-destructive ring-destructive/25' },
  high: { label: 'High', icon: AlertTriangle, classes: 'bg-warning/12 text-warning ring-warning/25' },
  medium: { label: 'Medium', icon: Activity, classes: 'bg-accent/12 text-accent ring-accent/25' },
  low: { label: 'Low', icon: Zap, classes: 'bg-success/12 text-success ring-success/25' },
};

const TYPE_LABELS = {
  discount: 'Discount strategy',
  restock: 'Restock required',
  dispose: 'Disposal action',
  donate: 'Donation opportunity',
  reprice: 'Price optimization',
};

function getPriorityConfig(priority) {
  const key = String(priority || '').toLowerCase();
  return PRIORITY_CONFIG[key] || PRIORITY_CONFIG.low;
}

function extractDaysLeft(reason) {
  if (!reason) return null;
  const match = String(reason).match(/expiring in (\d+)\s*days?/i);
  if (!match) return null;
  const days = parseInt(match[1], 10);
  return Number.isFinite(days) ? days : null;
}

function countdownTone(days) {
  if (days < 7) return 'bg-destructive/12 text-destructive ring-destructive/25';
  if (days < 14) return 'bg-warning/12 text-warning ring-warning/25';
  return 'bg-accent/12 text-accent ring-accent/25';
}

function PriorityBadge({ priority }) {
  const config = getPriorityConfig(priority);
  const Icon = config.icon;
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
        config.classes,
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

function SourceBadge({ source }) {
  const isAI = source === 'ai';
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset',
        isAI ? 'bg-primary/12 text-primary ring-primary/25' : 'bg-muted text-muted-foreground ring-border/60',
      )}
    >
      {isAI ? <Sparkles className="h-3 w-3" /> : <SlidersHorizontal className="h-3 w-3" />}
      {isAI ? 'AI-generated' : 'Rule-based'}
    </span>
  );
}

function ConfidenceRing({ score }) {
  const value = score == null ? null : Math.min(100, Math.max(0, Math.round(Number(score))));
  const R = 15.9155; // normalized circumference
  const stroke = value != null ? value : 0;
  return (
    <div
      role="img"
      aria-label={value != null ? `Confidence ${value}%` : 'Confidence unavailable'}
      className="relative h-8 w-8 shrink-0"
    >
      <svg viewBox="0 0 36 36" className="h-8 w-8 -rotate-90">
        <circle cx="18" cy="18" r={R} fill="none" stroke="var(--muted)" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r={R}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${stroke} ${100 - stroke}`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-[9px] font-semibold text-foreground tabular-nums">
        {value != null ? value : '—'}
      </span>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate font-mono text-[12px] font-semibold text-foreground tabular-nums">{value}</p>
    </div>
  );
}

export function RecommendationCard({ rec, index = 0, onApply, onDismiss, onViewDetails, className }) {
  const reduceMotion = useReducedMotion();
  const daysLeft = extractDaysLeft(rec?.reason);
  const priorityConfig = getPriorityConfig(rec?.priority);
  const isAI = rec?.source === 'ai';
  const showOutcome = rec?.expectedOutcome && rec.expectedOutcome !== RULE_BASED_OUTCOME;
  const typeLabel = TYPE_LABELS[rec?.type] || 'AI recommendation';

  return (
    <motion.div
      layout
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2, ease: 'easeOut', delay: Math.min(index * 0.06, 0.3) }}
      className="h-full"
    >
      <Card
        hover
        className={cn(
          'group flex h-full flex-col overflow-hidden',
          'transition-[box-shadow,transform] duration-200 ease-out',
          'hover:-translate-y-0.5 hover:shadow-popover',
          className,
        )}
      >
        {/* Header: product + priority */}
        <div className="flex items-start justify-between gap-3 p-4 pb-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{rec?.product?.name || 'General action'}</p>
            <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
              {rec?.product?.sku ? `${rec.product.sku} · ` : ''}
              {typeLabel}
            </p>
          </div>
          <PriorityBadge priority={rec?.priority} />
        </div>

        {/* Expiry countdown */}
        {daysLeft != null && (
          <div className="px-4 pb-2.5">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset',
                countdownTone(daysLeft),
              )}
            >
              <CalendarDays className="h-3 w-3" />
              {daysLeft} days left
            </span>
          </div>
        )}

        {/* AI assessment */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              <Sparkles className="h-3 w-3 text-primary" />
              AI assessment
            </span>
            <SourceBadge source={rec?.source} />
          </div>
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{rec?.reason}</p>
          {showOutcome && (
            <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-foreground/80">{rec.expectedOutcome}</p>
          )}
        </div>

        {/* Business impact */}
        <div className="mx-4 mb-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
          <div className="grid grid-cols-[1fr_1fr_auto] items-center gap-3">
            <Metric
              label="Revenue saved"
              value={formatCurrency(rec?.estimatedRevenueSaved, { compact: true })}
            />
            <Metric
              label="Loss prevented"
              value={formatCurrency(rec?.estimatedLossPrevented, { compact: true })}
            />
            <div className="flex items-center gap-1.5">
              <ConfidenceRing score={rec?.confidenceScore} />
            </div>
          </div>
        </div>

        {/* Suggested action */}
        <div className="flex items-start gap-2 px-4 pb-3.5">
          <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
          <p className="text-[13px] leading-snug font-medium text-foreground">{rec?.suggestedAction}</p>
        </div>

        {/* Actions */}
        <div className="mt-auto flex items-center gap-2 border-t border-border/60 px-4 py-3">
          <Button size="sm" className="flex-1" onClick={onApply}>
            <Check className="h-3.5 w-3.5" />
            Apply
          </Button>
          <Button size="sm" variant="outline" onClick={onViewDetails}>
            Details
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={onDismiss}
            aria-label="Dismiss recommendation"
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

export function RecommendationCardSkeleton() {
  return (
    <div className="h-full">
      <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-card">
        <div className="p-4 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
          <Skeleton className="mt-2 h-3 w-full" />
          <Skeleton className="mt-1.5 h-3 w-4/5" />
        </div>
        <div className="mx-4 mb-3 h-12 rounded-lg" />
        <Skeleton className="mx-4 mb-3.5 h-4 w-3/4" />
        <div className="mt-auto flex items-center gap-2 border-t border-border/60 px-4 py-3">
          <Skeleton className="h-8 flex-1 rounded-lg" />
          <Skeleton className="h-8 w-16 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
