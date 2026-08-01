import { Suspense } from 'react';
import { AuthProvider } from './contexts/auth-context';
import { ThemeProvider } from './contexts/theme-context';
import { PageLoader } from './components/ui/page-loader';
import AppRouter from './router';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <AppRouter />
        </Suspense>
      </AuthProvider>
    </ThemeProvider>
  );
}
