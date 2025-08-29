import React, { useState, useEffect, useCallback } from 'react';
import { useNotifications } from './NotificationProvider';
import PostCard from '../PostCard.astro';

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
  currentUserId,
  emptyMessage = 'No hay publicaciones aún.' 
}) => {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotifications();

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
          className="transform transition-all duration-300 hover:scale-[1.02]"
          dangerouslySetInnerHTML={{
            __html: `
              <div class="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div class="flex items-start space-x-4">
                  <div class="flex-shrink-0">
                    <div class="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      ${post.profiles.username.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-2 mb-2">
                      <h3 class="text-white font-semibold">${post.profiles.full_name || post.profiles.username}</h3>
                      <span class="text-gray-400 text-sm">@${post.profiles.username}</span>
                      <span class="text-gray-500 text-sm">•</span>
                      <span class="text-gray-500 text-sm">${new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                    <div class="text-gray-200 mb-4 whitespace-pre-wrap">${post.content}</div>
                    <div class="flex items-center space-x-6 text-gray-400">
                      <button class="flex items-center space-x-2 hover:text-red-400 transition-colors" data-post-id="${post.id}">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                        </svg>
                        <span class="like-count">${post.like_count}</span>
                      </button>
                      <button class="flex items-center space-x-2 hover:text-blue-400 transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                        </svg>
                        <span class="comment-count">${post.comment_count}</span>
                      </button>
                      <button class="flex items-center space-x-2 hover:text-green-400 transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
                        </svg>
                        <span>Compartir</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            `
          }}
        />
      ))}
    </div>
  );
};

export default PostsList;