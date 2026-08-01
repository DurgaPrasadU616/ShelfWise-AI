import { Sparkles } from 'lucide-react';
import { PagePlaceholder } from '../components/ui/page-placeholder';

export default function Recommendations() {
  return (
    <PagePlaceholder
      title="Recommendations"
      description="Review AI-driven discount, restock, dispose, and donate suggestions."
      icon={<Sparkles className="h-6 w-6" />}
    />
  );
}
