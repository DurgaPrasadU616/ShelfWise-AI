import { FileText } from 'lucide-react';
import { PagePlaceholder } from '../components/ui/page-placeholder';

export default function Reports() {
  return (
    <PagePlaceholder
      title="Reports"
      description="Generate and download inventory, expiry, and performance reports."
      icon={<FileText className="h-6 w-6" />}
    />
  );
}
