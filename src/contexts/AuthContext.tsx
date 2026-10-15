/**
 * Resist - Auth Context & Provider
 * Global state provider for user authentication and session management
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserSession } from '../types/user';
import { AuthService } from '../services/auth';

interface AuthContextValue {
  user: UserProfile | null;
  session: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        const active = await AuthService.getSession();
        setSession(active);
      } catch (err) {
        console.error('Auth context init error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSession();
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const active = await AuthService.login(email, pass);
      setSession(active);
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
    setIsLoading(false);
  };

  const register = async (name: string, email: string, pass: string) => {
    setIsLoading(true);
    try {
      const active = await AuthService.register(name, email, pass);
      setSession(active);
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
    setIsLoading(false);
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await AuthService.logout();
      setSession(null);
    } catch (err) {
      console.error('Logout failed:', err);
    }
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user || null,
        session,
        isAuthenticated: Boolean(session?.user),
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
