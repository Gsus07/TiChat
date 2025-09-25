// src/utils/themeManager.ts
import React from 'react';

export type Theme = 'light' | 'dark' | 'auto';

export interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  systemTheme: 'light' | 'dark';
}

class ThemeManager {
  private static instance: ThemeManager;
  private currentTheme: Theme = 'auto';
  private resolvedTheme: 'light' | 'dark' = 'light';
  private systemTheme: 'light' | 'dark' = 'light';
  private listeners: Set<(state: ThemeState) => void> = new Set();
  private mediaQuery: MediaQueryList | null = null;
  private storageKey = 'tichat-theme-preference';

  private constructor() {
    this.initializeTheme();
  }

  public static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  private initializeTheme(): void {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return;

    // Detectar preferencia del sistema
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.systemTheme = this.mediaQuery.matches ? 'dark' : 'light';

    // Escuchar cambios en la preferencia del sistema
    this.mediaQuery.addEventListener('change', this.handleSystemThemeChange.bind(this));

    // Cargar preferencia guardada
    const savedTheme = this.loadThemeFromStorage();
    this.currentTheme = savedTheme;

    // Resolver tema actual
    this.resolveTheme();

    // Aplicar tema inicial
    this.applyTheme();
  }

  private handleSystemThemeChange = (e: MediaQueryListEvent): void => {
    this.systemTheme = e.matches ? 'dark' : 'light';
    this.resolveTheme();
    this.applyTheme();
    this.notifyListeners();
  };

  private loadThemeFromStorage(): Theme {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved && ['light', 'dark', 'auto'].includes(saved)) {
        return saved as Theme;
      }
    } catch (error) {
      // Silently handle storage errors
    }
    return 'auto';
  }

  private saveThemeToStorage(theme: Theme): void {
    try {
      localStorage.setItem(this.storageKey, theme);
    } catch (error) {
      // Silently handle storage errors
    }
  }

  private resolveTheme(): void {
    if (this.currentTheme === 'auto') {
      this.resolvedTheme = this.systemTheme;
    } else {
      this.resolvedTheme = this.currentTheme;
    }
  }

  private applyTheme(): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    
    // Remover clases de tema anteriores
    root.classList.remove('light', 'dark');
    
    // Agregar clase del tema actual
    root.classList.add(this.resolvedTheme);
    
    // Actualizar atributo data-theme para compatibilidad
    root.setAttribute('data-theme', this.resolvedTheme);
    
    // Actualizar meta theme-color para navegadores móviles
    this.updateMetaThemeColor();
  }

  private updateMetaThemeColor(): void {
    if (typeof document === 'undefined') return;

    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }

    const color = this.resolvedTheme === 'dark' ? '#1e293b' : '#ffffff';
    metaThemeColor.setAttribute('content', color);
  }

  private notifyListeners(): void {
    const state: ThemeState = {
      theme: this.currentTheme,
      resolvedTheme: this.resolvedTheme,
      systemTheme: this.systemTheme
    };

    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        // Silently handle listener errors
      }
    });
  }

  public setTheme(theme: Theme): void {
    if (this.currentTheme === theme) return;

    this.currentTheme = theme;
    this.resolveTheme();
    this.saveThemeToStorage(theme);
    this.applyTheme();
    this.notifyListeners();
  }

  public getTheme(): Theme {
    return this.currentTheme;
  }

  public getResolvedTheme(): 'light' | 'dark' {
    return this.resolvedTheme;
  }

  public getSystemTheme(): 'light' | 'dark' {
    return this.systemTheme;
  }

  public getState(): ThemeState {
    return {
      theme: this.currentTheme,
      resolvedTheme: this.resolvedTheme,
      systemTheme: this.systemTheme
    };
  }

  public subscribe(listener: (state: ThemeState) => void): () => void {
    this.listeners.add(listener);
    
    // Llamar inmediatamente con el estado actual
    listener(this.getState());
    
    // Retornar función de cleanup
    return () => {
      this.listeners.delete(listener);
    };
  }

  public toggleTheme(): void {
    const nextTheme: Theme = this.currentTheme === 'light' ? 'dark' : 
                            this.currentTheme === 'dark' ? 'auto' : 'light';
    this.setTheme(nextTheme);
  }

  public destroy(): void {
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener('change', this.handleSystemThemeChange);
    }
    this.listeners.clear();
  }
}

// Exportar instancia singleton
export const themeManager = ThemeManager.getInstance();

// Hook para React components
export function useTheme() {
  if (typeof window === 'undefined') {
    return {
      theme: 'auto' as Theme,
      resolvedTheme: 'light' as 'light' | 'dark',
      systemTheme: 'light' as 'light' | 'dark',
      setTheme: () => {},
      toggleTheme: () => {}
    };
  }

  const [state, setState] = React.useState<ThemeState>(themeManager.getState());

  React.useEffect(() => {
    const unsubscribe = themeManager.subscribe(setState);
    return unsubscribe;
  }, []);

  return {
    ...state,
    setTheme: themeManager.setTheme.bind(themeManager),
    toggleTheme: themeManager.toggleTheme.bind(themeManager)
  };
}

// Función para inicializar el tema en el servidor (SSR)
export function getInitialTheme(): string {
  return `
    (function() {
      try {
        var theme = localStorage.getItem('tichat-theme-preference') || 'auto';
        var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        var resolvedTheme = theme === 'auto' ? systemTheme : theme;
        
        document.documentElement.classList.add(resolvedTheme);
        document.documentElement.setAttribute('data-theme', resolvedTheme);
        
        var metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
          metaThemeColor = document.createElement('meta');
          metaThemeColor.setAttribute('name', 'theme-color');
          document.head.appendChild(metaThemeColor);
        }
        metaThemeColor.setAttribute('content', resolvedTheme === 'dark' ? '#1e293b' : '#ffffff');
      } catch (e) {
        // Silently handle theme initialization errors
      }
    })();
  `;
}