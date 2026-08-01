import { Receipt } from 'lucide-react';
import { PagePlaceholder } from '../components/ui/page-placeholder';

export default function Sales() {
  return (
    <PagePlaceholder
      title="Sales"
      description="Record sales and track demand to feed forecasting and analytics."
      icon={<Receipt className="h-6 w-6" />}
    />
  );
}
