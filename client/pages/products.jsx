import { Package } from 'lucide-react';
import { PagePlaceholder } from '../components/ui/page-placeholder';

export default function Products() {
  return (
    <PagePlaceholder
      title="Products"
      description="Manage your product catalog, SKUs, pricing, and stock units."
      icon={<Package className="h-6 w-6" />}
    />
  );
}
