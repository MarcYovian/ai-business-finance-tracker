import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types/finance';
import { userStorage } from '@/lib/storage';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  signup: (email: string, password: string) => boolean;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = userStorage.getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  const signup = (email: string, _password: string): boolean => {
    const existingUser = userStorage.findByEmail(email);
    if (existingUser) {
      return false;
    }
    const newUser = userStorage.create(email);
    setUser(newUser);
    userStorage.setCurrentUser(newUser);
    return true;
  };

  const login = (email: string, _password: string): boolean => {
    const existingUser = userStorage.findByEmail(email);
    if (!existingUser) {
      return false;
    }
    setUser(existingUser);
    userStorage.setCurrentUser(existingUser);
    return true;
  };

  const logout = () => {
    setUser(null);
    userStorage.setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
