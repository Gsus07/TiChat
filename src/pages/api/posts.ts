import type { APIRoute } from 'astro';
import { getPostsByServerId, getPostsByGameId, createPost } from '../../utils/posts';
import { supabase } from '../../utils/supabaseClient';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const serverId = url.searchParams.get('serverId');
    const gameId = url.searchParams.get('gameId');
    const userId = url.searchParams.get('userId');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let result;
    
    if (serverId) {
      result = await getPostsByServerId(serverId, userId || undefined, limit, offset);
    } else if (gameId) {
      result = await getPostsByGameId(gameId, userId || undefined, limit, offset);
    } else {
      return new Response(JSON.stringify({ error: 'serverId or gameId is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    if (result.error) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    return new Response(JSON.stringify({ posts: result.data || [] }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('POST /api/posts - Iniciando...');
    
    // Obtener el token de autorización
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Error: Token de autorización faltante');
      return new Response(JSON.stringify({ error: 'Token de autorización requerido' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token obtenido, verificando usuario...');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log('Error de autenticación:', authError);
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Usuario autenticado:', user.id);

    // Obtener datos del post del cuerpo de la petición
    const postData = await request.json();
    console.log('Datos del post recibidos:', postData);
    
    // Validar datos requeridos
    if (!postData.title || !postData.content || !postData.game_id || !postData.post_type) {
      const missingFields = [];
      if (!postData.title) missingFields.push('title');
      if (!postData.content) missingFields.push('content');
      if (!postData.game_id) missingFields.push('game_id');
      if (!postData.post_type) missingFields.push('post_type');
      
      return new Response(JSON.stringify({ 
        error: `Campos requeridos faltantes: ${missingFields.join(', ')}` 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar que el juego existe
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id')
      .eq('id', postData.game_id)
      .single();

    if (gameError || !game) {
      return new Response(JSON.stringify({ error: 'Juego no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar que el servidor existe (si se especifica)
    if (postData.server_id) {
      const { data: server, error: serverError } = await supabase
        .from('game_servers')
        .select('id')
        .eq('id', postData.server_id)
        .eq('game_id', postData.game_id)
        .single();

      if (serverError || !server) {
        return new Response(JSON.stringify({ error: 'Servidor no encontrado' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Crear el post
    const newPost = {
      user_id: user.id,
      game_id: postData.game_id,
      server_id: postData.server_id || null,
      title: postData.title.trim(),
      content: postData.content.trim(),
      post_type: postData.post_type,
      image_url: postData.image_url || null,
      video_url: postData.video_url || null,
      is_active: true
    };

    console.log('Creando post con datos:', newPost);
    
    // Insertar directamente en Supabase para debug
    const { data, error } = await supabase
      .from('posts')
      .insert([newPost])
      .select()
      .single();
    
    console.log('Resultado de inserción directa:', { data, error });
    
    if (error) {
      console.log('Error al crear post:', error);
      return new Response(JSON.stringify({ error: 'Error al crear la publicación', details: error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      data: data 
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error en POST /api/posts:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};