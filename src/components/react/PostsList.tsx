import React, { useState, useEffect, useCallback } from 'react';
import { useNotifications } from './NotificationProvider';
import PostCard from './PostCard';

interface Post {
  id: string;
  user_id: string;
  game_id: string;
  title: string;
  content: string;
  image_url?: string;
  video_url?: string;
  post_type: 'general' | 'achievement' | 'review' | 'tip' | 'question';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  server_id?: string;
  profiles: {
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
  games: {
    name: string;
    cover_image_url?: string;
  };
  game_servers?: {
    name: string;
  };
  like_count: number;
  comment_count: number;
  user_has_liked: boolean;
}

interface PostsListProps {
  initialPosts: Post[];
  serverId?: string;
  gameId?: string;
  currentUserId?: string;
  emptyMessage?: string;
}

const PostsList: React.FC<PostsListProps> = ({ 
  initialPosts, 
  serverId, 
  gameId, 
  currentUserId: propCurrentUserId,
  emptyMessage = 'No hay publicaciones aún.' 
}) => {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(propCurrentUserId);
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { addNotification } = useNotifications();

  // Manejar hidratación y obtener usuario actual del cliente
  useEffect(() => {
    setIsClient(true);
    
    // Obtener usuario actual del lado del cliente
    const userSession = localStorage.getItem('userSession') || sessionStorage.getItem('userSession');
    if (userSession) {
      try {
        const session = JSON.parse(userSession);
        // Solo establecer currentUserId si hay un token válido
        if (session.access_token && session.user?.id) {
          setCurrentUserId(session.user.id);
        }
      } catch (e) {
        // Silent error handling
      }
    }
  }, []);

  // Función para cargar posts desde la API
  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/posts';
      const params = new URLSearchParams();
      
      if (serverId) {
        params.append('serverId', serverId);
      } else if (gameId) {
        params.append('gameId', gameId);
      }
      
      if (currentUserId) {
        params.append('userId', currentUserId);
      }
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      } else {
        // Silent error handling
      }
    } catch (error) {
      addNotification('Error al cargar las publicaciones', 'error');
    } finally {
      setLoading(false);
    }
  }, [serverId, gameId, currentUserId, addNotification]);

  // Escuchar eventos de nuevos posts
  useEffect(() => {
    const handlePostAdded = (event: CustomEvent) => {
      const { serverId: eventServerId, gameId: eventGameId, post } = event.detail;
      
      // Verificar si el post pertenece a este contexto
      if ((serverId && eventServerId === serverId) || 
          (gameId && eventGameId === gameId)) {
        // Recargar posts para obtener la versión completa con joins
        loadPosts();
      }
    };

    const handlePostUpdated = () => {
      loadPosts();
    };

    const handlePostDeleted = () => {
      loadPosts();
    };

    window.addEventListener('postAdded', handlePostAdded as EventListener);
    window.addEventListener('postUpdated', handlePostUpdated);
    window.addEventListener('postDeleted', handlePostDeleted);

    return () => {
      window.removeEventListener('postAdded', handlePostAdded as EventListener);
      window.removeEventListener('postUpdated', handlePostUpdated);
      window.removeEventListener('postDeleted', handlePostDeleted);
    };
  }, [serverId, gameId, loadPosts]);

  // Función para actualizar un post específico
  const updatePost = useCallback((postId: string, updates: Partial<Post>) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId ? { ...post, ...updates } : post
      )
    );
  }, []);

  // Scroll automático al post específico si está en la URL
  useEffect(() => {
    const scrollToPost = () => {
      const getTargetPostId = (): string | null => {
        const hash = window.location.hash;
        if (hash.startsWith('#post-')) {
          return hash.replace('#post-', '');
        }
        const params = new URLSearchParams(window.location.search);
        const queryId = params.get('post');
        return queryId || null;
      };

      const postId = getTargetPostId();
      if (postId && posts.length > 0) {
        const postElement = document.getElementById(`post-${postId}`);
        if (postElement) {
          // Esperar un poco para que el DOM se renderice completamente
          setTimeout(() => {
            postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Agregar un efecto visual temporal para destacar el post
            postElement.style.boxShadow = '0 0 20px rgba(255, 165, 0, 0.5)';
            setTimeout(() => {
              postElement.style.boxShadow = '';
            }, 3000);
          }, 500);
        }
      }
    };

    // Ejecutar cuando los posts se cargan
    if (posts.length > 0) {
      scrollToPost();
    }

    // También escuchar cambios en el hash y navegación del historial
    window.addEventListener('hashchange', scrollToPost);
    window.addEventListener('popstate', scrollToPost);
    
    return () => {
      window.removeEventListener('hashchange', scrollToPost);
      window.removeEventListener('popstate', scrollToPost);
    };
  }, [posts]);

  // Función para eliminar un post
  const removePost = useCallback((postId: string) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
  }, []);

  // Exponer funciones globalmente para que PostCard pueda usarlas
  useEffect(() => {
    (window as any).updatePostInList = updatePost;
    (window as any).removePostFromList = removePost;
    
    return () => {
      delete (window as any).updatePostInList;
      delete (window as any).removePostFromList;
    };
  }, [updatePost, removePost]);

  if (loading && posts.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-calico-orange-500 border-t-transparent"></div>
        <span className="ml-3 text-calico-gray-400">Cargando publicaciones...</span>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-calico-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-calico-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-calico-gray-400 text-lg mb-2">No hay publicaciones aún</p>
        <p className="text-calico-gray-500">¡Sé el primero en compartir algo!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-calico-white mb-6">
          {serverId ? 'Muro del Servidor' : 'Últimas publicaciones'}
        </h2>
        <div className="text-calico-orange-400 font-medium">
          {posts.length} {posts.length === 1 ? 'post' : 'posts'}
        </div>
      </div>
      
      {posts.map((post) => (
        <div 
          key={post.id} 
          className={`${isClient ? 'transform transition-all duration-300 hover:scale-[1.02]' : ''}`}
        >
          <PostCard 
            post={post} 
            currentUserId={currentUserId}
            onPostUpdate={updatePost}
          />
        </div>
      ))}
    </div>
  );
};

export default PostsList;