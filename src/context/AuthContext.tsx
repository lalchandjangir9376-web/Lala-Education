import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Language } from '../types';
import { api, getStoredToken } from '../lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  login: (identifier: string, password: string) => Promise<void>;
  adminLogin: (identifier: string, password: string) => Promise<void>;
  register: (data: any) => Promise<string>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateCoins: (newAmount: number) => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('lala_edu_lang') as Language) || 'hi';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('lala_edu_lang', lang);
  };

  const refreshUser = async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api.getCurrentUser();
      setUser(data.user);
      if (data.user.preferredLanguage) {
        setLanguageState(data.user.preferredLanguage);
      }
    } catch (err) {
      console.warn('Session verification failed, logging out:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (identifier: string, password: string) => {
    const data = await api.login(identifier, password);
    setUser(data.user);
    if (data.user.preferredLanguage) {
      setLanguage(data.user.preferredLanguage);
    }
  };

  const adminLogin = async (identifier: string, password: string) => {
    const data = await api.adminLogin(identifier, password);
    setUser(data.user);
    if (data.user.preferredLanguage) {
      setLanguage(data.user.preferredLanguage);
    }
  };

  const register = async (formData: any): Promise<string> => {
    const data = await api.register(formData);
    setUser(data.user);
    if (data.user.preferredLanguage) {
      setLanguage(data.user.preferredLanguage);
    }
    return data.message;
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const updateCoins = (newCoins: number) => {
    setUser((prev) => (prev ? { ...prev, coins: newCoins } : null));
  };

  const updateProfile = async (updates: Partial<User>) => {
    const res = await api.updateProfile(updates);
    setUser(res.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        language,
        setLanguage,
        login,
        adminLogin,
        register,
        logout,
        refreshUser,
        updateCoins,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
