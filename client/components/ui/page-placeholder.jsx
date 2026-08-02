import { Construction } from 'lucide-react';
import { Card, CardContent } from './card';
import { PageHeader } from './page-header';
import { Badge } from './badge';

export function PagePlaceholder({ title, description, icon }) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} icon={icon}>
        <Badge variant="outline" className="gap-1.5">
          <Construction className="h-3 w-3" />
          Module in development
        </Badge>
      </PageHeader>
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-5 py-20 text-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-muted blur-xl" aria-hidden="true" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground">
              {icon || <Construction className="h-7 w-7" />}
            </div>
          </div>
          <div>
            <p className="font-display text-base font-semibold text-foreground">Module coming soon</p>
            <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
              The {title} module will be built here in a future iteration.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
