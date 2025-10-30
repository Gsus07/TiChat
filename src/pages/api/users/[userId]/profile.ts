import type { APIRoute } from 'astro';
import { supabase } from '../../../../utils/supabaseClient';

export const GET: APIRoute = async ({ params }) => {
  try {
    const { userId } = params;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('username, full_name, avatar_url, bio')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return new Response(JSON.stringify({ error: 'Error al obtener perfil' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!data) {
      return new Response(JSON.stringify({ error: 'Perfil no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};