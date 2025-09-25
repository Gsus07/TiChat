import type { APIRoute } from 'astro';
import { supabase } from '../../../../utils/supabaseClient';
import { getPostById, deletePost } from '../../../../utils/posts';

export const GET: APIRoute = async ({ params }) => {
  try {
    const postId = params.id;
    
    if (!postId) {
      return new Response(JSON.stringify({ error: 'ID de post requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const post = await getPostById(postId);
    
    if (!post) {
      return new Response(JSON.stringify({ error: 'Post no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify(post), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
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

    // Verificar que el post existe y pertenece al usuario
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, user_id')
      .eq('id', postId)
      .eq('is_active', true)
      .single();

    if (postError || !post) {
      return new Response(JSON.stringify({ error: 'Post no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar que el usuario es el propietario del post
    if (post.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'No tienes permisos para eliminar este post' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await deletePost(postId);
    
    return new Response(JSON.stringify({ message: 'Post eliminado correctamente' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};