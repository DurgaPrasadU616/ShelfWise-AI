import { Suspense } from 'react';
import { MotionConfig } from 'framer-motion';
import { AuthProvider } from './contexts/auth-context';
import { ThemeProvider } from './contexts/theme-context';
import { NotificationProvider } from './contexts/notification-context';
import { ToastProvider } from './components/ui/toast';
import { PageLoader } from './components/ui/page-loader';
import AppRouter from './router';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <ToastProvider>
            <MotionConfig reducedMotion="user">
              <Suspense fallback={<PageLoader />}>
                <AppRouter />
              </Suspense>
            </MotionConfig>
          </ToastProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
