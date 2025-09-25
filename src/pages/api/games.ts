import type { APIRoute } from 'astro';
import { supabase } from '../../utils/supabaseClient';
import { createGame } from '../../utils/games';
import { deleteGameImage } from '../../utils/imageUpload';

export const GET: APIRoute = async ({ request }) => {
  try {
    console.log('🎮 API /api/games - Recibiendo petición GET');
    
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
        console.error('❌ Error obteniendo juego por nombre:', error);
        return new Response(
          JSON.stringify({ error: 'Error al obtener juego' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('✅ Juego encontrado por nombre:', data.name);
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
        console.error('❌ Error obteniendo juego por ID:', error);
        return new Response(
          JSON.stringify({ error: 'Error al obtener juego' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('✅ Juego encontrado por ID:', data.name);
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
      console.error('❌ Error obteniendo juegos:', error);
      return new Response(
        JSON.stringify({ error: 'Error al obtener juegos' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`✅ ${data?.length || 0} juegos obtenidos`);
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: data || [],
        count: data?.length || 0
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('💥 Error en API /api/games:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('🎮 API /api/games - Recibiendo petición POST');
    
    // Obtener el token de autorización
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Token de autorización faltante');
      return new Response(
        JSON.stringify({ error: 'Token de autorización requerido' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.substring(7);
    
    // Verificar el token con Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('❌ Token inválido o expirado:', authError);
      return new Response(
        JSON.stringify({ error: 'Token inválido o expirado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Usuario autenticado:', user.id);

    // Obtener datos del juego del cuerpo de la petición
    const gameData = await request.json();
    console.log('📊 Datos del juego recibidos:', gameData);
    
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

    console.log('🎯 Creando juego con datos:', newGameData);

    // Crear el juego
    const { data: createdGame, error: createError } = await createGame(newGameData);

    if (createError) {
      console.error('❌ Error creando juego:', createError);
      return new Response(
        JSON.stringify({ error: 'Error al crear el juego' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎉 Juego creado exitosamente:', createdGame.name);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: createdGame,
        message: 'Juego creado exitosamente'
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('💥 Error en API POST /api/games:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    console.log('🎮 API /api/games - Recibiendo petición PUT');
    
    // Obtener el token de autorización
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Token de autorización faltante');
      return new Response(
        JSON.stringify({ error: 'Token de autorización requerido' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.substring(7);
    
    // Verificar el token con Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('❌ Token inválido o expirado:', authError);
      return new Response(
        JSON.stringify({ error: 'Token inválido o expirado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Usuario autenticado:', user.id);

    // Obtener datos del juego del cuerpo de la petición
    const gameData = await request.json();
    console.log('📊 Datos del juego para actualizar:', JSON.stringify(gameData, null, 2));
    
    // Validar que se proporcione el ID
    if (!gameData.id) {
      return new Response(
        JSON.stringify({ error: 'ID del juego es requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que el juego existe
    console.log('🔍 Buscando juego con ID:', gameData.id);
    const { data: existingGame, error: fetchError } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameData.id)
      .eq('is_active', true)
      .single();

    console.log('📋 Resultado de búsqueda:', { existingGame, fetchError });

    if (fetchError || !existingGame) {
      console.error('❌ Juego no encontrado en verificación inicial:', { fetchError, gameId: gameData.id });
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

    console.log('🎯 Actualizando juego con datos:', JSON.stringify(updateData, null, 2));
    console.log('🔍 ID del juego a actualizar:', gameData.id);

    // Actualizar el juego
    const { data: updatedGames, error: updateError } = await supabase
      .from('games')
      .update(updateData)
      .eq('id', gameData.id)
      .eq('is_active', true)
      .select();

    if (updateError) {
      console.error('❌ Error actualizando juego:', JSON.stringify(updateError, null, 2));
      return new Response(
        JSON.stringify({ error: 'Error al actualizar el juego', details: updateError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('📊 Resultado de actualización:', { updatedGames, count: updatedGames?.length });

    if (!updatedGames || updatedGames.length === 0) {
      console.error('❌ No se encontró el juego para actualizar');
      console.error('🔍 Verificando si el juego existe sin filtro is_active...');
      
      // Verificación adicional sin filtro is_active para diagnóstico
      const { data: gameCheck } = await supabase
        .from('games')
        .select('id, name, is_active')
        .eq('id', gameData.id);
      
      console.log('🔍 Verificación sin filtro is_active:', gameCheck);
      
      return new Response(
        JSON.stringify({ error: 'Juego no encontrado para actualizar' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updatedGame = updatedGames[0];

    console.log('🎉 Juego actualizado exitosamente:', updatedGame.name);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: updatedGame,
        message: 'Juego actualizado exitosamente'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('💥 Error en API PUT /api/games:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    console.log('🎮 API /api/games - Recibiendo petición DELETE');
    
    // Obtener el token de autorización
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Token de autorización faltante');
      return new Response(
        JSON.stringify({ error: 'Token de autorización requerido' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.substring(7);
    
    // Verificar el token con Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('❌ Token inválido o expirado:', authError);
      return new Response(
        JSON.stringify({ error: 'Token inválido o expirado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Usuario autenticado:', user.id);

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

    console.log('🎯 Eliminando juego:', existingGame.name);

    // Eliminar imagen del bucket si existe
    if (existingGame.cover_image_url && existingGame.cover_image_url.includes('supabase')) {
      try {
        const urlParts = existingGame.cover_image_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        await deleteGameImage(fileName);
        console.log('🗑️ Imagen eliminada del bucket:', fileName);
      } catch (imageError) {
        console.warn('⚠️ Error eliminando imagen del bucket:', imageError);
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
      console.error('❌ Error eliminando juego:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Error al eliminar el juego' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎉 Juego eliminado exitosamente:', existingGame.name);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Juego eliminado exitosamente'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('💥 Error en API DELETE /api/games:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};