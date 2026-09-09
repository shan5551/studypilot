import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sp_user') || 'null');
    } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('sp_token'));
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const restore = async () => {
      if (token) {
        try {
          const res = await authApi.me();
          setUser(res.data.user);
          localStorage.setItem('sp_user', JSON.stringify(res.data.user));
        } catch (e) {
          localStorage.removeItem('sp_token');
          localStorage.removeItem('sp_user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    restore();
  }, [token]);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login({ email, password });
    setToken(res.data.token);
    setUser(res.data.user);
    localStorage.setItem('sp_token', res.data.token);
    localStorage.setItem('sp_user', JSON.stringify(res.data.user));
    return res.data.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await authApi.register({ name, email, password });
    setToken(res.data.token);
    setUser(res.data.user);
    localStorage.setItem('sp_token', res.data.token);
    localStorage.setItem('sp_user', JSON.stringify(res.data.user));
    return res.data.user;
  }, []);

  // Complete a Google OAuth login: store token, then fetch the user.
  const googleSignIn = useCallback(async (googleToken) => {
    localStorage.setItem('sp_token', googleToken);
    setToken(googleToken);
    const res = await authApi.me();
    setUser(res.data.user);
    localStorage.setItem('sp_user', JSON.stringify(res.data.user));
    return res.data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('sp_token');
    localStorage.removeItem('sp_user');
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updated) => {
    setUser(updated);
    localStorage.setItem('sp_user', JSON.stringify(updated));
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, googleSignIn, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};