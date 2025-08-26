import type { APIRoute } from 'astro';
import { toggleCommentLike } from '../../../../utils/posts';
import { supabase } from '../../../../utils/supabaseClient';

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Comment ID is required' }),
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

    // Verificar que el comentario existe
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('id')
      .eq('id', id)
      .eq('is_active', true)
      .single();
    
    if (commentError || !comment) {
      return new Response(
        JSON.stringify({ error: 'Comment not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Toggle del like
    const { data, error } = await toggleCommentLike(id, user.id);
    
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
    console.error('Error in comment like API:', error);
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
        JSON.stringify({ error: 'Comment ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener conteo de likes del comentario
    const { count, error } = await supabase
      .from('comment_likes')
      .select('id', { count: 'exact', head: true })
      .eq('comment_id', id);
    
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
          .from('comment_likes')
          .select('id')
          .eq('comment_id', id)
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
    console.error('Error in comment like count API:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};