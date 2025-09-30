import type { APIRoute } from 'astro';
import { supabase } from '../../../utils/supabaseClient';

export const POST: APIRoute = async ({ cookies }) => {
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

    // Marcar todas las notificaciones como leídas
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (error) {
      console.error('Error al marcar notificaciones como leídas:', error);
      return new Response(JSON.stringify({ error: 'Error al actualizar notificaciones' }), {
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