import React, { useState, useEffect } from 'react';
import { useTheme } from './ThemeProvider';

interface ThemeCustomizerProps {
  className?: string;
}

export const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({ className = '' }) => {
  const { theme, setTheme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [customColors, setCustomColors] = useState({
    primary: '#3b82f6',
    secondary: '#1d4ed8',
    accent: '#1e40af',
  });

  const themeOptions = [
    { value: 'light', label: 'Claro', icon: '☀️' },
    { value: 'dark', label: 'Oscuro', icon: '🌙' },
    { value: 'auto', label: 'Automático', icon: '🔄' },
  ];

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
    setTheme(newTheme);
  };

  const handleColorChange = (colorKey: string, value: string) => {
    setCustomColors(prev => ({
      ...prev,
      [colorKey]: value
    }));
    
    // Aplicar el color personalizado inmediatamente
    document.documentElement.style.setProperty(`--color-${colorKey}`, value);
  };

  const resetToDefaults = () => {
    const defaultColors = {
      primary: '#3b82f6',
      secondary: '#1d4ed8',
      accent: '#1e40af',
    };
    
    setCustomColors(defaultColors);
    
    // Remover las variables personalizadas para volver a los valores por defecto
    Object.keys(defaultColors).forEach(key => {
      document.documentElement.style.removeProperty(`--color-${key}`);
    });
  };

  return (
    <div className={`theme-customizer bg-secondary/80 backdrop-blur-md rounded-xl border border-primary/20 transition-all duration-300 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-primary/10">
        <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
          🎨 Personalizar Tema
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-all duration-200 hover:scale-105"
          aria-label={isExpanded ? 'Contraer' : 'Expandir'}
        >
          <svg 
            className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-4 space-y-6">
          {/* Theme Selection */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-secondary flex items-center gap-2">
              🌓 Modo de Tema
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleThemeChange(option.value as 'light' | 'dark' | 'auto')}
                  className={`p-3 rounded-lg border transition-all duration-200 hover:scale-105 ${
                    theme === option.value
                      ? 'bg-accent text-white border-accent shadow-lg shadow-accent/25'
                      : 'bg-secondary/50 text-secondary border-primary/20 hover:bg-secondary/70'
                  }`}
                >
                  <div className="text-lg mb-1">{option.icon}</div>
                  <div className="text-xs font-medium">{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Color Customization */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-secondary flex items-center gap-2">
              🎨 Colores Personalizados
            </h4>
            <div className="space-y-3">
              {Object.entries(customColors).map(([key, value]) => (
                <div key={key} className="flex items-center gap-3">
                  <label className="text-sm text-secondary capitalize min-w-[80px]">
                    {key === 'primary' ? 'Primario' : key === 'secondary' ? 'Secundario' : 'Acento'}:
                  </label>
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      className="w-10 h-8 rounded border border-primary/20 bg-transparent cursor-pointer transition-transform hover:scale-110"
                    />
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      className="flex-1 px-3 py-1 bg-secondary/50 border border-primary/20 rounded text-primary text-sm font-mono transition-all focus:border-accent focus:ring-1 focus:ring-accent/50"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-primary/10">
            <button
              onClick={resetToDefaults}
              className="flex-1 px-4 py-2 bg-secondary/50 hover:bg-secondary/70 text-secondary border border-primary/20 rounded-lg transition-all duration-200 hover:scale-105 text-sm font-medium"
            >
              🔄 Restablecer
            </button>
            <button
              onClick={() => {
                // Guardar configuración en localStorage
                localStorage.setItem('theme-custom-colors', JSON.stringify(customColors));
                // Mostrar feedback visual
                const button = document.activeElement as HTMLButtonElement;
                if (button) {
                  const originalText = button.textContent;
                  button.textContent = '✅ Guardado';
                  setTimeout(() => {
                    button.textContent = originalText;
                  }, 1500);
                }
              }}
              className="flex-1 px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg transition-all duration-200 hover:scale-105 text-sm font-medium shadow-lg shadow-accent/25"
            >
              💾 Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeCustomizer;