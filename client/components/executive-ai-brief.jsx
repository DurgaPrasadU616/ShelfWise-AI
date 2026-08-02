import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  FileText,
  Package,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { HealthGauge } from './ui/health-gauge';
import aiService from '../services/ai.service';
import { formatCurrency } from '../utils/format';
import { cn } from '../utils/cn';

const PRIORITY_CONFIG = {
  critical: { icon: ShieldAlert, color: 'text-destructive', bg: 'bg-destructive/10' },
  high: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
  medium: { icon: Zap, color: 'text-accent', bg: 'bg-accent/10' },
  low: { icon: Sparkles, color: 'text-success', bg: 'bg-success/10' },
};

function getPriorityConfig(priority) {
  const key = String(priority || '').toLowerCase();
  return PRIORITY_CONFIG[key] || PRIORITY_CONFIG.low;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function todayLabel() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function generateSummary(health) {
  if (!health) return 'Data unavailable to generate a summary.';
  const parts = [];
  if (health.productsAtRisk > 0) {
    parts.push(`${health.productsAtRisk} products are at risk of expiry`);
  }
  if (health.predictedLoss > 0) {
    parts.push(`with ${formatCurrency(health.predictedLoss, { compact: true })} in predicted loss`);
  }
  if (health.lowStockCount > 0) {
    parts.push(`${health.lowStockCount} items are running low`);
  }
  if (parts.length === 0) return 'Inventory is stable — no immediate action required.';
  return `Your attention is needed: ${parts.join(', ')}.`;
}

export function ExecutiveAIBrief() {
  const navigate = useNavigate();
  const [data, setData] = useState({ health: null, recommendations: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [healthRes, recRes] = await Promise.all([
        aiService.getHealthMetrics(),
        aiService.getRecommendations(),
      ]);
      setData({ health: healthRes.data, recommendations: recRes.data || [] });
    } catch {
      // keep prior state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await aiService.triggerAiAnalysis();
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-[380px] rounded-xl lg:col-span-2" />
        <Skeleton className="h-[380px] rounded-xl" />
      </div>
    );
  }

  const { health, recommendations } = data;
  const priorities = recommendations.slice(0, 3);
  const score = health?.healthScore ?? 0;

  return (
    <motion.div
      className="grid gap-6 lg:grid-cols-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Executive brief */}
      <Card className="flex flex-col p-6 lg:col-span-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              {getGreeting()}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{todayLabel()}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            <Sparkles className="h-3 w-3 text-accent" />
            AI brief
          </span>
        </div>

        <div className="mt-6 rounded-lg border-l-2 border-primary/60 bg-muted/30 py-3.5 pr-4 pl-4">
          <p className="text-[15px] leading-relaxed text-foreground/90">{generateSummary(health)}</p>
        </div>

        <div className="mt-6 flex-1">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
              Today's priorities
            </h3>
            {priorities.length > 0 && (
              <button
                onClick={() => navigate('/recommendations')}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
              >
                View all
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>

          {priorities.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center">
              <p className="text-sm text-muted-foreground">No critical actions required.</p>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {priorities.map((rec) => {
                const config = getPriorityConfig(rec.priority);
                const Icon = config.icon;
                return (
                  <li key={rec._id}>
                    <button
                      onClick={() => navigate('/recommendations')}
                      className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted/40"
                    >
                      <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', config.bg, config.color)}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">{rec.suggestedAction}</span>
                        <span className="block truncate text-xs text-muted-foreground">{rec.product?.name || 'General action'}</span>
                      </span>
                      <span className={cn('rounded-full border border-border px-2 py-0.5 text-[11px] font-medium capitalize', config.color)}>
                        {rec.priority}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-border/80 pt-4">
          <Button variant="accent" size="sm" onClick={() => navigate('/recommendations')}>
            View recommendations
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/inventory')}>
            <Package className="h-4 w-4" />
            Review inventory
          </Button>
          <Button variant="ghost" size="sm" onClick={handleRefresh} loading={refreshing}>
            {!refreshing && <RefreshCw className="h-4 w-4" />}
            Refresh analysis
          </Button>
        </div>
      </Card>

      {/* Business health */}
      <Card className="flex flex-col items-center p-6">
        <HealthGauge score={score} />

        <div className="mt-6 w-full space-y-1 border-t border-border/80 pt-4">
          <HealthFigure
            icon={TrendingUp}
            label="Revenue saved"
            value={formatCurrency(health?.revenueSaved, { compact: true })}
            color="text-success"
          />
          <HealthFigure
            icon={TrendingDown}
            label="Predicted loss"
            value={formatCurrency(health?.predictedLoss, { compact: true })}
            color="text-warning"
          />
          <HealthFigure
            icon={ShieldAlert}
            label="Products at risk"
            value={health?.productsAtRisk ?? '—'}
            color="text-destructive"
          />
          <HealthFigure
            icon={Package}
            label="Inventory value"
            value={formatCurrency(health?.inventoryValue, { compact: true })}
            color="text-foreground"
          />
        </div>

        <Button variant="outline" size="sm" className="mt-6 w-full" onClick={() => navigate('/reports')}>
          <FileText className="h-4 w-4" />
          Generate report
        </Button>
      </Card>
    </motion.div>
  );
}

function HealthFigure({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-2 py-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/40 text-muted-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-muted-foreground">{label}</span>
      </span>
      <span className={cn('font-mono text-sm font-semibold tabular-nums', color)}>{value}</span>
    </div>
  );
}
