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
            // Silent error handling
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
      addNotification('Error al procesar el like', 'error');
    }
  };

  // Función para cargar comentarios
  const loadComments = async () => {
    setLoadingComments(true);
    try {
      // Construir URL con userId si está disponible
      let url = `/api/posts/${post.id}/comments`;
      if (currentUserId) {
        url += `?userId=${currentUserId}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        // La API devuelve { data: comments, error: null }
        setComments(result.data || []);
      } else {
        addNotification('Error al cargar comentarios', 'error');
      }
    } catch (error) {
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
            // Silent error handling
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
            // Silent error handling
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
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-calico-stripe-light/20">
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
            <div className="w-12 h-12 bg-gradient-to-br from-calico-orange-400 to-calico-orange-600 rounded-full flex items-center justify-center text-calico-white font-bold text-lg">
              {post.profiles.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-calico-white font-semibold">
              {post.profiles.full_name || post.profiles.username}
            </h3>
            <span className="text-calico-gray-400 text-sm">@{post.profiles.username}</span>
            <span className="text-calico-gray-500 text-sm">•</span>
            <span className="text-calico-gray-500 text-sm">{formatDate(post.created_at)}</span>
          </div>
          
          {/* Título del post si existe */}
          {post.title && (
            <h4 className="text-calico-white font-medium mb-2">{post.title}</h4>
          )}
          
          {/* Contenido del post */}
          <div className="text-calico-gray-200 mb-4 whitespace-pre-wrap">{post.content}</div>
          
          {/* Imagen del post si existe */}
          {post.image_url && (
            <div className="mb-4 rounded-lg bg-calico-gray-800/20 p-2">
              <img 
                src={post.image_url} 
                alt="Post image" 
                className="w-full h-auto object-contain rounded-lg cursor-pointer hover:scale-[1.02] transition-transform duration-300 shadow-lg"
                onClick={() => window.open(post.image_url, '_blank')}
                style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
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
          <div className="flex items-center space-x-6 pt-4 border-t border-calico-stripe-light/20">
            {/* Botón de like */}
            <button 
              onClick={handleLike}
              className={`flex items-center space-x-2 transition-colors group ${
                isLiked 
                  ? 'text-calico-red-400 hover:text-calico-red-300' 
                  : 'text-calico-gray-400 hover:text-calico-red-400'
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
              className="flex items-center space-x-2 text-calico-gray-400 hover:text-calico-blue-400 transition-colors group"
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
              className="flex items-center space-x-2 text-calico-gray-400 hover:text-calico-orange-400 transition-colors group"
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
        <div className="mt-6 pt-6 border-t border-calico-stripe-light/20">
          {/* Formulario de comentarios */}
          {isClient && isAuthenticated && (
            <div className="mb-6">
              <div className="bg-gradient-to-r from-white/5 to-white/3 backdrop-blur-sm rounded-2xl p-4 border border-calico-stripe-light/20">
                <div className="flex space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-calico-orange-500 to-calico-blue-600 rounded-full flex items-center justify-center text-calico-white font-bold text-sm ring-2 ring-calico-orange-400/30">
                      U
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="relative">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="¿Qué opinas sobre esta publicación?"
                        className="w-full bg-white/10 border border-calico-stripe-light/30 rounded-xl px-4 py-3 text-calico-white placeholder-calico-gray-400 focus:outline-none focus:ring-2 focus:ring-calico-orange-500 focus:border-calico-orange-500/50 resize-none transition-all duration-200 backdrop-blur-sm"
                        rows={3}
                        disabled={submittingComment}
                        maxLength={500}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            submitComment();
                          }
                        }}
                      />
                      <div className="absolute bottom-3 right-3 text-xs text-calico-gray-400 bg-black/20 px-2 py-1 rounded-full">
                        {newComment.length}/500
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          className="flex items-center space-x-1 text-xs text-calico-gray-400 hover:text-calico-blue-400 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2" />
                          </svg>
                          <span>Adjuntar</span>
                        </button>
                        <button
                          type="button"
                          className="flex items-center space-x-1 text-xs text-calico-gray-400 hover:text-calico-yellow-400 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Emoji</span>
                        </button>
                      </div>
                      <button
                        onClick={submitComment}
                        disabled={!newComment.trim() || submittingComment}
                        className="px-6 py-2 bg-gradient-to-r from-calico-orange-600 to-calico-orange-700 text-calico-white rounded-xl hover:from-calico-orange-700 hover:to-calico-orange-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-calico-orange-500/25 disabled:shadow-none transform hover:scale-105 disabled:hover:scale-100"
                      >
                        {submittingComment ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-calico-white border-t-transparent"></div>
                            <span>Enviando...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            <span>Comentar</span>
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Lista de comentarios */}
          <div className="space-y-3">
            {loadingComments ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-calico-orange-500 border-t-transparent"></div>
                <span className="ml-3 text-calico-gray-400 font-medium">Cargando comentarios...</span>
              </div>
            ) : comments.length > 0 ? (
              <div className="max-h-96 overflow-y-auto pr-2 space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="group hover:bg-white/5 rounded-xl p-3 transition-all duration-200">
                    <div className="flex space-x-3">
                      <div className="flex-shrink-0">
                        {comment.profiles.avatar_url ? (
                          <img 
                            src={comment.profiles.avatar_url} 
                            alt={comment.profiles.username}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10 group-hover:ring-calico-orange-400/30 transition-all"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-calico-blue-500 to-calico-purple-600 rounded-full flex items-center justify-center text-calico-white font-bold text-sm ring-2 ring-white/10 group-hover:ring-calico-blue-400/30 transition-all">
                            {comment.profiles.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="bg-gradient-to-r from-white/8 to-white/4 backdrop-blur-sm rounded-xl p-4 border border-calico-stripe-light/20 group-hover:border-calico-stripe-light/30 transition-all">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-calico-white font-semibold text-sm">
                              {comment.profiles.full_name || comment.profiles.username}
                            </span>
                            <span className="text-calico-gray-400 text-xs font-medium">@{comment.profiles.username}</span>
                            <div className="w-1 h-1 bg-calico-gray-500 rounded-full"></div>
                            <span className="text-calico-gray-500 text-xs">{formatDate(comment.created_at)}</span>
                          </div>
                          <p className="text-calico-gray-100 text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                        </div>
                        <div className="flex items-center space-x-6 mt-3 ml-1">
                          <button 
                            onClick={() => handleCommentLike(comment.id)}
                            className={`flex items-center space-x-2 text-xs font-medium transition-all duration-200 hover:scale-105 ${
                              comment.user_has_liked 
                                ? 'text-calico-red-400 hover:text-calico-red-300' 
                                : 'text-calico-gray-400 hover:text-calico-red-400'
                            }`}
                          >
                            <svg 
                              className={`w-4 h-4 transition-all ${
                                comment.user_has_liked ? 'fill-current scale-110' : ''
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
                          <button className="flex items-center space-x-2 text-xs font-medium text-calico-gray-400 hover:text-calico-blue-400 transition-all duration-200 hover:scale-105">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            <span>Responder</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-calico-gray-600 to-calico-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-calico-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-calico-gray-400 font-medium mb-2">No hay comentarios aún</p>
                <p className="text-calico-gray-500 text-sm">¡Sé el primero en compartir tu opinión!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;