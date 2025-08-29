import type { APIRoute } from 'astro';
import { supabase } from '../../../../utils/supabaseClient';
import { getCommentsByPostId, createComment } from '../../../../utils/posts';

export const GET: APIRoute = async ({ params, request }) => {
  try {
    const postId = params.id;
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!postId) {
      return new Response(JSON.stringify({ error: 'ID de post requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const comments = await getCommentsByPostId(postId, userId || undefined);
    
    return new Response(JSON.stringify(comments), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const postId = params.id;
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Token de autorización requerido' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!postId) {
      return new Response(JSON.stringify({ error: 'ID de post requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { content } = await request.json();
    
    if (!content || content.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Contenido del comentario requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar que el post existe
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', postId)
      .eq('is_active', true)
      .single();

    if (postError || !post) {
      return new Response(JSON.stringify({ error: 'Post no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const comment = await createComment({
      post_id: postId,
      user_id: user.id,
      content: content.trim(),
      is_active: true
    });
    
    return new Response(JSON.stringify(comment), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error al crear comentario:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};