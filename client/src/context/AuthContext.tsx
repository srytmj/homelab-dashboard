import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AuthContextType {
  token: string | null;
  username: string | null;
  isAuthenticated: boolean;
  isRegistered: boolean | null;
  isLoading: boolean;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message: string }>;
  register: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('cockpit_token'));
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem('cockpit_user'));
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkAuthStatus = useCallback(async () => {
    try {
      const savedToken = localStorage.getItem('cockpit_token');
      const headers: Record<string, string> = {};
      if (savedToken) {
        headers['Authorization'] = `Bearer ${savedToken}`;
      }

      const res = await fetch('/api/auth/status', { headers });
      if (res.ok) {
        const data = await res.json();
        setIsRegistered(data.registered);
        if (!data.authenticated) {
          // Token expired or invalid
          setToken(null);
          localStorage.removeItem('cockpit_token');
        } else {
          setToken(savedToken);
        }
      }
    } catch (err) {
      console.warn('[Auth] Check auth status failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = async (user: string, pass: string, rememberMe = true) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass, rememberMe }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.token) {
        setToken(data.token);
        setUsername(data.username || user);
        localStorage.setItem('cockpit_token', data.token);
        localStorage.setItem('cockpit_user', data.username || user);
        setIsRegistered(true);
        return { success: true, message: 'Login successful' };
      }
      return { success: false, message: data.message || 'Login failed' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error' };
    }
  };

  const register = async (user: string, pass: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.token) {
        setToken(data.token);
        setUsername(data.username || user);
        localStorage.setItem('cockpit_token', data.token);
        localStorage.setItem('cockpit_user', data.username || user);
        setIsRegistered(true);
        return { success: true, message: 'Owner registered successfully' };
      }
      return { success: false, message: data.message || 'Registration failed' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error' };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
      // ignore
    } finally {
      setToken(null);
      setUsername(null);
      localStorage.removeItem('cockpit_token');
      localStorage.removeItem('cockpit_user');
      await checkAuthStatus();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        username,
        isAuthenticated: Boolean(token),
        isRegistered,
        isLoading,
        login,
        register,
        logout,
        checkAuthStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
