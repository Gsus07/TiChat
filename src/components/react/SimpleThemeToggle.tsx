import { useState, useEffect, useRef } from 'react';

type Theme = 'light' | 'dark' | 'auto';

export default function SimpleThemeToggle() {
  const [theme, setTheme] = useState<Theme>('auto');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Obtener tema actual del localStorage o usar 'auto' por defecto
    const savedTheme = localStorage.getItem('tichat-theme-preference') as Theme || 'auto';
    setTheme(savedTheme);

    // Función para detectar el tema del sistema
    const getSystemTheme = (): 'light' | 'dark' => {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    // Función para resolver el tema actual
    const resolveTheme = (themeType: Theme): 'light' | 'dark' => {
      return themeType === 'auto' ? getSystemTheme() : themeType;
    };

    // Aplicar tema inicial
    const resolved = resolveTheme(savedTheme);
    
    // Aplicar clase dark al documentElement
    if (resolved === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }

    // Escuchar cambios en el tema del sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (savedTheme === 'auto') {
        const newResolved = getSystemTheme();
        
        // Aplicar clase dark al documentElement
        if (newResolved === 'dark') {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
        } else {
          document.documentElement.classList.add('light');
          document.documentElement.classList.remove('dark');
        }
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  // Función para cerrar el dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Función para cambiar el tema directamente
  const selectTheme = (selectedTheme: Theme) => {
    setTheme(selectedTheme);
    localStorage.setItem('tichat-theme-preference', selectedTheme);
    
    const resolvedTheme = selectedTheme === 'auto' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : selectedTheme;
    
    if (resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    
    setIsOpen(false);
  };

  // Iconos para cada tema
  const getThemeIcon = (themeType: Theme) => {
    switch (themeType) {
      case 'light':
        return (
          <svg className="w-5 h-5 transition-all duration-300 drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"/>
          </svg>
        );
      case 'dark':
        return (
          <svg className="w-5 h-5 transition-all duration-300 drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd"/>
          </svg>
        );
      case 'auto':
        return (
          <svg className="w-5 h-5 transition-all duration-300 drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M2.25 6a3 3 0 013-3h13.5a3 3 0 013 3v12a3 3 0 01-3 3H5.25a3 3 0 01-3 3V6zm3.97.97a.75.75 0 011.06 0l2.25 2.25a.75.75 0 010 1.06l-2.25 2.25a.75.75 0 01-1.06-1.06l1.72-1.72-1.72-1.72a.75.75 0 010-1.06zm4.28 4.28a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" clipRule="evenodd"/>
          </svg>
        );
    }
  };

  const getThemeLabel = (themeType: Theme) => {
    switch (themeType) {
      case 'light': return 'Claro';
      case 'dark': return 'Oscuro';
      case 'auto': return 'Automático';
    }
  };

  const getCurrentThemeIcon = () => getThemeIcon(theme);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón principal del dropdown */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group fixed bottom-6 right-6 z-50 w-14 h-14 
                   bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-primary)]
                   backdrop-blur-md border border-secondary
                   rounded-full shadow-lg
                   hover:shadow-xl hover:shadow-accent/25
                   hover:scale-110 active:scale-95
                   transition-all duration-300 ease-out
                   text-secondary
                   hover:text-accent
                   hover:bg-gradient-to-br hover:from-[var(--bg-secondary)] hover:to-[var(--bg-primary)]
                   focus:outline-none focus:ring-2 focus:ring-[var(--border-accent)] focus:ring-offset-2 focus:ring-offset-transparent"
        title={`Tema actual: ${getThemeLabel(theme)}`}
      >
        <div className="flex items-center justify-center transform transition-transform duration-500 group-hover:rotate-180">
          {getCurrentThemeIcon()}
        </div>
        
        {/* Indicador de estado del tema */}
        <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-secondary transition-all duration-300 ${
          theme === 'light' ? 'bg-yellow-400 shadow-yellow-400/50' :
          theme === 'dark' ? 'bg-blue-600 shadow-blue-600/50' :
          'bg-gradient-to-r from-yellow-400 to-blue-600 shadow-purple-500/50'
        } shadow-lg`}></div>
        
        {/* Flecha del dropdown */}
        <div className={`absolute bottom-1 right-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <svg className="w-3 h-3 text-secondary" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a.75.75 0 010-1.414z" clipRule="evenodd"/>
          </svg>
        </div>
      </button>

      {/* Dropdown menu */}
      <div className={`fixed bottom-20 right-6 z-40 w-48 
                      bg-secondary backdrop-blur-md
                      border border-secondary
                      rounded-xl shadow-xl
                      transition-all duration-300 ease-out origin-bottom-right
                      ${isOpen 
                        ? 'opacity-100 scale-100 translate-y-0' 
                        : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
                      }`}>
        
        <div className="p-2">
          {(['light', 'dark', 'auto'] as Theme[]).map((themeOption) => (
            <button
              key={themeOption}
              onClick={() => selectTheme(themeOption)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg
                         transition-all duration-200 text-left
                         hover:bg-secondary
                         ${theme === themeOption 
                           ? 'bg-accent text-white border border-accent' 
                           : 'text-secondary hover:text-primary'
                         }`}
            >
              <div className={`flex-shrink-0 ${theme === themeOption ? 'text-accent' : 'text-secondary'}`}>
                {getThemeIcon(themeOption)}
              </div>
              
              <div className="flex-1">
                <div className="font-medium">{getThemeLabel(themeOption)}</div>
                <div className="text-xs opacity-70">
                  {themeOption === 'light' && 'Tema claro siempre'}
                  {themeOption === 'dark' && 'Tema oscuro siempre'}
                  {themeOption === 'auto' && 'Sigue el sistema'}
                </div>
              </div>
              
              {theme === themeOption && (
                <div className="flex-shrink-0">
                  <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
        
        {/* Separador y información adicional */}
        <div className="border-t border-secondary p-3">
          <div className="text-xs text-secondary text-center">
            Los cambios se aplican inmediatamente
          </div>
        </div>
      </div>
    </div>
  );
}