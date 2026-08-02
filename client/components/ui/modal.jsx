import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from './button';

export function Modal({ open, onClose, title, description, icon, footer, size = 'md', className, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={cn(
              'relative w-full overflow-hidden rounded-2xl border border-border/80 bg-card shadow-popover',
              size === 'sm' && 'max-w-md',
              size === 'md' && 'max-w-lg',
              size === 'lg' && 'max-w-2xl',
              className,
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border/70 p-5">
              <div className="flex items-start gap-3">
                {icon && (
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {icon}
                  </div>
                )}
                <div>
                  <h3 className="font-display text-lg font-semibold tracking-tight text-foreground">{title}</h3>
                  {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
                </div>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close dialog">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
            {footer && (
              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/70 bg-muted/20 px-5 py-4">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
