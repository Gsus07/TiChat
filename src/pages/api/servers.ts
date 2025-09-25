import type { APIRoute } from 'astro';
import { createServer } from '../../utils/games';
import { supabase } from '../../utils/supabaseClient';

export const POST: APIRoute = async ({ request }) => {
  try {
    
    // Obtener el token de autorización
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Token de autorización requerido' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.substring(7);
    
    // Verificar el token con Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido o expirado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener datos del servidor del cuerpo de la petición
    const serverData = await request.json();
    
    // Validar datos requeridos
    if (!serverData.name || !serverData.game_id) {
      const missingFields = [];
      if (!serverData.name) missingFields.push('name');
      if (!serverData.game_id) missingFields.push('game_id');
      
      const errorMsg = `Campos requeridos faltantes: ${missingFields.join(', ')}`;
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Asignar el owner_id del usuario autenticado
    const serverDataWithOwner = {
      ...serverData,
      owner_id: user.id
    };

    // Crear el servidor usando la función utilitaria
    const result = await createServer(serverDataWithOwner);
    
    if (result.error) {
      return new Response(
        JSON.stringify({ 
          error: 'Error al crear servidor',
          details: (result.error as any)?.message || result.error
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Servidor creado exitosamente',
        data: result.data
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const GET: APIRoute = async ({ request }) => {
  try {
    // Obtener parámetros de consulta
    const url = new URL(request.url);
    const gameId = url.searchParams.get('game_id');
    const userId = url.searchParams.get('user_id');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let query = supabase
      .from('game_servers')
      .select(`
        *,
        games:game_id(name, slug),
        profiles:owner_id(username, full_name)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filtrar por juego si se especifica
    if (gameId) {
      query = query.eq('game_id', gameId);
    }

    // Filtrar por usuario si se especifica
    if (userId) {
      query = query.eq('owner_id', userId);
    }

    const { data: servers, error } = await query;
    
    if (error) {
      return new Response(
        JSON.stringify({ error: 'Error al obtener servidores' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true,
        data: servers || [],
        count: servers?.length || 0
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};