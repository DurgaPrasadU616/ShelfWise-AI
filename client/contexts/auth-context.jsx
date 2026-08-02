import { createContext, useCallback, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // DEMO MODE: Automatically log in as Admin
  const [user, setUser] = useState({ 
    id: 'demo-user', 
    name: 'Demo Admin', 
    email: 'admin@shelfwise.ai', 
    role: 'admin',
    roles: ['admin'] 
  });
  
  const login = useCallback(async () => {
    return { success: true, data: { user } };
  }, [user]);

  const register = useCallback(async () => {
    return { success: true, data: { user } };
  }, [user]);

  const logout = useCallback(async () => {
    // Keep user logged in for demo
  }, []);

  const can = useCallback(() => true, []); // Can do anything in demo mode

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
