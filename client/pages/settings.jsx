import { Settings } from 'lucide-react';
import { PagePlaceholder } from '../components/ui/page-placeholder';

export default function SettingsPage() {
  return (
    <PagePlaceholder
      title="Settings"
      description="Configure workspace, notification, and account preferences."
      icon={<Settings className="h-6 w-6" />}
    />
  );
}
