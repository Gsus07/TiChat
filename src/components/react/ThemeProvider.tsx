// src/components/react/ThemeProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  systemTheme: 'light' | 'dark';
  isLoading: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('auto');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('tichat-theme-preference') as Theme | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const sys = prefersDark ? 'dark' : 'light';
    setSystemTheme(sys);
    setThemeState(saved || 'auto');
  }, []);

  useEffect(() => {
    const resolved = theme === 'auto' ? systemTheme : theme;
    setResolvedTheme(resolved);
    document.documentElement.classList.toggle('dark', resolved === 'dark');
    document.documentElement.classList.toggle('light', resolved === 'light');
    document.documentElement.setAttribute('data-theme', resolved);
    localStorage.setItem('tichat-theme-preference', theme);
    setIsLoading(false);
  }, [theme, systemTheme]);

  const setTheme = (next: Theme) => setThemeState(next);
  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : prev === 'dark' ? 'auto' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, systemTheme, isLoading, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Componente para mostrar el estado del tema (útil para debugging)
export function ThemeDebugger() {
  const { theme, resolvedTheme, systemTheme, isLoading } = useTheme();

  if (isLoading) {
    return <div className="text-sm text-secondary">Loading theme...</div>;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-secondary p-3 rounded-lg shadow-lg border border-secondary text-xs font-mono z-50 text-secondary">
      <div>Theme: {theme}</div>
      <div>Resolved: {resolvedTheme}</div>
      <div>System: {systemTheme}</div>
    </div>
  );
}