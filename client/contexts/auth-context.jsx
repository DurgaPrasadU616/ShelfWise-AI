import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import authService from '../services/auth.service';
import { PageLoader } from '../components/ui/page-loader';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (token) {
          const res = await authService.me();
          if (res.success) {
            setUser(res.data.user);
          }
        }
      } catch (error) {
        console.error('Failed to restore session', error);
        localStorage.removeItem('access_token');
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for unauthorized events to clear user
    const handleUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authService.login(email, password);
    if (res.success) {
      setUser(res.data.user);
    }
    return res;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await authService.register(name, email, password);
    // After register, you might auto-login or expect them to login.
    // The backend register doesn't return tokens directly in the current implementation.
    // So we just return the response.
    return res;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const can = useCallback(
    (roles) => {
      if (!user) return false;
      // The backend returns a single string `role`
      const userRoles = Array.isArray(user.roles) ? user.roles : [user.role];
      return roles.some((role) => userRoles.includes(role));
    },
    [user]
  );

  if (loading) {
    return <PageLoader />;
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
