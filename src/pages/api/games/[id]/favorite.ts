import type { APIRoute } from 'astro';
import { toggleFavoriteGame } from '../../../../utils/favorites';
import { supabase } from '../../../../utils/supabaseClient';

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Game ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener el token de autorización
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authorization token required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.substring(7);
    
    // Verificar el token con Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que el juego existe
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id')
      .eq('id', id)
      .eq('is_active', true)
      .single();
    
    if (gameError || !game) {
      return new Response(
        JSON.stringify({ error: 'Game not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Toggle del favorito
    const { data, error } = await toggleFavoriteGame(user.id, id);
    
    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to toggle favorite' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, is_favorite: data?.is_favorite }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in favorite API:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const GET: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Game ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar si el usuario actual tiene este juego en favoritos (si está autenticado)
    let isFavorite = false;
    const authHeader = request.headers.get('authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        const { data: favorite } = await supabase
          .from('user_favorite_games')
          .select('id')
          .eq('game_id', id)
          .eq('user_id', user.id)
          .single();
        
        isFavorite = !!favorite;
      }
    }

    // Obtener conteo total de usuarios que tienen este juego en favoritos
    const { count: favoriteCount } = await supabase
      .from('user_favorite_games')
      .select('id', { count: 'exact', head: true })
      .eq('game_id', id);

    return new Response(
      JSON.stringify({ 
        is_favorite: isFavorite,
        favorite_count: favoriteCount || 0
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in favorite status API:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};