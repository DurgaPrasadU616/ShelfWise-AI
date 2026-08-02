import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';

const ToastContext = createContext(null);

const ICONS = {
  success: { icon: CheckCircle2, className: 'text-success' },
  error: { icon: AlertCircle, className: 'text-destructive' },
  info: { icon: Info, className: 'text-accent' },
  default: { icon: Info, className: 'text-primary' },
};

let counter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    ({ title, description, variant = 'default', duration = 4000 }) => {
      const id = ++counter;
      setToasts((prev) => [...prev, { id, title, description, variant }]);
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed top-4 right-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2"
      >
        <AnimatePresence>
          {toasts.map((t) => {
            const config = ICONS[t.variant] || ICONS.default;
            const Icon = config.icon;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.16 }}
                role={t.variant === 'error' ? 'alert' : 'status'}
                className="pointer-events-auto flex items-start gap-3 rounded-xl border border-border/80 bg-card/95 p-4 shadow-popover backdrop-blur-xl"
              >
                <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', config.className)} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{t.title}</p>
                  {t.description && <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>}
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                  className="rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}
