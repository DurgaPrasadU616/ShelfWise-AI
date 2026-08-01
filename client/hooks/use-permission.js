import { useAuth } from '../contexts/auth-context';

export function usePermission(roles) {
  const { can } = useAuth();
  return can(roles);
}
