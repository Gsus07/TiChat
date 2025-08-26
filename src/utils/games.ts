import { supabase } from './supabaseClient';

export interface Game {
  id: string;
  name: string;
  description?: string;
  genre?: string;
  platform?: string;
  release_date?: string;
  cover_image_url?: string;
  is_active: boolean;
  created_at: string;
  has_servers: boolean;
}

export interface GameServer {
  id: string;
  game_id: string;
  name: string;
  description?: string;
  server_ip?: string;
  server_port?: number;
  server_version?: string;
  max_players: number;
  server_type: 'survival' | 'creative' | 'pvp' | 'roleplay' | 'minigames' | 'custom';
  is_active: boolean;
  is_featured: boolean;
  owner_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ServerStats {
  id: string;
  server_id: string;
  online_players: number;
  total_posts: number;
  total_members: number;
  last_updated: string;
}

// Funciones para manejar juegos
export async function getAllGames() {
  try {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching games:', error);
    return { data: null, error };
  }
}

export async function getGameById(id: string) {
  try {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching game:', error);
    return { data: null, error };
  }
}

export async function getGameByName(name: string) {
  try {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('name', name)
      .eq('is_active', true)
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching game by name:', error);
    return { data: null, error };
  }
}

export async function createGame(gameData: Omit<Game, 'id' | 'created_at'>) {
  try {
    const { data, error } = await supabase
      .from('games')
      .insert([gameData])
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating game:', error);
    return { data: null, error };
  }
}

export async function updateGame(id: string, gameData: Partial<Game>) {
  try {
    const { data, error } = await supabase
      .from('games')
      .update({ ...gameData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating game:', error);
    return { data: null, error };
  }
}

export async function deleteGame(id: string) {
  try {
    const { data, error } = await supabase
      .from('games')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error deleting game:', error);
    return { data: null, error };
  }
}

// Funciones para manejar servidores de juegos
export async function getServersByGameId(gameId: string) {
  try {
    const { data, error } = await supabase
      .from('game_servers')
      .select(`
        *,
        server_stats(*),
        profiles:owner_id(username, full_name)
      `)
      .eq('game_id', gameId)
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching servers:', error);
    return { data: null, error };
  }
}

export async function getServerById(id: string) {
  try {
    const { data, error } = await supabase
      .from('game_servers')
      .select(`
        *,
        games(*),
        server_stats(*),
        profiles:owner_id(username, full_name, avatar_url)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching server:', error);
    return { data: null, error };
  }
}

export async function createServer(serverData: Omit<GameServer, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('game_servers')
      .insert([serverData])
      .select()
      .single();
    
    if (error) throw error;
    
    // Crear estadísticas iniciales del servidor
    if (data) {
      await supabase
        .from('server_stats')
        .insert([{
          server_id: data.id,
          online_players: 0,
          total_posts: 0,
          total_members: 0
        }]);
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error creating server:', error);
    return { data: null, error };
  }
}

export async function updateServer(id: string, serverData: Partial<GameServer>) {
  try {
    const { data, error } = await supabase
      .from('game_servers')
      .update({ ...serverData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating server:', error);
    return { data: null, error };
  }
}

export async function deleteServer(id: string) {
  try {
    const { data, error } = await supabase
      .from('game_servers')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error deleting server:', error);
    return { data: null, error };
  }
}

// Funciones para estadísticas de servidores
export async function getServerStats(serverId: string) {
  try {
    const { data, error } = await supabase
      .from('server_stats')
      .select('*')
      .eq('server_id', serverId)
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching server stats:', error);
    return { data: null, error };
  }
}

export async function updateServerStats(serverId: string, stats: Partial<ServerStats>) {
  try {
    const { data, error } = await supabase
      .from('server_stats')
      .update({ ...stats, last_updated: new Date().toISOString() })
      .eq('server_id', serverId)
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating server stats:', error);
    return { data: null, error };
  }
}

// Función para obtener juegos favoritos del usuario
export async function getUserFavoriteGames(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_favorite_games')
      .select(`
        *,
        games(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching favorite games:', error);
    return { data: null, error };
  }
}

export async function addFavoriteGame(userId: string, gameId: string) {
  try {
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

// Función para obtener servidor por nombre
export async function getServerByName(serverName: string) {
  try {
    const { data, error } = await supabase
      .from('game_servers')
      .select('*')
      .eq('name', serverName)
      .eq('is_active', true)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No se encontró el servidor
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error getting server by name:', error);
    return null;
  }
}