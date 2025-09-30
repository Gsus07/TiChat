import type { APIRoute } from 'astro';
import { supabase } from '../../../utils/supabaseClient';

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
    const { token, device_type = 'web' } = body;

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token es requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Registrar o actualizar token
    const { data: pushToken, error } = await supabase
      .from('push_tokens')
      .upsert({
        user_id: user.id,
        token,
        device_type
      })
      .select()
      .single();

    if (error) {
      console.error('Error al registrar push token:', error);
      return new Response(JSON.stringify({ error: 'Error al registrar token' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ pushToken }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error en API de push token:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
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
    const { token } = body;

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token es requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Eliminar token
    const { error } = await supabase
      .from('push_tokens')
      .delete()
      .eq('user_id', user.id)
      .eq('token', token);

    if (error) {
      console.error('Error al eliminar push token:', error);
      return new Response(JSON.stringify({ error: 'Error al eliminar token' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error en API de push token:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};