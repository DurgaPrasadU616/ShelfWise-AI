import { Link } from 'react-router-dom';
import { PackageSearch } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <PackageSearch className="h-7 w-7" />
      </span>
      <div>
        <p className="font-mono text-[13px] font-semibold tracking-widest text-muted-foreground uppercase">
          404 — Error
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-foreground">
          This shelf is empty
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          The page you're looking for doesn't exist or has been moved. Check the address or head back to the dashboard.
        </p>
      </div>
      <Link to="/dashboard">
        <Button>Back to Dashboard</Button>
      </Link>
    </div>
  );
}
