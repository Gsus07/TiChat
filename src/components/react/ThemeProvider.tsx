// src/components/react/ThemeProvider.tsx
import React, { createContext, useContext } from 'react';
import { useTheme as useThemeManager } from '../../utils/themeManager';

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
  const state = useThemeManager();
  return (
    <ThemeContext.Provider value={{ ...state, isLoading: false }}>
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
  const { theme, resolvedTheme, systemTheme } = useTheme();
  return (
    <div className="fixed bottom-4 right-4 bg-secondary p-3 rounded-lg shadow-lg border border-secondary text-xs font-mono z-50 text-secondary">
      <div>Theme: {theme}</div>
      <div>Resolved: {resolvedTheme}</div>
      <div>System: {systemTheme}</div>
    </div>
  );
}
