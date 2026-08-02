import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/auth-context';

export function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

export function RequireRole({ roles, children }) {
  const { user, can } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!can(roles)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
