import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { userApi } from '../services/api';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('sp_theme') || 'light');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('sp_theme', theme);
  }, [theme]);

  // Sync theme preference to server settings when logged in
  const syncTheme = useCallback(async (t) => {
    try {
      await userApi.updateSettings({ settings: { theme: t } });
    } catch (e) {
      // non-fatal
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      syncTheme(next);
      return next;
    });
  }, [syncTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};