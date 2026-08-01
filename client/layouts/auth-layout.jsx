import { Link, Outlet } from 'react-router-dom';
import { Moon, PackageSearch, Sun } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useTheme } from '../contexts/theme-context';

export default function AuthLayout() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4"
        onClick={toggleTheme}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>

      <Link to="/" className="mb-8 flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <PackageSearch className="h-6 w-6" />
        </span>
        <div className="leading-tight">
          <p className="text-lg font-semibold tracking-tight">ShelfWise AI</p>
          <p className="text-xs text-muted-foreground">Inventory Intelligence</p>
        </div>
      </Link>

      <Outlet />
    </div>
  );
}
