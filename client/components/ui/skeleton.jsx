import { cn } from '../../utils/cn';

export function Skeleton({ className, ...props }) {
  return <div className={cn('skeleton rounded-md', className)} {...props} />;
}
