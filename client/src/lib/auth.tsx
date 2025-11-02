import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { apiRequest } from './queryClient';

interface AuthContextType {
  user: null | { id: string; name: string; email?: string; phone?: string; provider: 'google' | 'email' | 'phone' };
  loginWithGoogle: () => void;
  loginWithEmail: (email: string, password: string) => void;
  loginWithPhone: (phone: string, password: string) => void;
  register: (data: { name: string; email?: string; phone?: string; password: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthContextType['user']>(null);

  // Try to load user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  // Save user to localStorage on change
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  // Register user
  const register = async (data: { name: string; email?: string; phone?: string; password: string }) => {
    const response = await apiRequest('POST', '/api/register', data);
    const userData = await response.json();
    setUser({
      id: userData.id,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      provider: data.email ? 'email' : 'phone'
    });
  };

  // Simulate Google login (replace with real Google OAuth in production)
  const loginWithGoogle = () => {
    const email = prompt('Enter your Google email:');
    if (!email) return;
    setUser({ name: email.split('@')[0], email, provider: 'google', id: email });
  };

  // Email login
  const loginWithEmail = async (email: string, password: string) => {
    if (!email || !password) return;
    const res = await axios.post('/api/login', { email, password });
    setUser({ ...res.data, provider: 'email' });
  };

  // Phone login
  const loginWithPhone = async (phone: string, password: string) => {
    if (!phone || !password) return;
    const res = await axios.post('/api/login', { phone, password });
    setUser({ ...res.data, provider: 'phone' });
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, loginWithGoogle, loginWithEmail, loginWithPhone, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
