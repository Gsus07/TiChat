// src/components/react/ThemeToggle.tsx
import React from 'react';
import { useTheme } from './ThemeProvider';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ThemeToggle({ className = '', showLabel = false, size = 'md' }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme, isLoading } = useTheme();

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };

  const getThemeIcon = () => {
    if (isLoading) {
      return (
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      );
    }

    switch (theme) {
      case 'light':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
          </svg>
        );
      case 'dark':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        );
      case 'auto':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Claro';
      case 'dark':
        return 'Oscuro';
      case 'auto':
        return 'Auto';
      default:
        return '';
    }
  };

  const getNextThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Cambiar a tema oscuro';
      case 'dark':
        return 'Cambiar a tema automático';
      case 'auto':
        return 'Cambiar a tema claro';
      default:
        return 'Cambiar tema';
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={toggleTheme}
        disabled={isLoading}
        className={`
          ${sizeClasses[size]}
          flex items-center justify-center
          rounded-lg
          bg-secondary
          border border-secondary
          text-secondary
          hover:bg-secondary
          focus:outline-none focus:ring-2 focus:ring-[var(--border-accent)] focus:ring-offset-2
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          shadow-sm hover:shadow-md
        `}
        title={getNextThemeLabel()}
        aria-label={getNextThemeLabel()}
      >
        {getThemeIcon()}
      </button>
      
      {showLabel && (
        <span className="text-sm font-medium text-secondary">
          {getThemeLabel()}
        </span>
      )}
    </div>
  );
}

// Componente dropdown para selección de tema más detallada
export function ThemeSelector({ className = '' }: { className?: string }) {
  const { theme, setTheme, isLoading } = useTheme();

  const themes = [
    { value: 'light' as const, label: 'Claro', icon: '☀️' },
    { value: 'dark' as const, label: 'Oscuro', icon: '🌙' },
    { value: 'auto' as const, label: 'Automático', icon: '💻' }
  ];

  return (
    <div className={`relative ${className}`}>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as any)}
        disabled={isLoading}
        className="
          appearance-none
          bg-secondary
          border border-secondary
          rounded-lg
          px-3 py-2 pr-8
          text-sm
          text-secondary
          focus:outline-none focus:ring-2 focus:ring-[var(--border-accent)] focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
        "
      >
        {themes.map((themeOption) => (
          <option key={themeOption.value} value={themeOption.value}>
            {themeOption.icon} {themeOption.label}
          </option>
        ))}
      </select>
      
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}