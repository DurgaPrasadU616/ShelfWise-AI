import { Link, Outlet } from 'react-router-dom';
import { Moon, PackageSearch, Sun } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useTheme } from '../contexts/theme-context';

export default function AuthLayout() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4">
      {/* Ambient background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-accent/10 blur-[120px]" />
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4"
        onClick={toggleTheme}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>

      <div className="relative z-10 flex w-full flex-col items-center">
        <Link to="/" className="mb-8 flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow-emerald">
            <PackageSearch className="h-6 w-6" />
          </span>
          <div className="leading-tight">
            <p className="font-display text-lg font-semibold tracking-tight">ShelfWise AI</p>
            <p className="text-xs text-muted-foreground">Inventory Intelligence</p>
          </div>
        </Link>

        <Outlet />
      </div>
    </div>
  );
}
