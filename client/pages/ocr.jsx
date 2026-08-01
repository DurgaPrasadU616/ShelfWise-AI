import { ScanText } from 'lucide-react';
import { PagePlaceholder } from '../components/ui/page-placeholder';

export default function Ocr() {
  return (
    <PagePlaceholder
      title="OCR Uploads"
      description="Upload invoices for digitization and review extracted line items."
      icon={<ScanText className="h-6 w-6" />}
    />
  );
}
