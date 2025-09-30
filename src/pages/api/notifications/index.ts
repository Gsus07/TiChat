import type { APIRoute } from 'astro';
import { supabase } from '../../../utils/supabaseClient';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Obtener el token de autenticación
    const authToken = cookies.get('sb-access-token')?.value;
    
    if (!authToken) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar el usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser(authToken);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener parámetros de consulta
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const unreadOnly = url.searchParams.get('unread_only') === 'true';
    const offset = (page - 1) * limit;

    // Construir consulta
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error al obtener notificaciones:', error);
      return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener conteo total de notificaciones no leídas
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);

    return new Response(JSON.stringify({
      notifications,
      unreadCount: unreadCount || 0,
      page,
      limit,
      hasMore: notifications.length === limit
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error en API de notificaciones:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Obtener el token de autenticación
    const authToken = cookies.get('sb-access-token')?.value;
    
    if (!authToken) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar el usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser(authToken);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { title, message, type = 'info', data = {} } = body;

    if (!title || !message) {
      return new Response(JSON.stringify({ error: 'Título y mensaje son requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Crear nueva notificación
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        title,
        message,
        type,
        data
      })
      .select()
      .single();

    if (error) {
      console.error('Error al crear notificación:', error);
      return new Response(JSON.stringify({ error: 'Error al crear notificación' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ notification }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error en API de notificaciones:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};