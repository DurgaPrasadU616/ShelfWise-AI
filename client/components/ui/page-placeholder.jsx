import { Construction } from 'lucide-react';
import { Card, CardContent } from './card';

export function PagePlaceholder({ title, description, icon }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {icon && <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>}
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Construction className="h-7 w-7" />
          </div>
          <div>
            <p className="font-medium">Module coming soon</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              The {title} module will be built here in a future iteration.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
