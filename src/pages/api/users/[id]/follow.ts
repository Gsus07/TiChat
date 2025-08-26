import type { APIRoute } from 'astro';
import { followUser, unfollowUser, isFollowing } from '../../../../utils/follows';
import { supabase } from '../../../../utils/supabaseClient';

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener el token de autorización
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authorization token required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.substring(7);
    
    // Verificar el token con Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que el usuario a seguir existe
    const { data: targetUser, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', id)
      .single();
    
    if (userError || !targetUser) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar si ya está siguiendo al usuario
    const { data: isCurrentlyFollowing } = await isFollowing(user.id, id);
    
    let result;
    if (isCurrentlyFollowing) {
      // Dejar de seguir
      result = await unfollowUser(user.id, id);
    } else {
      // Seguir
      result = await followUser(user.id, id);
    }
    
    if (result.error) {
      return new Response(
        JSON.stringify({ error: 'Failed to update follow status' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        following: !isCurrentlyFollowing,
        message: isCurrentlyFollowing ? 'Unfollowed successfully' : 'Followed successfully'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in follow API:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const GET: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener conteos de seguidores y seguidos
    const [followerCountResult, followingCountResult] = await Promise.all([
      supabase
        .from('user_follows')
        .select('id', { count: 'exact', head: true })
        .eq('following_id', id),
      supabase
        .from('user_follows')
        .select('id', { count: 'exact', head: true })
        .eq('follower_id', id)
    ]);

    // Verificar si el usuario actual está siguiendo a este usuario (si está autenticado)
    let isFollowingUser = false;
    let isFollowedByUser = false;
    const authHeader = request.headers.get('authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user && user.id !== id) {
        const [followingResult, followedByResult] = await Promise.all([
          isFollowing(user.id, id),
          isFollowing(id, user.id)
        ]);
        
        isFollowingUser = followingResult.data || false;
        isFollowedByUser = followedByResult.data || false;
      }
    }

    return new Response(
      JSON.stringify({ 
        follower_count: followerCountResult.count || 0,
        following_count: followingCountResult.count || 0,
        is_following: isFollowingUser,
        is_followed_by: isFollowedByUser
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in follow status API:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};