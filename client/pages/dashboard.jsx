import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  DollarSign,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import aiService from '../services/ai.service';
import dashboardService from '../services/dashboard.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { StatCard } from '../components/ui/stat-card';
import { Alert } from '../components/ui/alert';
import { ExecutiveAIBrief } from '../components/executive-ai-brief';
import { AIBusinessRecommendations } from '../components/ai-business-recommendations';
import { AlertsWidget } from '../components/alerts-widget';
import { formatCurrency } from '../utils/format';

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '0.625rem',
  color: 'var(--foreground)',
  fontSize: '12px',
  boxShadow: '0 10px 28px -12px rgb(0 0 0 / 0.4)',
};

const AXIS_TICK = {
  fill: 'var(--muted-foreground)',
  fontSize: 11,
  fontFamily: 'var(--font-mono)',
};

const demandForecastData = [
  { month: 'Jul', actual: 312, forecast: 312 },
  { month: 'Aug', actual: 348, forecast: 348 },
  { month: 'Sep', actual: 320, forecast: 320 },
  { month: 'Oct', actual: 371, forecast: 371 },
  { month: 'Nov', actual: 395, forecast: 395 },
  { month: 'Dec', actual: null, forecast: 428 },
  { month: 'Jan', actual: null, forecast: 452 },
  { month: 'Feb', actual: null, forecast: 410 },
];

const valueTrendData = [
  { month: 'Jan', value: 34000 },
  { month: 'Feb', value: 38000 },
  { month: 'Mar', value: 36500 },
  { month: 'Apr', value: 41000 },
  { month: 'May', value: 45200 },
  { month: 'Jun', value: 43800 },
];

const expiryTimelineData = [
  { week: 'Wk 1', units: 18 },
  { week: 'Wk 2', units: 26 },
  { week: 'Wk 3', units: 21 },
  { week: 'Wk 4', units: 34 },
  { week: 'Wk 5', units: 29 },
  { week: 'Wk 6', units: 12 },
  { week: 'Wk 7', units: 9 },
  { week: 'Wk 8', units: 5 },
];

const categoryData = [
  { name: 'Medicine', value: 45 },
  { name: 'Food & Bev', value: 30 },
  { name: 'Cosmetics', value: 15 },
  { name: 'Supplies', value: 10 },
];
const CATEGORY_COLORS = ['var(--success)', 'var(--accent)', 'var(--warning)', '#8b5cf6'];

const FALLBACK_STATS = [
  { label: 'Inventory value', value: formatCurrency(43800), icon: DollarSign, tone: 'primary' },
  { label: 'Revenue saved', value: formatCurrency(12450), icon: TrendingUp, tone: 'success' },
  { label: 'Predicted loss', value: formatCurrency(3200), icon: TrendingDown, tone: 'warning' },
  { label: 'Products at risk', value: '8', icon: ShieldAlert, tone: 'destructive' },
];

function ChartCard({ title, description, children, className }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="w-full">{children}</CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const location = useLocation();
  const [healthMetrics, setHealthMetrics] = useState(null);
  const [ocrRefreshBanner, setOcrRefreshBanner] = useState(false);
  const [chartData, setChartData] = useState({
    demandForecast: demandForecastData,
    valueTrend: valueTrendData,
    expiryTimeline: expiryTimelineData,
    categoryData: categoryData,
  });

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(location.search);
    const fromOcr = params.get('refresh') === 'ocr';
    if (fromOcr) setOcrRefreshBanner(true);

    aiService
      .getHealthMetrics()
      .then((res) => active && setHealthMetrics(res.data || null))
      .catch(() => active && setHealthMetrics(null));

    dashboardService
      .getAnalytics()
      .then((res) => {
        if (!active || !res.data) return;
        setChartData((prev) => ({
          ...prev,
          ...(res.data.demandForecast ? { demandForecast: res.data.demandForecast } : {}),
          ...(res.data.valueTrend ? { valueTrend: res.data.valueTrend } : {}),
          ...(res.data.expiryTimeline ? { expiryTimeline: res.data.expiryTimeline } : {}),
          ...(res.data.categoryDistribution?.length ? { categoryData: res.data.categoryDistribution } : {}),
        }));
      })
      .catch(() => {
        /* keep hardcoded fallback */
      });

    const bannerTimer = setTimeout(() => setOcrRefreshBanner(false), 6000);
    return () => {
      active = false;
      clearTimeout(bannerTimer);
    };
  }, [location.search]);

  const kpis = useMemo(() => {
    if (!healthMetrics) return FALLBACK_STATS;
    return [
      { label: 'Inventory value', value: formatCurrency(healthMetrics.inventoryValue), icon: DollarSign, tone: 'primary' },
      { label: 'Revenue saved', value: formatCurrency(healthMetrics.revenueSaved), icon: TrendingUp, tone: 'success' },
      { label: 'Predicted loss', value: formatCurrency(healthMetrics.predictedLoss), icon: TrendingDown, tone: 'warning' },
      { label: 'Products at risk', value: String(healthMetrics.productsAtRisk ?? '—'), icon: ShieldAlert, tone: 'destructive' },
    ];
  }, [healthMetrics]);

  return (
    <div className="space-y-6">
      {ocrRefreshBanner && (
        <Alert variant="success" title="Dashboard refreshed with your latest inventory" onClose={() => setOcrRefreshBanner(false)}>
          AI analysis is running in the background.
        </Alert>
      )}

      <ExecutiveAIBrief />

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Demand forecast + category distribution */}
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard
          title="Demand forecast"
          description="AI-predicted demand for the next 8 weeks"
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={chartData.demandForecast} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--success)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
              <XAxis dataKey="month" tick={AXIS_TICK} tickLine={false} axisLine={false} />
              <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={36} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Area
                type="monotone"
                dataKey="actual"
                stroke="var(--success)"
                strokeWidth={2}
                fill="url(#gradActual)"
                connectNulls
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Area
                type="monotone"
                dataKey="forecast"
                stroke="var(--accent)"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="url(#gradForecast)"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Category distribution" description="Active products by category">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={chartData.categoryData}
                innerRadius={60}
                outerRadius={82}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {chartData.categoryData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1.5">
            {chartData.categoryData.map((cat, index) => (
              <div key={cat.name} className="flex items-center gap-2 text-sm">
                <span
                  className="h-2 w-2 rounded-sm"
                  style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
                />
                <span className="text-muted-foreground">{cat.name}</span>
                <span className="ml-auto font-mono text-xs text-muted-foreground">{cat.value}%</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Inventory value trend + recent activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard
          title="Inventory value trend"
          description="Total valuation of stock over the last 6 months"
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData.valueTrend} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
              <XAxis dataKey="month" tick={AXIS_TICK} tickLine={false} axisLine={false} />
              <YAxis
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={false}
                width={44}
                tickFormatter={(val) => `$${val / 1000}k`}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value) => [formatCurrency(value), 'Value']}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--primary)"
                strokeWidth={2}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <AlertsWidget />
      </div>

      {/* Expiry timeline */}
      <ChartCard title="Expiry timeline" description="Units expiring over the next 8 weeks">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData.expiryTimeline} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
            <XAxis dataKey="week" tick={AXIS_TICK} tickLine={false} axisLine={false} />
            <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={30} allowDecimals={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'var(--muted)', opacity: 0.4 }} />
            <Bar dataKey="units" fill="var(--warning)" radius={[3, 3, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <AIBusinessRecommendations />
    </div>
  );
}
