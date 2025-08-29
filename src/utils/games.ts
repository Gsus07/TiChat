import { supabase } from './supabaseClient';

export interface ThemeConfig {
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: {
      from?: string;
      to?: string;
    };
  };
  typography?: {
    fontFamily?: string;
    titleSize?: string;
    bodySize?: string;
  };
  images?: {
    hero?: string;
    icon?: string;
    background?: string;
  };
  layout?: {
    hasServers?: boolean;
    showStats?: boolean;
    enableCustomServers?: boolean;
  };
}

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
  theme_config?: ThemeConfig;
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
  theme_config?: ThemeConfig;
}

export interface ServerStats {
  id: string;
  server_id: string;
  online_players: number;
  total_posts: number;
  total_members: number;
  last_updated: string;
}

export interface UserProfile {
  username: string;
  full_name?: string;
  avatar_url?: string;
}

// Extended interface for GameServer with joined data
export interface GameServerWithJoins extends GameServer {
  games?: Game;
  server_stats?: ServerStats[];
  profiles?: UserProfile;
  image?: string; // For backward compatibility
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
      .eq('is_active', true);
    
    if (error) {
      console.error('Error fetching game by name:', error);
      return { data: null, error };
    }
    
    if (!data || data.length === 0) {
      console.log(`Game '${name}' not found`);
      return { data: null, error: null };
    }
    
