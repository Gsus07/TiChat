import { supabase } from './supabaseClient';

export interface UserFavoriteGame {
  id: string;
  user_id: string;
  game_id: string;
  created_at: string;
}

export interface FavoriteGameWithDetails {
  id: string;
  user_id: string;
  game_id: string;
  created_at: string;
  games: {
    id: string;
    name: string;
    description?: string;
    cover_image_url?: string;
    genre?: string;
    release_date?: string;
    developer?: string;
    is_active: boolean;
  };
}

// Funciones para manejar juegos favoritos
export async function addFavoriteGame(userId: string, gameId: string) {
  try {
    // Verificar si ya existe en favoritos
    const { data: existingFavorite, error: checkError } = await supabase
      .from('user_favorite_games')
      .select('id')
      .eq('user_id', userId)
      .eq('game_id', gameId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingFavorite) {
      return { data: null, error: { message: 'Game is already in favorites' } };
    }

    // Agregar a favoritos
    const { data, error } = await supabase
      .from('user_favorite_games')
      .insert([{ user_id: userId, game_id: gameId }])
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error adding favorite game:', error);
    return { data: null, error };
  }
}

export async function removeFavoriteGame(userId: string, gameId: string) {
  try {
    const { data, error } = await supabase
      .from('user_favorite_games')
      .delete()
      .eq('user_id', userId)
      .eq('game_id', gameId)
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error removing favorite game:', error);
    return { data: null, error };
  }
}

export async function getUserFavoriteGames(userId: string) {
  try {
    const { data: favorites, error } = await supabase
      .from('user_favorite_games')
      .select(`
        *,
        games(*)
      `)
      .eq('user_id', userId)
      .eq('games.is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { data: favorites as FavoriteGameWithDetails[] || [], error: null };
  } catch (error) {
    console.error('Error fetching favorite games:', error);
    return { data: null, error };
  }
}

export async function isGameFavorite(userId: string, gameId: string) {
  try {
    const { data, error } = await supabase
      .from('user_favorite_games')
      .select('id')
      .eq('user_id', userId)
      .eq('game_id', gameId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return { data: !!data, error: null };
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return { data: false, error };
  }
}

export async function toggleFavoriteGame(userId: string, gameId: string) {
  try {
    const { data: isFavorite } = await isGameFavorite(userId, gameId);
    
    if (isFavorite) {
      const result = await removeFavoriteGame(userId, gameId);
      return { data: { is_favorite: false }, error: result.error };
    } else {
      const result = await addFavoriteGame(userId, gameId);
      return { data: { is_favorite: true }, error: result.error };
    }
  } catch (error) {
    console.error('Error toggling favorite game:', error);
    return { data: null, error };
  }
}

export async function getFavoriteGamesByGenre(userId: string, genre: string) {
  try {
    const { data: favorites, error } = await supabase
      .from('user_favorite_games')
      .select(`
        *,
        games(*)
      `)
      .eq('user_id', userId)
      .eq('games.genre', genre)
      .eq('games.is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { data: favorites as FavoriteGameWithDetails[] || [], error: null };
  } catch (error) {
    console.error('Error fetching favorite games by genre:', error);
    return { data: null, error };
  }
}

export async function getMostFavoritedGames(limit = 10) {
  try {
    const { data: games, error } = await supabase
      .from('games')
      .select(`
        *,
        user_favorite_games(count)
      `)
      .eq('is_active', true)
      .order('user_favorite_games.count', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return { data: games || [], error: null };
  } catch (error) {
    console.error('Error fetching most favorited games:', error);
    return { data: null, error };
  }
}

// Funciones para estadísticas de servidores
export async function getServerStats(serverId: string) {
  try {
    // Obtener estadísticas básicas del servidor
    const { data: server, error: serverError } = await supabase
      .from('game_servers')
      .select('*')
      .eq('id', serverId)
      .single();
    
    if (serverError) throw serverError;
    
    if (!server) {
      return { data: null, error: { message: 'Server not found' } };
    }

    // Obtener conteos de posts y usuarios activos
    const [postsResult, usersResult] = await Promise.all([
      supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('server_id', serverId)
        .eq('is_active', true),
      supabase
        .from('posts')
        .select('user_id')
        .eq('server_id', serverId)
        .eq('is_active', true)
    ]);

    // Contar usuarios únicos
    const uniqueUsers = new Set(usersResult.data?.map(post => post.user_id) || []);
    
    // Obtener posts recientes para calcular actividad
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const { data: recentPosts, error: recentError } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('server_id', serverId)
      .eq('is_active', true)
      .gte('created_at', oneWeekAgo.toISOString());
    
    if (recentError) throw recentError;

    const stats = {
      server_id: serverId,
      total_posts: (postsResult as any).count || 0,
      active_users: uniqueUsers.size,
      recent_posts_week: (recentPosts as any)?.count || 0,
      last_activity: server.last_activity || server.updated_at,
      status: server.status || 'unknown',
      player_count: server.current_players || 0,
      max_players: server.max_players || 0,
      ping: server.ping || null
    };

    return { data: stats, error: null };
  } catch (error) {
    console.error('Error fetching server stats:', error);
    return { data: null, error };
  }
}

export async function updateServerActivity(serverId: string) {
  try {
    const { data, error } = await supabase
      .from('game_servers')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', serverId)
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating server activity:', error);
    return { data: null, error };
  }
}

export async function getTopServersByActivity(gameId?: string, limit = 10) {
  try {
    let query = supabase
      .from('game_servers')
      .select(`
        *,
        games(name, cover_image_url)
      `)
      .eq('is_active', true)
      .order('last_activity', { ascending: false })
      .limit(limit);
    
    if (gameId) {
      query = query.eq('game_id', gameId);
    }

    const { data: servers, error } = await query;
    
    if (error) throw error;
    
    // Agregar estadísticas para cada servidor
    const serversWithStats = await Promise.all(
      (servers || []).map(async (server) => {
        const stats = await getServerStats(server.id);
        return {
          ...server,
          stats: stats.data
        };
      })
    );
    
    return { data: serversWithStats, error: null };
  } catch (error) {
    console.error('Error fetching top servers:', error);
    return { data: null, error };
  }
}

export async function getServersByPopularity(gameId?: string, limit = 10) {
  try {
    let query = supabase
      .from('game_servers')
      .select(`
        *,
        games(name, cover_image_url)
      `)
      .eq('is_active', true)
      .order('current_players', { ascending: false })
      .limit(limit);
    
    if (gameId) {
      query = query.eq('game_id', gameId);
    }

    const { data: servers, error } = await query;
    
    if (error) throw error;
    return { data: servers || [], error: null };
  } catch (error) {
    console.error('Error fetching servers by popularity:', error);
    return { data: null, error };
  }
}