import React, { useState, useEffect } from 'react';
import { useNotifications } from './NotificationProvider';

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

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_comment_id?: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profiles: {
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
  like_count: number;
  user_has_liked: boolean;
  replies?: Comment[];
}

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onPostUpdate?: (postId: string, updates: Partial<Post>) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, currentUserId, onPostUpdate }) => {
  const [isLiked, setIsLiked] = useState(post.user_has_liked);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [commentCount, setCommentCount] = useState(post.comment_count);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { addNotification } = useNotifications();

  // Manejar hidratación y autenticación
  useEffect(() => {
    setIsClient(true);
    const userSession = localStorage.getItem('userSession') || sessionStorage.getItem('userSession');
    if (userSession) {
      try {
        const session = JSON.parse(userSession);
        // Verificar autenticación basada en el token JWT
        setIsAuthenticated(!!session.access_token && !!session.user?.id);
      } catch (e) {
        console.error('Error parsing user session:', e);
        setIsAuthenticated(!!currentUserId);
      }
    } else {
      setIsAuthenticated(!!currentUserId);
    }
  }, [currentUserId]);

  // Sincronizar estado cuando cambien los props
  useEffect(() => {
    setIsLiked(post.user_has_liked);
    setLikeCount(post.like_count);
    setCommentCount(post.comment_count);
  }, [post.user_has_liked, post.like_count, post.comment_count]);

  // Debug: verificar valores
  useEffect(() => {
    console.log('=== PostCard Debug ===');
    console.log('currentUserId:', currentUserId);
    console.log('post.user_has_liked:', post.user_has_liked);
    console.log('isLiked state:', isLiked);
    console.log('likeCount state:', likeCount);
    console.log('commentCount state:', commentCount);
    console.log('======================');
  }, [currentUserId, post, isLiked, likeCount, commentCount]);

  // Función para manejar like/unlike
  const handleLike = async () => {
    if (!isAuthenticated) {
      addNotification('Debes iniciar sesión para dar like', 'error');
      return;
    }

    try {
      let token = null;
      if (isClient) {
        const userSession = localStorage.getItem('userSession') || sessionStorage.getItem('userSession');
        if (userSession) {
          try {
            const session = JSON.parse(userSession);
            token = session.access_token; // Usar el token JWT real
          } catch (e) {
            console.error('Error parsing user session:', e);
          }
        }
      }
      
      if (!token) {
        addNotification('Debes iniciar sesión para dar like', 'error');
        return;
      }

      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token || currentUserId}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.liked);
        setLikeCount(data.like_count);
        
        // Notificar al componente padre sobre la actualización
        if (onPostUpdate) {
          onPostUpdate(post.id, {
            like_count: data.like_count,
            user_has_liked: data.liked
          });
        }
      } else {
        addNotification('Error al procesar el like', 'error');
      }
    } catch (error) {
      console.error('Error al dar like:', error);
      addNotification('Error al procesar el like', 'error');
    }
  };

  // Función para cargar comentarios
  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const response = await fetch(`/api/posts/${post.id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      } else {
        addNotification('Error al cargar comentarios', 'error');
      }
    } catch (error) {
      console.error('Error al cargar comentarios:', error);
      addNotification('Error al cargar comentarios', 'error');
    } finally {
      setLoadingComments(false);
    }
  };

  // Función para alternar mostrar comentarios
  const toggleComments = () => {
    setShowComments(!showComments);
    if (!showComments && comments.length === 0) {
      loadComments();
    }
  };

  // Función para enviar comentario
  const submitComment = async () => {
    if (!isAuthenticated) {
      addNotification('Debes iniciar sesión para comentar', 'error');
      return;
    }

    if (!newComment.trim()) {
      addNotification('El comentario no puede estar vacío', 'error');
      return;
    }

    setSubmittingComment(true);
    try {
      let token = null;
      if (isClient) {
        const userSession = localStorage.getItem('userSession') || sessionStorage.getItem('userSession');
        if (userSession) {
          try {
            const session = JSON.parse(userSession);
            token = session.access_token; // Usar el token JWT real
          } catch (e) {
            console.error('Error parsing user session:', e);
          }
        }
      }
      
      if (!token) {
        addNotification('Debes iniciar sesión para comentar', 'error');
        return;
      }

      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token || currentUserId}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newComment.trim() })
      });

      if (response.ok) {
        setNewComment('');
        setCommentCount(prev => prev + 1);
        loadComments(); // Recargar comentarios
        addNotification('Comentario agregado', 'success');
        
        // Notificar al componente padre sobre la actualización
        if (onPostUpdate) {
          onPostUpdate(post.id, {
            comment_count: commentCount + 1
          });
        }
      } else {
        addNotification('Error al enviar comentario', 'error');
      }
    } catch (error) {
      console.error('Error al enviar comentario:', error);
      addNotification('Error al enviar comentario', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Función para manejar like en comentarios
  const handleCommentLike = async (commentId: string) => {
    if (!isAuthenticated) {
      addNotification('Debes iniciar sesión para dar like', 'error');
      return;
    }

    try {
      let token = null;
      if (isClient) {
        const userSession = localStorage.getItem('userSession') || sessionStorage.getItem('userSession');
        if (userSession) {
          try {
            const session = JSON.parse(userSession);
            token = session.access_token; // Usar el token JWT real
          } catch (e) {
            console.error('Error parsing user session:', e);
          }
        }
      }
      
      if (!token) {
        addNotification('Debes iniciar sesión para dar like', 'error');
        return;
      }

      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token || currentUserId}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Actualizar el comentario en el estado local
        setComments(prevComments => 
          prevComments.map(comment => 
            comment.id === commentId 
              ? { ...comment, like_count: data.like_count, user_has_liked: data.liked }
              : comment
          )
        );
      } else {
        addNotification('Error al procesar el like', 'error');
      }
    } catch (error) {
      console.error('Error al dar like al comentario:', error);
      addNotification('Error al procesar el like', 'error');
    }
  };

  // Función para compartir post
  const sharePost = () => {
    const url = `${window.location.origin}/posts/${post.id}`;
    navigator.clipboard.writeText(url).then(() => {
      addNotification('Enlace copiado al portapapeles', 'success');
    }).catch(() => {
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      addNotification('Enlace copiado al portapapeles', 'success');
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Hace unos minutos';
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      {/* Header del post */}
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {post.profiles.avatar_url ? (
            <img 
              src={post.profiles.avatar_url} 
              alt={post.profiles.username}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {post.profiles.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-white font-semibold">
              {post.profiles.full_name || post.profiles.username}
            </h3>
            <span className="text-gray-400 text-sm">@{post.profiles.username}</span>
            <span className="text-gray-500 text-sm">•</span>
            <span className="text-gray-500 text-sm">{formatDate(post.created_at)}</span>
          </div>
          
          {/* Título del post si existe */}
          {post.title && (
            <h4 className="text-white font-medium mb-2">{post.title}</h4>
          )}
          
          {/* Contenido del post */}
          <div className="text-gray-200 mb-4 whitespace-pre-wrap">{post.content}</div>
          
          {/* Imagen del post si existe */}
          {post.image_url && (
            <div className="mb-4">
              <img 
                src={post.image_url} 
                alt="Post image" 
                className="w-full max-h-96 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(post.image_url, '_blank')}
              />
            </div>
          )}
          
          {/* Video del post si existe */}
          {post.video_url && (
            <div className="mb-4">
              <video 
                src={post.video_url} 
                controls 
                className="w-full max-h-96 rounded-lg"
              />
            </div>
          )}
          
          {/* Acciones del post */}
          <div className="flex items-center space-x-6 pt-4 border-t border-white/10">
            {/* Botón de like */}
            <button 
              onClick={handleLike}
              className={`flex items-center space-x-2 transition-colors group ${
                isLiked 
                  ? 'text-red-400 hover:text-red-300' 
                  : 'text-gray-400 hover:text-red-400'
              }`}
            >
              <svg 
                className={`w-5 h-5 group-hover:scale-110 transition-transform ${
                  isLiked ? 'fill-current' : ''
                }`} 
                fill={isLiked ? 'currentColor' : 'none'} 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span className="text-sm font-medium">{likeCount}</span>
            </button>
            
            {/* Botón de comentarios */}
            <button 
              onClick={toggleComments}
              className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-colors group"
            >
              <svg 
                className="w-5 h-5 group-hover:scale-110 transition-transform" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span className="text-sm font-medium">{commentCount}</span>
            </button>
            
            {/* Botón de compartir */}
            <button 
              onClick={sharePost}
              className="flex items-center space-x-2 text-gray-400 hover:text-green-400 transition-colors group"
            >
              <svg 
                className="w-5 h-5 group-hover:scale-110 transition-transform" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                />
              </svg>
              <span className="text-sm">Compartir</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Sección de comentarios */}
      {showComments && (
        <div className="mt-6 pt-6 border-t border-white/10">
          {/* Input para nuevo comentario */}
          {isClient && isAuthenticated && (
            <div className="mb-4">
              <div className="flex space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    U
                  </div>
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escribe un comentario..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-green-400 resize-none"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        submitComment();
                      }
                    }}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={submitComment}
                      disabled={submittingComment || !newComment.trim()}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {submittingComment ? 'Enviando...' : 'Comentar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Lista de comentarios */}
          <div className="space-y-4">
            {loadingComments ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                <span className="ml-2 text-gray-400">Cargando comentarios...</span>
              </div>
            ) : comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                  <div className="flex-shrink-0">
                    {comment.profiles.avatar_url ? (
                      <img 
                        src={comment.profiles.avatar_url} 
                        alt={comment.profiles.username}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {comment.profiles.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-white font-medium text-sm">
                          {comment.profiles.full_name || comment.profiles.username}
                        </span>
                        <span className="text-gray-400 text-xs">@{comment.profiles.username}</span>
                        <span className="text-gray-500 text-xs">•</span>
                        <span className="text-gray-500 text-xs">{formatDate(comment.created_at)}</span>
                      </div>
                      <p className="text-gray-200 text-sm whitespace-pre-wrap">{comment.content}</p>
                    </div>
                    <div className="flex items-center space-x-4 mt-2">
                      <button 
                        onClick={() => handleCommentLike(comment.id)}
                        className={`flex items-center space-x-1 text-xs transition-colors ${
                          comment.user_has_liked 
                            ? 'text-red-400 hover:text-red-300' 
                            : 'text-gray-400 hover:text-red-400'
                        }`}
                      >
                        <svg 
                          className={`w-4 h-4 ${
                            comment.user_has_liked ? 'fill-current' : ''
                          }`} 
                          fill={comment.user_has_liked ? 'currentColor' : 'none'} 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth="2" 
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                        <span>{comment.like_count}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-4">No hay comentarios aún. ¡Sé el primero en comentar!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;