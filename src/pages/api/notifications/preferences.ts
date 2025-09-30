import type { APIRoute } from 'astro';
import { supabase } from '../../../utils/supabaseClient';

export const GET: APIRoute = async ({ cookies }) => {
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

    // Obtener preferencias del usuario
    let { data: preferences, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // No existe registro, crear uno por defecto
      const { data: newPreferences, error: insertError } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: user.id,
          email_notifications: true,
          push_notifications: true,
          new_posts: true,
          new_servers: true,
          new_games: false,
          follows: true
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error al crear preferencias:', insertError);
        return new Response(JSON.stringify({ error: 'Error al crear preferencias' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      preferences = newPreferences;
    } else if (error) {
      console.error('Error al obtener preferencias:', error);
      return new Response(JSON.stringify({ error: 'Error al obtener preferencias' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ preferences }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error en API de preferencias:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const PUT: APIRoute = async ({ request, cookies }) => {
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
    const {
      email_notifications,
      push_notifications,
      new_posts,
      new_servers,
      new_games,
      follows
    } = body;

    // Actualizar preferencias
    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: user.id,
        email_notifications,
        push_notifications,
        new_posts,
        new_servers,
        new_games,
        follows
      })
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar preferencias:', error);
      return new Response(JSON.stringify({ error: 'Error al actualizar preferencias' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ preferences }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error en API de preferencias:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};