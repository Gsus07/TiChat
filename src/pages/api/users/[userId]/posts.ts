import type { APIRoute } from 'astro';
import { getPostsByUserId } from '../../../../utils/posts';
import { supabase } from '../../../../utils/supabaseClient';

export const GET: APIRoute = async ({ params, request }) => {
  try {
    const userId = params.userId;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Obtener usuario autenticado para calcular "user_has_liked"; opcional
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id;

    // Corregir orden de parámetros: (userId, currentUserId?, limit, offset)
    const result = await getPostsByUserId(userId, currentUserId || undefined, limit, offset);
    if (result.error) {
      return new Response(JSON.stringify({ error: 'Failed to load posts' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ data: result.data || [] }), {
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