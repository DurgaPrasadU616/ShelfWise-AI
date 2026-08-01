import { Truck } from 'lucide-react';
import { PagePlaceholder } from '../components/ui/page-placeholder';

export default function Suppliers() {
  return (
    <PagePlaceholder
      title="Suppliers"
      description="Manage supplier contacts, details, and purchasing relationships."
      icon={<Truck className="h-6 w-6" />}
    />
  );
}
