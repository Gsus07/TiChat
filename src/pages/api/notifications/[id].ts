import type { APIRoute } from 'astro';
import { supabase } from '../../../utils/supabaseClient';

export const PATCH: APIRoute = async ({ params, request, cookies }) => {
  try {
    const { id } = params;
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID de notificación requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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
    const { read } = body;

    // Actualizar notificación
    const { data: notification, error } = await supabase
      .from('notifications')
      .update({ read })
      .eq('id', id)
      .eq('user_id', user.id) // Asegurar que solo el propietario pueda modificar
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar notificación:', error);
      return new Response(JSON.stringify({ error: 'Error al actualizar notificación' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!notification) {
      return new Response(JSON.stringify({ error: 'Notificación no encontrada' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ notification }), {
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

export const DELETE: APIRoute = async ({ params, cookies }) => {
  try {
    const { id } = params;
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID de notificación requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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

    // Eliminar notificación
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // Asegurar que solo el propietario pueda eliminar

    if (error) {
      console.error('Error al eliminar notificación:', error);
      return new Response(JSON.stringify({ error: 'Error al eliminar notificación' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
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