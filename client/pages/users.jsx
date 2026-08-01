import { Users } from 'lucide-react';
import { PagePlaceholder } from '../components/ui/page-placeholder';

export default function UsersPage() {
  return (
    <PagePlaceholder
      title="Users"
      description="Manage user accounts, roles, and access permissions."
      icon={<Users className="h-6 w-6" />}
    />
  );
}
