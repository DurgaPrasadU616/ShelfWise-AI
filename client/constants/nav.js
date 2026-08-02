import {
  Bell,
  Boxes,
  FileText,
  LayoutDashboard,
  Package,
  Receipt,
  ScanText,
  Settings,
  ShoppingCart,
  Sparkles,
  Truck,
  Users,
} from 'lucide-react';

export const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Products', path: '/products', icon: Package },
      { label: 'Inventory', path: '/inventory', icon: Boxes },
      { label: 'Suppliers', path: '/suppliers', icon: Truck, hidden: true },
      { label: 'Sales', path: '/sales', icon: Receipt, hidden: true },
      { label: 'Purchase Orders', path: '/purchase-orders', icon: ShoppingCart, hidden: true },
      { label: 'OCR Uploads', path: '/ocr', icon: ScanText },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { label: 'Recommendations', path: '/recommendations', icon: Sparkles },
      { label: 'Reports', path: '/reports', icon: FileText },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { label: 'Notifications', path: '/notifications', icon: Bell },
      { label: 'Settings', path: '/settings', icon: Settings, hidden: true },
      { label: 'Users', path: '/users', icon: Users, adminOnly: true, hidden: true },
    ],
  },
];
