import { cn } from '../../utils/cn';

export function Label({ className, ...props }) {
  return <label className={cn('text-sm font-medium leading-none text-foreground', className)} {...props} />;
}
