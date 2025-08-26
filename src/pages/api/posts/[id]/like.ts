import type { APIRoute } from 'astro';
import { togglePostLike } from '../../../../utils/posts';
import { supabase } from '../../../../utils/supabaseClient';

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Post ID is required' }),
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

    // Verificar que el post existe
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', id)
      .eq('is_active', true)
      .single();
    
    if (postError || !post) {
      return new Response(
        JSON.stringify({ error: 'Post not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Toggle del like
    const { data, error } = await togglePostLike(id, user.id);
    
    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to toggle like' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, liked: data?.liked }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in like API:', error);
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
        JSON.stringify({ error: 'Post ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener conteo de likes del post
    const { count, error } = await supabase
      .from('post_likes')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', id);
    
    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to get like count' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar si el usuario actual ha dado like (si está autenticado)
    let userHasLiked = false;
    const authHeader = request.headers.get('authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        const { data: userLike } = await supabase
          .from('post_likes')
          .select('id')
          .eq('post_id', id)
          .eq('user_id', user.id)
          .single();
        
        userHasLiked = !!userLike;
      }
    }

    return new Response(
      JSON.stringify({ 
        like_count: count || 0,
        user_has_liked: userHasLiked
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in like count API:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};