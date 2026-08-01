import { Bell } from 'lucide-react';
import { PagePlaceholder } from '../components/ui/page-placeholder';

export default function Notifications() {
  return (
    <PagePlaceholder
      title="Notifications"
      description="View low stock, near-expiry, expired, and AI-generated alerts."
      icon={<Bell className="h-6 w-6" />}
    />
  );
}
