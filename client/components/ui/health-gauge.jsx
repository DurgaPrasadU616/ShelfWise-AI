import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export function healthStatus(score) {
  if (score >= 80) return { label: 'Healthy', color: 'var(--success)', text: 'text-success' };
  if (score >= 60) return { label: 'Needs attention', color: 'var(--warning)', text: 'text-warning' };
  return { label: 'Critical', color: 'var(--destructive)', text: 'text-destructive' };
}

export function HealthGauge({ score, size = 184, label = 'Business health', className }) {
  const value = Math.max(0, Math.min(100, Math.round(score || 0)));
  const status = healthStatus(value);

  const stroke = size / 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - value / 100);

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          fill="none"
          role="img"
          aria-label={`Business health ${value} out of 100 — ${status.label}`}
        >
          <defs>
            <linearGradient id="gauge-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--primary)" />
              <stop offset="100%" stopColor="var(--accent)" />
            </linearGradient>
          </defs>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--border)"
            strokeWidth={stroke}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
          {/* Progress */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#gauge-gradient)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-[42px] leading-none font-semibold tracking-tight text-foreground">
            {value}
          </span>
          <span className="mt-1 font-mono text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center">
        <span className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
          {label}
        </span>
        <span className={cn('mt-1 text-sm font-semibold', status.text)}>{status.label}</span>
      </div>
    </div>
  );
}
