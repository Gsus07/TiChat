import type { APIRoute } from 'astro';
import { supabase } from '../../../utils/supabaseClient';
import { getCurrentUser } from '../../../utils/auth';
import type { ThemeConfig } from '../../../utils/games';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Verificar autenticación
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // TODO: Verificar permisos de administrador
    // Por ahora, solo permitimos a usuarios autenticados
    // En el futuro, agregar verificación de roles de admin

    const body = await request.json();
    const { entityType, entityId, themeConfig } = body;

    // Validar datos de entrada
    if (!entityType || !entityId || !themeConfig) {
      return new Response(
        JSON.stringify({ error: 'Datos incompletos' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!['game', 'server'].includes(entityType)) {
      return new Response(
        JSON.stringify({ error: 'Tipo de entidad inválido' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validar estructura del tema
    const isValidTheme = validateThemeConfig(themeConfig);
    if (!isValidTheme) {
      return new Response(
        JSON.stringify({ error: 'Configuración de tema inválida' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Actualizar en la base de datos
    let updateResult;
    
    if (entityType === 'game') {
      updateResult = await supabase
        .from('games')
        .update({ theme_config: themeConfig })
        .eq('id', entityId)
        .select()
        .single();
    } else {
      updateResult = await supabase
        .from('game_servers')
        .update({ theme_config: themeConfig })
        .eq('id', entityId)
        .select()
        .single();
    }

    if (updateResult.error) {
      return new Response(
        JSON.stringify({ error: 'Error al actualizar el tema' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Registrar la acción en logs (opcional)

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: updateResult.data,
        message: 'Tema actualizado exitosamente'
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

// Función para validar la estructura del tema
function validateThemeConfig(themeConfig: any): themeConfig is ThemeConfig {
  try {
    // Verificar que sea un objeto
    if (!themeConfig || typeof themeConfig !== 'object') {
      return false;
    }

    // Validar colores (opcional)
    if (themeConfig.colors) {
      const colors = themeConfig.colors;
      const colorFields = ['primary', 'secondary', 'accent', 'background', 'surface', 'text'];
      
      for (const field of colorFields) {
        if (colors[field] && !isValidColor(colors[field])) {
          return false;
        }
      }
    }

    // Validar tipografía (opcional)
    if (themeConfig.typography) {
      const typography = themeConfig.typography;
      
      if (typography.fontFamily && typeof typography.fontFamily !== 'string') {
        return false;
      }
      
      if (typography.headingFont && typeof typography.headingFont !== 'string') {
        return false;
      }
    }

    // Validar imágenes (opcional)
    if (themeConfig.images) {
      const images = themeConfig.images;
      const imageFields = ['hero', 'icon', 'pattern'];
      
      for (const field of imageFields) {
        if (images[field] && typeof images[field] !== 'string') {
          return false;
        }
      }
    }

    // Validar layout (opcional)
    if (themeConfig.layout) {
      const layout = themeConfig.layout;
      
      if (layout.borderRadius && typeof layout.borderRadius !== 'string') {
        return false;
      }
      
      if (layout.spacing && typeof layout.spacing !== 'string') {
        return false;
      }
    }

    return true;
  } catch (error) {
    return false;
  }
}

// Función para validar formato de color
function isValidColor(color: string): boolean {
  // Validar formato hexadecimal
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (hexRegex.test(color)) {
    return true;
  }
  
  // Validar formato RGB/RGBA
  const rgbRegex = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[0-1]?(\.\d+)?)?\s*\)$/;
  if (rgbRegex.test(color)) {
    return true;
  }
  
  // Validar formato HSL/HSLA
  const hslRegex = /^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(,\s*[0-1]?(\.\d+)?)?\s*\)$/;
  if (hslRegex.test(color)) {
    return true;
  }
  
  // Validar nombres de colores CSS básicos
  const namedColors = [
    'black', 'white', 'red', 'green', 'blue', 'yellow', 'cyan', 'magenta',
    'gray', 'grey', 'orange', 'purple', 'pink', 'brown', 'transparent'
  ];
  
  if (namedColors.includes(color.toLowerCase())) {
    return true;
  }
  
  return false;
}

// Endpoint GET para obtener configuración actual
export const GET: APIRoute = async ({ request, url }) => {
  try {
    const entityType = url.searchParams.get('entityType');
    const entityId = url.searchParams.get('entityId');

    if (!entityType || !entityId) {
      return new Response(
        JSON.stringify({ error: 'Parámetros faltantes' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    let result;
    
    if (entityType === 'game') {
      result = await supabase
        .from('games')
        .select('theme_config')
        .eq('id', entityId)
        .single();
    } else if (entityType === 'server') {
      result = await supabase
        .from('game_servers')
        .select('theme_config')
        .eq('id', entityId)
        .single();
    } else {
      return new Response(
        JSON.stringify({ error: 'Tipo de entidad inválido' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (result.error) {
      return new Response(
        JSON.stringify({ error: 'Entidad no encontrada' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: result.data.theme_config || {} 
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};