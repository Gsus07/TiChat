import type { APIRoute } from 'astro';
import { supabase } from '../../utils/supabaseClient';
import { createGame } from '../../utils/games';

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
      is_active: true,
      theme_config: gameData.theme_config || {}
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