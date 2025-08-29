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
        console.error('Error parsing user session:', e);
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
        console.error('Error loading posts:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        <span className="ml-2 text-gray-300">Cargando publicaciones...</span>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 text-center">
        <p className="text-gray-300 text-lg">{emptyMessage}</p>
        <p className="text-gray-400 mt-2">¡Sé el primero en compartir algo!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white mb-6">
          {serverId ? 'Muro del Servidor' : 'Últimas publicaciones'}
        </h2>
        <div className="text-green-400 font-medium">
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