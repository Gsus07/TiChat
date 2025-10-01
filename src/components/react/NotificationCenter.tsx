import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../utils/supabaseClient';

interface Post {
  id: string;
  title: string;
  content: string;
  user_id: string;
  game_id: string;
  server_id?: string;
  image_url?: string;
  created_at: string;
  profiles?: {
    username: string;
    full_name?: string;
    avatar_url?: string;
  } | {
    username: string;
    full_name?: string;
    avatar_url?: string;
  }[] | null;
  games?: {
    name: string;
  } | {
    name: string;
  }[] | null;
  game_servers?: {
    name: string;
  } | {
    name: string;
  }[] | null;
}

interface NotificationCenterProps {
  className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ className = '' }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Helper functions to safely extract data from Supabase responses
  const getProfile = (profiles: Post['profiles']) => {
    if (!profiles) return null;
    return Array.isArray(profiles) ? profiles[0] : profiles;
  };

  const getGame = (games: Post['games']) => {
    if (!games) return null;
    return Array.isArray(games) ? games[0] : games;
  };

  const getGameServer = (gameServers: Post['game_servers']) => {
    if (!gameServers) return null;
    return Array.isArray(gameServers) ? gameServers[0] : gameServers;
  };

  // Cargar publicaciones iniciales
  useEffect(() => {
    loadPosts();
    setupRealtimeSubscription();
    
    // Cleanup al desmontar
    return () => {
      supabase.removeAllChannels();
    };
  }, []);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadPosts = async (pageNum = 1, reset = true) => {
    try {
      setLoading(true);
      
      // Cargar las 10 publicaciones más recientes de todos los usuarios
      const limit = 10;
      const { data: recentPosts, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          content,
          user_id,
          game_id,
          server_id,
          image_url,
          created_at,
          profiles:user_id (
            username,
            full_name,
            avatar_url
          ),
          games:game_id (
            name
          ),
          game_servers:server_id (
            name
          )
        `)
        .order('created_at', { ascending: false })
        .range((pageNum - 1) * limit, pageNum * limit - 1);

      if (error) {
        throw error;
      }
      
      if (reset) {
        setPosts(recentPosts || []);
      } else {
        setPosts(prev => [...prev, ...(recentPosts || [])]);
      }
      
      setHasMore((recentPosts || []).length === limit);
      setPage(pageNum);
    } catch (error) {
      console.error('Error al cargar publicaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = async () => {
    try {
      // Suscribirse a TODAS las nuevas publicaciones (feed público)
      const channel = supabase
        .channel('posts_feed')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'posts'
          },
          async (payload) => {
            // Cargar el post completo con las relaciones
            const { data: newPost } = await supabase
              .from('posts')
              .select(`
                id,
                title,
                content,
                user_id,
                game_id,
                server_id,
                created_at,
                profiles:user_id (
                  username,
                  full_name,
                  avatar_url
                ),
                games:game_id (
                  name
                ),
                game_servers:server_id (
                  name
                )
              `)
              .eq('id', payload.new.id)
              .single();

            if (newPost) {
              setPosts(prev => [newPost, ...prev.slice(0, 9)]); // Mantener solo 10 posts
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error('Error al configurar suscripción en tiempo real:', error);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadPosts(page + 1, false);
    }
  };

  // Función para convertir nombres a slugs para URLs
  const createSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  // Función para navegar a la publicación
  const navigateToPost = (post: Post) => {
    const game = Array.isArray(post.games) ? post.games[0] : post.games;
    const gameServer = Array.isArray(post.game_servers) ? post.game_servers[0] : post.game_servers;
    
    if (!game?.name) return;
    
    const gameSlug = createSlug(game.name);
    
    // Si hay servidor, navegar a la página del servidor con el ID del post
    if (gameServer?.name) {
      const serverSlug = createSlug(gameServer.name);
      window.location.href = `/${gameSlug}/${serverSlug}#post-${post.id}`;
    } else {
      // Si no hay servidor, navegar a la página del juego con el ID del post
      window.location.href = `/${gameSlug}#post-${post.id}`;
    }
    
    // Cerrar el dropdown después de navegar
    setIsOpen(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Botón de campana elegante */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          requestNotificationPermission();
        }}
        className={`relative group flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${
          isOpen 
            ? 'notification-button-bg text-white shadow-theme-lg' 
            : 'bg-primary border border-primary text-secondary hover:notification-button-hover hover:text-white'
        } focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-primary`}
        aria-label="Centro de Notificaciones"
      >
        {/* Icono de campana mejorado */}
        <svg
          className={`w-5 h-5 transition-all duration-300 ${isOpen ? 'scale-110' : 'group-hover:scale-105'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      </button>

      {/* Dropdown de notificaciones mejorado */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-96 notification-bg rounded-2xl shadow-theme-xl notification-border z-50 max-h-[32rem] overflow-hidden glass">
          {/* Header elegante */}
          <div className="p-6 notification-header-bg border-b notification-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-calico-orange-500 dark:bg-calico-orange-600 rounded-xl">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary">Feed de Publicaciones</h3>
                  <p className="text-sm text-secondary">
                    {posts.length > 0 ? `${posts.length} publicaciones recientes` : 'No hay publicaciones'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => loadPosts(1, true)}
                  className="p-2 text-white hover:notification-button-hover rounded-lg transition-all duration-200"
                  style={{ backgroundColor: 'var(--notification-button-bg)' }}
                  title="Actualizar feed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Lista de publicaciones */}
          <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-border-accent scrollbar-track-transparent">
            {posts.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 notification-header-bg rounded-full flex items-center justify-center">
                  <svg
                    className="w-10 h-10"
                    style={{ color: 'var(--notification-button-bg)' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-primary mb-2">¡Todo al día!</h4>
                <p className="text-secondary">No hay publicaciones recientes</p>
              </div>
            ) : (
              <>
                {posts.map((post) => {
                  const profile = getProfile(post.profiles);
                  const game = getGame(post.games);
                  const gameServer = getGameServer(post.game_servers);
                  
                  return (
                    <div
                      key={post.id}
                      onClick={() => navigateToPost(post)}
                      className="group relative p-5 border-b border-secondary notification-bg hover:notification-hover transition-all duration-200 hover:border-l-4 hover:border-l-orange-500 cursor-pointer"
                    >
                      <div className="flex items-start space-x-4">
                        {/* Avatar del usuario */}
                          <div className="flex-shrink-0">
                            {profile?.avatar_url ? (
                              <img 
                                src={profile.avatar_url} 
                                alt={profile?.full_name || profile?.username || 'Usuario'}
                                className="w-10 h-10 rounded-full object-cover border-2 notification-avatar-border"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-calico-orange-400 to-calico-orange-600 dark:from-calico-orange-500 dark:to-calico-orange-700 flex items-center justify-center text-white font-semibold text-sm">
                                {(profile?.username || 'U').charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 pr-2">
                              {/* Información del autor */}
                              <div className="flex items-center space-x-2 mb-2">
                                <p className="text-sm font-semibold text-primary">
                                  {profile?.full_name || profile?.username || 'Usuario desconocido'}
                                </p>
                                <span className="text-xs text-muted">•</span>
                                <span className="text-xs text-muted font-medium">
                                  {formatTime(post.created_at)}
                                </span>
                              </div>
                              
                              {/* Título de la publicación */}
                              {post.title && (
                                <h4 className="text-sm font-semibold text-primary mb-2">
                                  {post.title}
                                </h4>
                              )}
                              
                              {/* Contenido de la publicación */}
                              {post.content && (
                                <div className="notification-content-bg rounded-lg p-3 border notification-border mb-3">
                                  <p className="text-sm text-secondary leading-relaxed line-clamp-3">
                                    {post.content}
                                  </p>
                                </div>
                              )}
                              
                              {/* Miniatura de imagen si existe */}
                              {post.image_url && (
                                <div className="mt-3 mb-3">
                                  <div className="relative w-full h-32 notification-content-bg rounded-lg overflow-hidden notification-border">
                                    <img 
                                      src={post.image_url} 
                                      alt="Vista previa de la imagen"
                                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/10 dark:bg-black/20 group-hover:bg-black/5 dark:group-hover:bg-black/10 transition-colors duration-200"></div>
                                    <div className="absolute top-2 right-2 bg-black/50 rounded-full p-1">
                                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" />
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Información del juego y servidor */}
                              {(game?.name || gameServer?.name) && (
                                <div className="flex items-center mt-2">
                                  <svg className="w-4 h-4 text-calico-orange mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                  </svg>
                                  {game?.name && (
                                    <span className="text-xs text-secondary font-medium">
                                      {game.name}
                                    </span>
                                  )}
                                  {gameServer?.name && (
                                    <>
                                      <span className="text-xs text-muted mx-1">•</span>
                                      <span className="text-xs text-secondary">
                                        {gameServer.name}
                                      </span>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Botón Ver más */}
                {hasMore && (
                  <div className="p-4 text-center border-t notification-border">
                    <button
                      onClick={loadMore}
                      disabled={loading}
                      className="w-full py-2 px-4 text-sm font-medium text-white hover:notification-button-hover rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: 'var(--notification-button-bg)' }}
                    >
                      {loading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Cargando...</span>
                        </div>
                      ) : (
                        'Ver más'
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;