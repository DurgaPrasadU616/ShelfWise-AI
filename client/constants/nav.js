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

export const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Products', path: '/products', icon: Package },
  { label: 'Inventory', path: '/inventory', icon: Boxes },
  { label: 'Suppliers', path: '/suppliers', icon: Truck },
  { label: 'Sales', path: '/sales', icon: Receipt },
  { label: 'Purchase Orders', path: '/purchase-orders', icon: ShoppingCart },
  { label: 'OCR Uploads', path: '/ocr', icon: ScanText },
  { label: 'Recommendations', path: '/recommendations', icon: Sparkles },
  { label: 'Reports', path: '/reports', icon: FileText },
  { label: 'Notifications', path: '/notifications', icon: Bell },
  { label: 'Settings', path: '/settings', icon: Settings },
  { label: 'Users', path: '/users', icon: Users, adminOnly: true },
];
