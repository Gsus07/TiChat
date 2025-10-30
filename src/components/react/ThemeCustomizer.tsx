import React, { useState, useEffect } from 'react';
import { useTheme } from '../../utils/themeManager';
import { getUserThemePreference, saveUserThemePreference } from '../../utils/storage';

interface ThemeCustomizerProps {
  className?: string;
}

export const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({ className = '' }) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [customColors, setCustomColors] = useState({
    primary: '#3b82f6',
    secondary: '#1d4ed8',
    accent: '#1e40af',
  });

  // Utilidades para mezclar/derivar colores con mayor contraste visual
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const hexToRgb = (hex: string) => {
    const s = hex.replace('#', '');
    if (s.length !== 6) return { r: 0, g: 0, b: 0 };
    return {
      r: parseInt(s.substring(0, 2), 16),
      g: parseInt(s.substring(2, 4), 16),
      b: parseInt(s.substring(4, 6), 16)
    };
  };
  const rgbToHex = (r: number, g: number, b: number) =>
    `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
  const mix = (hex1: string, hex2: string, weight: number) => {
    const a = hexToRgb(hex1);
    const b = hexToRgb(hex2);
    const w = Math.max(0, Math.min(1, weight));
    const r = Math.round(a.r * (1 - w) + b.r * w);
    const g = Math.round(a.g * (1 - w) + b.g * w);
    const bl = Math.round(a.b * (1 - w) + b.b * w);
    return rgbToHex(r, g, bl);
  };
  const lighten = (hex: string, amount: number) => mix(hex, '#ffffff', amount);
  const darken = (hex: string, amount: number) => mix(hex, '#000000', amount);

  // Aplica variables derivadas para que la paleta afecte fondos/bordes y sea más visible
  const applyDerivedVariables = (base: { primary: string; secondary: string; accent: string }) => {
    const root = document.documentElement;
    // Intensidad de tinte en fondos según tema resuelto
    const isDark = resolvedTheme === 'dark';
    const bg1 = isDark ? darken(base.primary, 0.7) : lighten(base.primary, 0.92);
    const bg2 = isDark ? mix('#1e293b', base.secondary, 0.18) : lighten(base.secondary, 0.88);
    const bg3 = isDark ? mix('#0f172a', base.accent, 0.22) : lighten(base.accent, 0.82);
    const bgAccent = isDark ? mix('#0b1220', base.accent, 0.28) : lighten(base.accent, 0.75);

    // Bordes y calico basados en acento para coherencia
    const borderPrimary = isDark ? mix('#334155', base.primary, 0.2) : lighten(base.primary, 0.7);
    const borderSecondary = isDark ? mix('#475569', base.secondary, 0.22) : lighten(base.secondary, 0.65);
    const borderAccent = isDark ? mix('#64748b', base.accent, 0.28) : lighten(base.accent, 0.6);

    root.style.setProperty('--bg-primary', bg1);
    root.style.setProperty('--bg-secondary', bg2);
    root.style.setProperty('--bg-tertiary', bg3);
    root.style.setProperty('--bg-accent', bgAccent);

    root.style.setProperty('--border-primary', borderPrimary);
    root.style.setProperty('--border-secondary', borderSecondary);
    root.style.setProperty('--border-accent', borderAccent);

    // Potenciar elementos que usan esquema “calico” y acentos
    root.style.setProperty('--calico-orange', base.accent);
    root.style.setProperty('--calico-orange-light', lighten(base.accent, isDark ? 0.2 : 0.75));
  };

  // Paletas predefinidas
  const palettes = [
    { name: 'Océano', primary: '#0ea5a7', secondary: '#0284c7', accent: '#06b6d4' },
    { name: 'Atardecer', primary: '#fb923c', secondary: '#f59e0b', accent: '#ef4444' },
    { name: 'Bosque', primary: '#22c55e', secondary: '#16a34a', accent: '#4ade80' },
    { name: 'Violeta', primary: '#8b5cf6', secondary: '#7c3aed', accent: '#a78bfa' },
    { name: 'Neón', primary: '#22d3ee', secondary: '#22c55e', accent: '#f472b6' },
  ];

  const themeOptions = [
    { value: 'light', label: 'Claro', icon: '☀️' },
    { value: 'dark', label: 'Oscuro', icon: '🌙' },
    { value: 'auto', label: 'Automático', icon: '💻' }
  ];
  useEffect(() => {
    const saved = localStorage.getItem('theme-custom-colors');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCustomColors(parsed);
        Object.entries(parsed).forEach(([key, value]) => {
          document.documentElement.style.setProperty(`--color-${key}`, String(value));
        });
        // Aplicar variables derivadas para que el cambio sea notable en toda la UI
        applyDerivedVariables(parsed);
      } catch {
        // ignore
      }
    }
    // Intentar cargar tema desde el perfil en Supabase
    (async () => {
      const { theme: profileTheme } = await getUserThemePreference();
      if (profileTheme?.colors) {
        setCustomColors(profileTheme.colors);
        Object.entries(profileTheme.colors).forEach(([key, value]) => {
          document.documentElement.style.setProperty(`--color-${key}`, String(value));
        });
        applyDerivedVariables(profileTheme.colors);
        try {
          localStorage.setItem('theme-custom-colors', JSON.stringify(profileTheme.colors));
        } catch {}
      }
      if (profileTheme?.mode) {
        setTheme(profileTheme.mode);
        try {
          localStorage.setItem('tichat-theme-preference', profileTheme.mode);
        } catch {}
      }
    })();
  }, []);

  // Persistir automáticamente cambios de paleta
  useEffect(() => {
    try {
      localStorage.setItem('theme-custom-colors', JSON.stringify(customColors));
    } catch (_) {
      // ignore storage errors
    }
  }, [customColors]);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
    setTheme(newTheme);
    // Reaplicar derivados al cambiar entre claro/oscuro para mantener contraste
    applyDerivedVariables(customColors);
    // Persistir en perfil si está autenticado
    saveUserThemePreference({ mode: newTheme, colors: customColors, version: 1 }).catch(() => {});
  };

  const handleColorChange = (colorKey: string, value: string) => {
    setCustomColors(prev => ({
      ...prev,
      [colorKey]: value
    }));
    document.documentElement.style.setProperty(`--color-${colorKey}`, value);
    // Cada cambio de color actualiza los derivados
    const next = { ...customColors, [colorKey]: value } as {
      primary: string; secondary: string; accent: string
    };
    applyDerivedVariables(next);
  };

  const applyPalette = (palette: { primary: string; secondary: string; accent: string }) => {
    const next = {
      primary: palette.primary,
      secondary: palette.secondary,
      accent: palette.accent,
    };
    setCustomColors(next);
    Object.entries(next).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--color-${key}`, value as string);
    });
    applyDerivedVariables(next);
    try {
      localStorage.setItem('theme-custom-colors', JSON.stringify(next));
    } catch {}
    // Avisar globalmente para navegación SPA
    window.dispatchEvent(new CustomEvent('theme-custom-colors-updated', { detail: { colors: next } }));
  };

  const resetToDefaults = () => {
    const defaultColors = {
      primary: '#3b82f6',
      secondary: '#1d4ed8',
      accent: '#1e40af',
    };
    setCustomColors(defaultColors);
    Object.keys(defaultColors).forEach(key => {
      document.documentElement.style.removeProperty(`--color-${key}`);
    });
    // Quitar overrides derivados para volver al estilo base del tema
    const derivedKeys = [
      '--bg-primary','--bg-secondary','--bg-tertiary','--bg-accent',
      '--border-primary','--border-secondary','--border-accent',
      '--calico-orange','--calico-orange-light'
    ];
    derivedKeys.forEach(k => document.documentElement.style.removeProperty(k));
    try {
      localStorage.removeItem('theme-custom-colors');
    } catch {}
    window.dispatchEvent(new CustomEvent('theme-custom-colors-updated', { detail: { colors: null } }));
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
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[44rem] opacity-100' : 'max-h-0 opacity-0'}`}>
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

          {/* Paletas Predefinidas */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-secondary flex items-center gap-2">
              🧪 Paletas predefinidas
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {palettes.map((p) => (
                <button
                  key={p.name}
                  onClick={() => applyPalette(p)}
                  className="p-3 rounded-lg border border-primary/20 bg-secondary/50 hover:bg-secondary/70 transition-all duration-200 hover:scale-105 text-left"
                  title={`Aplicar ${p.name}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-primary">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full" style={{ backgroundColor: p.primary }} />
                    <span className="h-4 w-4 rounded-full" style={{ backgroundColor: p.secondary }} />
                    <span className="h-4 w-4 rounded-full" style={{ backgroundColor: p.accent }} />
                  </div>
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
              onClick={async () => {
                try {
                  localStorage.setItem('theme-custom-colors', JSON.stringify(customColors));
                } catch {}
                // Guardar también en el perfil
                await saveUserThemePreference({ mode: theme as any, colors: customColors, version: 1 }).catch(() => {});
                // Notificar para que otras vistas re-apliquen sin recargar
                window.dispatchEvent(new CustomEvent('theme-custom-colors-updated', { detail: { colors: customColors } }));
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