import type { APIRoute } from 'astro';
import { updateServer, deleteServer, getServerById } from '../../../utils/games';
import { supabase } from '../../../utils/supabaseClient';

// GET /api/servers/[id] - Obtener servidor por ID
export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'ID del servidor requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await getServerById(id);
    
    if (result.error) {
      return new Response(
        JSON.stringify({ error: 'Error al obtener servidor' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!result.data) {
      return new Response(
        JSON.stringify({ error: 'Servidor no encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true,
        data: result.data
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

// PUT /api/servers/[id] - Actualizar servidor
export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'ID del servidor requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

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

    // Verificar que el servidor existe y que el usuario es el propietario
    const { data: existingServer, error: fetchError } = await supabase
      .from('game_servers')
      .select('owner_id, is_active')
      .eq('id', id)
      .single();

    if (fetchError || !existingServer) {
      return new Response(
        JSON.stringify({ error: 'Servidor no encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (existingServer.owner_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'No tienes permisos para editar este servidor' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener datos del servidor del cuerpo de la petición
    const serverData = await request.json();
    
    // Validar datos requeridos
    if (serverData.name && serverData.name.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: 'El nombre debe tener al menos 3 caracteres' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (serverData.description && serverData.description.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: 'La descripción debe tener al menos 10 caracteres' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar puerto si se proporciona
    if (serverData.server_port) {
      const port = parseInt(serverData.server_port);
      if (isNaN(port) || port < 1 || port > 65535) {
        return new Response(
          JSON.stringify({ error: 'El puerto debe ser un número entre 1 y 65535' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validar máximo de jugadores si se proporciona
    if (serverData.max_players) {
      const maxPlayers = parseInt(serverData.max_players);
      if (isNaN(maxPlayers) || maxPlayers < 1 || maxPlayers > 1000) {
        return new Response(
          JSON.stringify({ error: 'El máximo de jugadores debe ser un número entre 1 y 1000' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Actualizar el servidor usando la función utilitaria
    const result = await updateServer(id, serverData);
    
    if (result.error) {
      return new Response(
        JSON.stringify({ 
          error: 'Error al actualizar servidor',
          details: (result.error as any)?.message || result.error
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Servidor actualizado exitosamente',
        data: result.data
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

// DELETE /api/servers/[id] - Eliminar servidor (soft delete)
export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'ID del servidor requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

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

    // Verificar que el servidor existe y que el usuario es el propietario
    const { data: existingServer, error: fetchError } = await supabase
      .from('game_servers')
      .select('owner_id, is_active')
      .eq('id', id)
      .single();

    if (fetchError || !existingServer) {
      return new Response(
        JSON.stringify({ error: 'Servidor no encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (existingServer.owner_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'No tienes permisos para eliminar este servidor' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Eliminar el servidor usando la función utilitaria (soft delete)
    const result = await deleteServer(id);
    
    if (result.error) {
      return new Response(
        JSON.stringify({ 
          error: 'Error al eliminar servidor',
          details: (result.error as any)?.message || result.error
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Servidor eliminado exitosamente',
        data: result.data
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