import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogle: (customEmail?: string, customName?: string) => Promise<User>;
  loginWithEmail: (email: string, name?: string) => Promise<User>;
  logout: () => void;
}

const STORAGE_KEY = 'trip_planner_user_session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to parse stored user session:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithGoogle = async (customEmail?: string, customName?: string): Promise<User> => {
    setIsLoading(true);
    // Simulate realistic Google authentication delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    const email = customEmail || 'traveler.alex@gmail.com';
    const name = customName || 'Alex Morgan';
    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();

    const newUser: User = {
      id: 'g_' + Math.random().toString(36).substring(2, 9),
      name,
      email,
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      provider: 'google',
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    setUser(newUser);
    setIsLoading(false);
    return newUser;
  };

  const loginWithEmail = async (email: string, name?: string): Promise<User> => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const userName = name || email.split('@')[0];
    const newUser: User = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      name: userName.charAt(0).toUpperCase() + userName.slice(1),
      email,
      avatar: `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80`,
      provider: 'email',
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    setUser(newUser);
    setIsLoading(false);
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loginWithGoogle,
        loginWithEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
