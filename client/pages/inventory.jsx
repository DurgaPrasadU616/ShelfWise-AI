import { Boxes } from 'lucide-react';
import { PagePlaceholder } from '../components/ui/page-placeholder';

export default function Inventory() {
  return (
    <PagePlaceholder
      title="Inventory"
      description="Track stock lines, batches, quantities, and expiry dates."
      icon={<Boxes className="h-6 w-6" />}
    />
  );
}
