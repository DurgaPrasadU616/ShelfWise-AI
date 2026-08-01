import { ShoppingCart } from 'lucide-react';
import { PagePlaceholder } from '../components/ui/page-placeholder';

export default function PurchaseOrders() {
  return (
    <PagePlaceholder
      title="Purchase Orders"
      description="Create and manage purchase orders from inventory needs and invoices."
      icon={<ShoppingCart className="h-6 w-6" />}
    />
  );
}