    return { data: data[0], error: null };
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

export async function getServerById(id: string): Promise<{ data: GameServerWithJoins | null; error: any }> {
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
    console.log('🚀 Iniciando creación de servidor:', serverData);
    
    // Validar datos requeridos
    if (!serverData.name || !serverData.game_id || !serverData.owner_id) {
      const missingFields = [];
      if (!serverData.name) missingFields.push('name');
      if (!serverData.game_id) missingFields.push('game_id');
      if (!serverData.owner_id) missingFields.push('owner_id');
      
      const errorMsg = `Campos requeridos faltantes: ${missingFields.join(', ')}`;
      console.error('❌ Error de validación:', errorMsg);
      throw new Error(errorMsg);
    }
    
    console.log('✅ Validación de datos completada');
    
    const { data, error } = await supabase
      .from('game_servers')
      .insert([serverData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error insertando servidor en BD:', error);
      throw error;
    }
    
    console.log('✅ Servidor creado exitosamente:', data.id);
    
    // Crear estadísticas iniciales del servidor
    if (data) {
      console.log('📊 Creando estadísticas iniciales del servidor...');
      
      const { error: statsError } = await supabase
        .from('server_stats')
        .insert([{
          server_id: data.id,
          online_players: 0,
          total_posts: 0,
          total_members: 0
        }]);
      
      if (statsError) {
        console.error('⚠️ Error creando estadísticas del servidor:', statsError);
        // No fallar la creación del servidor por esto
      } else {
        console.log('✅ Estadísticas del servidor creadas');
      }
    }
    
    console.log('🎉 Creación de servidor completada exitosamente');
    return { data, error: null };
  } catch (error) {
    console.error('💥 Error crítico creando servidor:', error);
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
export async function getServerByName(serverName: string, gameId: string): Promise<{ data: GameServer | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('game_servers')
      .select('*')
      .eq('name', serverName)
      .eq('game_id', gameId)
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getServerWithTheme(serverName: string, gameId: string): Promise<{ data: GameServer | null; error: any }> {
  try {
    const { data: server, error } = await supabase
      .from('game_servers')
      .select('*')
      .eq('name', serverName)
      .eq('game_id', gameId)
      .single();

    if (error) return { data: null, error };
    if (!server) return { data: null, error: 'Server not found' };

    // Obtener el tema del juego
    const { data: game } = await getGameById(gameId);
    const gameTheme = game?.theme_config || {};

    // Combinar temas: default -> game -> server
    const defaultTheme = getDefaultThemeConfig();
    const combinedTheme = mergeThemeConfigs(
      mergeThemeConfigs(defaultTheme, gameTheme),
      server.theme_config || {}
    );

    return {
      data: {
        ...server,
        theme_config: combinedTheme
      },
      error: null
    };
  } catch (error) {
    return { data: null, error };
  }
}

// Funciones para manejar configuraciones de tema
export function getDefaultThemeConfig(): ThemeConfig {
  return {
    colors: {
      primary: '#3B82F6',
      secondary: '#1D4ED8',
      accent: '#60A5FA',
      background: {
        from: 'blue-900',
        to: 'indigo-900'
      }
    },
    typography: {
      fontFamily: 'Inter',
      titleSize: 'text-4xl',
      bodySize: 'text-base'
    },
    images: {
      hero: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=600&fit=crop',
      icon: '/default-game.svg',
      background: '/default-bg.jpg'
    },
    layout: {
      hasServers: false,
      showStats: true,
      enableCustomServers: false
    }
  };
}

export function mergeThemeConfigs(baseTheme: ThemeConfig, overrideTheme: ThemeConfig): ThemeConfig {
  return {
    colors: {
      ...baseTheme.colors,
      ...overrideTheme.colors,
      background: {
        ...baseTheme.colors?.background,
        ...overrideTheme.colors?.background
      }
    },
    typography: {
      ...baseTheme.typography,
      ...overrideTheme.typography
    },
    images: {
      ...baseTheme.images,
      ...overrideTheme.images
    },
    layout: {
      ...baseTheme.layout,
      ...overrideTheme.layout
    }
  };
}

export function generateCSSVariables(themeConfig: ThemeConfig): string {
  const { colors, typography } = themeConfig;
  
  let cssVars = '';
  
  if (colors) {
    if (colors.primary) cssVars += `--color-primary: ${colors.primary}; `;
    if (colors.secondary) cssVars += `--color-secondary: ${colors.secondary}; `;
    if (colors.accent) cssVars += `--color-accent: ${colors.accent}; `;
    if (colors.background?.from) cssVars += `--bg-from: ${colors.background.from}; `;
    if (colors.background?.to) cssVars += `--bg-to: ${colors.background.to}; `;
  }
  
  if (typography) {
    if (typography.fontFamily) cssVars += `--font-family: ${typography.fontFamily}; `;
    if (typography.titleSize) cssVars += `--title-size: ${typography.titleSize}; `;
    if (typography.bodySize) cssVars += `--body-size: ${typography.bodySize}; `;
  }
  
  return cssVars;
}

export async function getGameWithTheme(gameName: string): Promise<{ data: Game | null; error: any }> {
  try {
    const { data: game, error } = await getGameByName(gameName);
    
    if (error) return { data: null, error };
    if (!game) return { data: null, error: 'Game not found' };

    // Combinar tema por defecto con el tema del juego
    const defaultTheme = getDefaultThemeConfig();
    const combinedTheme = mergeThemeConfigs(defaultTheme, game.theme_config || {});

    return {
      data: {
        ...game,
        theme_config: combinedTheme
      },
      error: null
    };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getGameWithThemeById(gameId: string): Promise<{ data: Game | null; error: any }> {
  try {
    const { data: game, error } = await getGameById(gameId);
    
    if (error) return { data: null, error };
    if (!game) return { data: null, error: 'Game not found' };

    // Combinar tema por defecto con el tema del juego
    const defaultTheme = getDefaultThemeConfig();
    const combinedTheme = mergeThemeConfigs(defaultTheme, game.theme_config || {});

    return {
      data: {
        ...game,
        theme_config: combinedTheme
      },
      error: null
    };
  } catch (error) {
    return { data: null, error };
  }
}

// Funciones para manejar slugs de servidor
export function createServerSlug(serverName: string): string {
  return serverName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .replace(/-+/g, '-') // Reemplazar múltiples guiones con uno solo
    .replace(/^-|-$/g, ''); // Remover guiones al inicio y final
}

export async function getServerBySlug(serverSlug: string, gameId: string): Promise<{ data: GameServerWithJoins | null; error: any }> {
  try {
    // Primero intentar buscar por slug exacto
    const { data: servers, error } = await supabase
      .from('game_servers')
      .select(`
        *,
        games(*),
        server_stats(*),
        profiles:owner_id(username, full_name, avatar_url)
      `)
      .eq('game_id', gameId)
      .eq('is_active', true);

    if (error) throw error;
    if (!servers || servers.length === 0) {
      return { data: null, error: 'No servers found' };
    }

    // Buscar el servidor cuyo nombre genere el slug solicitado
    const matchingServer = servers.find(server => 
      createServerSlug(server.name) === serverSlug
    );

    if (!matchingServer) {
      return { data: null, error: 'Server not found' };
    }

    return { data: matchingServer, error: null };
  } catch (error) {
    console.error('Error fetching server by slug:', error);
    return { data: null, error };
  }
}

export async function getServerBySlugWithTheme(serverSlug: string, gameId: string): Promise<{ data: GameServerWithJoins | null; error: any }> {
  try {
    const { data: server, error } = await getServerBySlug(serverSlug, gameId);
    
    if (error) return { data: null, error };
    if (!server) return { data: null, error: 'Server not found' };

    // Obtener el tema del juego
    const { data: game } = await getGameById(gameId);
    const gameTheme = game?.theme_config || {};

    // Combinar temas: default -> game -> server
    const defaultTheme = getDefaultThemeConfig();
    const combinedTheme = mergeThemeConfigs(
      mergeThemeConfigs(defaultTheme, gameTheme),
      server.theme_config || {}
    );

    return {
      data: {
        ...server,
        theme_config: combinedTheme
      },
      error: null
    };
  } catch (error) {
    return { data: null, error };
  }
}

// Función para verificar si un slug de servidor es único
export async function isServerSlugUnique(serverSlug: string, gameId: string, excludeServerId?: string): Promise<boolean> {
  try {
    const { data: servers, error } = await supabase
      .from('game_servers')
      .select('id, name')
      .eq('game_id', gameId)
      .eq('is_active', true);

    if (error) throw error;
    if (!servers) return true;

    // Verificar si algún servidor genera el mismo slug
    const conflictingServer = servers.find(server => {
      if (excludeServerId && server.id === excludeServerId) {
        return false; // Excluir el servidor actual al editar
      }
      return createServerSlug(server.name) === serverSlug;
    });

    return !conflictingServer;
  } catch (error) {
    console.error('Error checking server slug uniqueness:', error);
    return false;
  }
}