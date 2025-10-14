import type { APIRoute } from 'astro';
import { supabase } from '../../utils/supabaseClient';
import { createGame } from '../../utils/games';
import { deleteGameImage } from '../../utils/imageUpload';

export const GET: APIRoute = async ({ request }) => {
  try {
    
    const url = new URL(request.url);
    const name = url.searchParams.get('name');
    const id = url.searchParams.get('id');
    
    if (name) {
      // Buscar juego por nombre
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('name', name)
        .eq('is_active', true)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return new Response(
            JSON.stringify({ error: 'Juego no encontrado' }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response(
          JSON.stringify({ error: 'Error al obtener juego' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: true, data }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (id) {
      // Buscar juego por ID
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return new Response(
            JSON.stringify({ error: 'Juego no encontrado' }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response(
          JSON.stringify({ error: 'Error al obtener juego' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: true, data }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Si no se especifica nombre ni ID, obtener todos los juegos
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) {
      return new Response(
        JSON.stringify({ error: 'Error al obtener juegos' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: data || [],
        count: data?.length || 0
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

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

    // Obtener datos del juego del cuerpo de la petición
    const gameData = await request.json();
    
    // Validar datos requeridos
    if (!gameData.name) {
      return new Response(
        JSON.stringify({ error: 'El nombre del juego es requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que no existe un juego con el mismo nombre
    const { data: existingGame } = await supabase
      .from('games')
      .select('id')
      .eq('name', gameData.name)
      .eq('is_active', true)
      .single();

    if (existingGame) {
      return new Response(
        JSON.stringify({ error: 'Ya existe un juego con ese nombre' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Preparar datos del juego
    const newGameData = {
      name: gameData.name.trim(),
      description: gameData.description?.trim() || `Únete a la comunidad de ${gameData.name} y comparte tus experiencias de juego.`,
      genre: gameData.genre?.trim() || null,
      platform: gameData.platform?.trim() || null,
      cover_image_url: gameData.cover_image_url?.trim() || null,
      has_servers: gameData.has_servers || false,
      is_active: true
    };

    // Crear el juego
    const { data: createdGame, error: createError } = await createGame(newGameData);

    if (createError) {
      return new Response(
        JSON.stringify({ error: 'Error al crear el juego' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: createdGame,
        message: 'Juego creado exitosamente'
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const PUT: APIRoute = async ({ request }) => {
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

    // Obtener datos del juego del cuerpo de la petición
    const gameData = await request.json();
    
    // Validar que se proporcione el ID
    if (!gameData.id) {
      return new Response(
        JSON.stringify({ error: 'ID del juego es requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que el juego existe
    const { data: existingGame, error: fetchError } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameData.id)
      .eq('is_active', true)
      .single();

    if (fetchError || !existingGame) {
      return new Response(
        JSON.stringify({ error: 'Juego no encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que no existe otro juego con el mismo nombre (si se está cambiando el nombre)
    if (gameData.name && gameData.name !== existingGame.name) {
      const { data: duplicateGame } = await supabase
        .from('games')
        .select('id')
        .eq('name', gameData.name)
        .eq('is_active', true)
        .neq('id', gameData.id)
        .single();

      if (duplicateGame) {
        return new Response(
          JSON.stringify({ error: 'Ya existe un juego con ese nombre' }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Preparar datos de actualización
    const updateData: any = {};

    if (gameData.name) updateData.name = gameData.name.trim();
    if (gameData.description !== undefined) updateData.description = gameData.description?.trim() || null;
    if (gameData.genre !== undefined) updateData.genre = gameData.genre?.trim() || null;
    if (gameData.platform !== undefined) updateData.platform = gameData.platform?.trim() || null;
    if (gameData.cover_image_url !== undefined) updateData.cover_image_url = gameData.cover_image_url?.trim() || null;
    if (gameData.has_servers !== undefined) updateData.has_servers = gameData.has_servers;
    if (gameData.theme_config !== undefined) updateData.theme_config = gameData.theme_config;

    // Actualizar el juego
    const { data: updatedGames, error: updateError } = await supabase
      .from('games')
      .update(updateData)
      .eq('id', gameData.id)
      .eq('is_active', true)
      .select();

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Error al actualizar el juego', details: updateError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!updatedGames || updatedGames.length === 0) {
      // Verificación adicional sin filtro is_active para diagnóstico
      const { data: gameCheck } = await supabase
        .from('games')
        .select('id, name, is_active')
        .eq('id', gameData.id);
      
      return new Response(
        JSON.stringify({ error: 'Juego no encontrado para actualizar' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updatedGame = updatedGames[0];

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: updatedGame,
        message: 'Juego actualizado exitosamente'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const DELETE: APIRoute = async ({ request }) => {
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

    // Obtener el ID del juego de los parámetros de consulta
    const url = new URL(request.url);
    const gameId = url.searchParams.get('id');
    
    if (!gameId) {
      return new Response(
        JSON.stringify({ error: 'ID del juego es requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que el juego existe
    const { data: existingGame, error: fetchError } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .eq('is_active', true)
      .single();

    if (fetchError || !existingGame) {
      return new Response(
        JSON.stringify({ error: 'Juego no encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Eliminar imagen del bucket si existe (usar URL completa para resolver el path)
    if (existingGame.cover_image_url && existingGame.cover_image_url.includes('supabase')) {
      try {
        await deleteGameImage(existingGame.cover_image_url);
      } catch (imageError) {
        // Continuar con la eliminación del juego aunque falle la eliminación de la imagen
      }
    }

    // Marcar el juego como inactivo (soft delete)
    const { error: deleteError } = await supabase
      .from('games')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', gameId);

    if (deleteError) {
      return new Response(
        JSON.stringify({ error: 'Error al eliminar el juego' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Juego eliminado exitosamente'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};