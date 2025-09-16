/**
 * Utilidades para análisis de color y contraste dinámico
 */

// Función para convertir hex a RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Función para convertir RGB a luminancia
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Función para calcular el ratio de contraste entre dos colores
export function getContrastRatio(color1: { r: number; g: number; b: number }, color2: { r: number; g: number; b: number }): number {
  const lum1 = getLuminance(color1.r, color1.g, color1.b);
  const lum2 = getLuminance(color2.r, color2.g, color2.b);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// Función para determinar si un color es claro u oscuro
export function isLightColor(r: number, g: number, b: number): boolean {
  const luminance = getLuminance(r, g, b);
  return luminance > 0.5;
}

// Función para obtener el color de texto óptimo basado en el fondo
export function getOptimalTextColor(backgroundColor: { r: number; g: number; b: number }): string {
  const whiteContrast = getContrastRatio(backgroundColor, { r: 255, g: 255, b: 255 });
  const blackContrast = getContrastRatio(backgroundColor, { r: 0, g: 0, b: 0 });
  
  // Si el contraste con blanco es mayor, usar blanco; si no, usar negro
  if (whiteContrast > blackContrast) {
    return '#ffffff';
  } else {
    return '#000000';
  }
}

// Función para obtener colores de texto con diferentes niveles de opacidad
export function getTextColorVariants(backgroundColor: { r: number; g: number; b: number }) {
  const isLight = isLightColor(backgroundColor.r, backgroundColor.g, backgroundColor.b);
  
  if (isLight) {
    // Fondo claro - usar textos oscuros
    return {
      primary: 'rgba(0, 0, 0, 0.9)',
      secondary: 'rgba(0, 0, 0, 0.7)',
      tertiary: 'rgba(0, 0, 0, 0.5)',
      accent: 'rgba(0, 0, 0, 0.8)'
    };
  } else {
    // Fondo oscuro - usar textos claros
    return {
      primary: 'rgba(255, 255, 255, 0.95)',
      secondary: 'rgba(255, 255, 255, 0.8)',
      tertiary: 'rgba(255, 255, 255, 0.6)',
      accent: 'rgba(255, 255, 255, 0.9)'
    };
  }
}

// Función para extraer color dominante de una imagen (simulada para el lado del servidor)
export function getDominantColorFromImage(imageUrl: string): Promise<{ r: number; g: number; b: number }> {
  return new Promise((resolve) => {
    // En el servidor, no podemos analizar la imagen directamente
    // Usaremos una aproximación basada en el nombre del juego o URL
    
    // Colores predeterminados basados en juegos conocidos
    const gameColors: { [key: string]: { r: number; g: number; b: number } } = {
      'minecraft': { r: 87, g: 132, b: 45 }, // Verde Minecraft
      'pinturillo': { r: 255, g: 193, b: 7 }, // Amarillo
      'among-us': { r: 197, g: 17, b: 17 }, // Rojo Among Us
      'call-of-duty': { r: 51, g: 51, b: 51 }, // Gris oscuro
      'fortnite': { r: 0, g: 174, b: 255 }, // Azul Fortnite
      'uno': { r: 227, g: 6, b: 19 } // Rojo UNO
    };
    
    // Intentar detectar el juego por la URL
    const gameKey = Object.keys(gameColors).find(game => 
      imageUrl.toLowerCase().includes(game.replace('-', ''))
    );
    
    if (gameKey) {
      resolve(gameColors[gameKey]);
    } else {
      // Color por defecto si no se puede determinar
      resolve({ r: 100, g: 100, b: 100 });
    }
  });
}

// Función principal para obtener estilos de texto dinámicos
export async function getDynamicTextStyles(imageUrl: string) {
  try {
    const dominantColor = await getDominantColorFromImage(imageUrl);
    const textColors = getTextColorVariants(dominantColor);
    
    return {
      dominantColor,
      textColors,
      isLightBackground: isLightColor(dominantColor.r, dominantColor.g, dominantColor.b),
      styles: {
        '--dynamic-text-primary': textColors.primary,
        '--dynamic-text-secondary': textColors.secondary,
        '--dynamic-text-tertiary': textColors.tertiary,
        '--dynamic-text-accent': textColors.accent
      }
    };
  } catch (error) {
    console.error('Error analyzing image color:', error);
    // Fallback a colores seguros
    return {
      dominantColor: { r: 100, g: 100, b: 100 },
      textColors: {
        primary: 'rgba(255, 255, 255, 0.95)',
        secondary: 'rgba(255, 255, 255, 0.8)',
        tertiary: 'rgba(255, 255, 255, 0.6)',
        accent: 'rgba(255, 255, 255, 0.9)'
      },
      isLightBackground: false,
      styles: {
        '--dynamic-text-primary': 'rgba(255, 255, 255, 0.95)',
        '--dynamic-text-secondary': 'rgba(255, 255, 255, 0.8)',
        '--dynamic-text-tertiary': 'rgba(255, 255, 255, 0.6)',
        '--dynamic-text-accent': 'rgba(255, 255, 255, 0.9)'
      }
    };
  }
}

export default {
  hexToRgb,
  getLuminance,
  getContrastRatio,
  isLightColor,
  getOptimalTextColor,
  getTextColorVariants,
  getDominantColorFromImage,
  getDynamicTextStyles
};