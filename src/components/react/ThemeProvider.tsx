// src/components/react/ThemeProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { themeManager, type Theme, type ThemeState } from '../../utils/themeManager';

interface ThemeContextType extends ThemeState {
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({ children, defaultTheme = 'auto' }: ThemeProviderProps) {
  const [state, setState] = useState<ThemeState>({
    theme: defaultTheme,
    resolvedTheme: 'light',
    systemTheme: 'light'
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Inicializar el tema manager y suscribirse a cambios
    const unsubscribe = themeManager.subscribe((newState) => {
      setState(newState);
      setIsLoading(false);
    });

    // Cleanup
    return () => {
      unsubscribe();
    };
  }, []);

  const contextValue: ThemeContextType = {
    ...state,
    setTheme: themeManager.setTheme.bind(themeManager),
    toggleTheme: themeManager.toggleTheme.bind(themeManager),
    isLoading
  };

  return (
    <ThemeContext.Provider value={contextValue}>
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
    return <div className="text-sm text-gray-500">Loading theme...</div>;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border text-xs font-mono z-50">
      <div>Theme: {theme}</div>
      <div>Resolved: {resolvedTheme}</div>
      <div>System: {systemTheme}</div>
    </div>
  );
}