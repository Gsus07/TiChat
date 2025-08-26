import { supabase } from './supabaseClient';

export interface Post {
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
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_comment_id?: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface CommentLike {
  id: string;
  comment_id: string;
  user_id: string;
  created_at: string;
}

export interface PostWithDetails extends Post {
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

export interface CommentWithDetails extends Comment {
  profiles: {
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
  like_count: number;
  user_has_liked: boolean;
  replies?: CommentWithDetails[];
}

// Funciones para manejar posts
export async function getPostsByGame(gameName: string, userId?: string, limit = 20, offset = 0) {
  // First get the game by name
  const { data: game } = await supabase
    .from('games')
    .select('id')
    .eq('name', gameName)
    .single();

  if (!game) {
    return { data: [], error: 'Game not found' };
  }

  return getPostsByGameId(game.id, userId, limit, offset);
}

export async function getPostsByGameId(gameId: string, userId?: string, limit = 20, offset = 0) {
  try {
    let query = supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id(username, full_name, avatar_url),
        games:game_id(name, cover_image_url),
        game_servers:server_id(name)
      `)
      .eq('game_id', gameId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: posts, error } = await query;
    
    if (error) throw error;
    
    if (!posts) return { data: [], error: null };

    // Obtener conteos de likes y comentarios para cada post
    const postsWithDetails = await Promise.all(
      posts.map(async (post) => {
        const [likesResult, commentsResult, userLikeResult] = await Promise.all([
          supabase
            .from('post_likes')
            .select('id', { count: 'exact', head: true })
            .eq('post_id', post.id),
          supabase
            .from('comments')
            .select('id', { count: 'exact', head: true })
            .eq('post_id', post.id)
            .eq('is_active', true),
          userId ? supabase
            .from('post_likes')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', userId)
            .single() : Promise.resolve({ data: null, error: null })
        ]);

        return {
          ...post,
          like_count: likesResult.count || 0,
          comment_count: commentsResult.count || 0,
          user_has_liked: !!userLikeResult.data
        } as PostWithDetails;
      })
    );
    
    return { data: postsWithDetails, error: null };
  } catch (error) {
    console.error('Error fetching posts:', error);
    return { data: null, error };
  }
}

export async function getPostsByServerId(serverId: string, userId?: string, limit = 20, offset = 0) {
  try {
    let query = supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id(username, full_name, avatar_url),
        games:game_id(name, cover_image_url),
        game_servers:server_id(name)
      `)
      .eq('server_id', serverId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: posts, error } = await query;
    
    if (error) throw error;
    
    if (!posts) return { data: [], error: null };

    // Obtener conteos de likes y comentarios para cada post
    const postsWithDetails = await Promise.all(
      posts.map(async (post) => {
        const [likesResult, commentsResult, userLikeResult] = await Promise.all([
          supabase
            .from('post_likes')
            .select('id', { count: 'exact', head: true })
            .eq('post_id', post.id),
          supabase
            .from('comments')
            .select('id', { count: 'exact', head: true })
            .eq('post_id', post.id)
            .eq('is_active', true),
          userId ? supabase
            .from('post_likes')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', userId)
            .single() : Promise.resolve({ data: null, error: null })
        ]);

        return {
          ...post,
          like_count: likesResult.count || 0,
          comment_count: commentsResult.count || 0,
          user_has_liked: !!userLikeResult.data
        } as PostWithDetails;
      })
    );
    
    return { data: postsWithDetails, error: null };
  } catch (error) {
    console.error('Error fetching posts by server:', error);
    return { data: null, error };
  }
}

export async function getPostById(id: string, userId?: string) {
  try {
    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id(username, full_name, avatar_url),
        games:game_id(name, cover_image_url),
        game_servers:server_id(name)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();
    
    if (error) throw error;
    
    if (!post) return { data: null, error: null };

    // Obtener conteos de likes y comentarios
    const [likesResult, commentsResult, userLikeResult] = await Promise.all([
      supabase
        .from('post_likes')
        .select('id', { count: 'exact', head: true })
        .eq('post_id', post.id),
      supabase
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .eq('post_id', post.id)
        .eq('is_active', true),
      userId ? supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', userId)
        .single() : Promise.resolve({ data: null, error: null })
    ]);

    const postWithDetails = {
      ...post,
      like_count: likesResult.count || 0,
      comment_count: commentsResult.count || 0,
      user_has_liked: !!userLikeResult.data
    } as PostWithDetails;
    
    return { data: postWithDetails, error: null };
  } catch (error) {
    console.error('Error fetching post:', error);
    return { data: null, error };
  }
}

export async function createPost(postData: Omit<Post, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .insert([postData])
      .select()
      .single();
    
    if (error) throw error;
    
    // Actualizar estadísticas del servidor si el post está asociado a uno
    if (data && data.server_id) {
      await supabase.rpc('increment_server_posts', { server_id: data.server_id });
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error creating post:', error);
    return { data: null, error };
  }
}

export async function updatePost(id: string, postData: Partial<Post>) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .update({ ...postData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating post:', error);
    return { data: null, error };
  }
}

export async function deletePost(id: string) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error deleting post:', error);
    return { data: null, error };
  }
}

// Funciones para manejar comentarios
export async function getCommentsByPostId(postId: string, userId?: string) {
  try {
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id(username, full_name, avatar_url)
      `)
      .eq('post_id', postId)
      .eq('is_active', true)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    if (!comments) return { data: [], error: null };

    // Obtener respuestas y conteos para cada comentario
    const commentsWithDetails = await Promise.all(
      comments.map(async (comment) => {
        const [likesResult, userLikeResult, repliesResult] = await Promise.all([
          supabase
            .from('comment_likes')
            .select('id', { count: 'exact', head: true })
            .eq('comment_id', comment.id),
          userId ? supabase
            .from('comment_likes')
            .select('id')
            .eq('comment_id', comment.id)
            .eq('user_id', userId)
            .single() : Promise.resolve({ data: null, error: null }),
          supabase
            .from('comments')
            .select(`
              *,
              profiles:user_id(username, full_name, avatar_url)
            `)
            .eq('parent_comment_id', comment.id)
            .eq('is_active', true)
            .order('created_at', { ascending: true })
        ]);

        // Procesar respuestas
        const replies = repliesResult.data ? await Promise.all(
          repliesResult.data.map(async (reply) => {
            const [replyLikesResult, replyUserLikeResult] = await Promise.all([
              supabase
                .from('comment_likes')
                .select('id', { count: 'exact', head: true })
                .eq('comment_id', reply.id),
              userId ? supabase
                .from('comment_likes')
                .select('id')
                .eq('comment_id', reply.id)
                .eq('user_id', userId)
                .single() : Promise.resolve({ data: null, error: null })
            ]);

            return {
              ...reply,
              like_count: replyLikesResult.count || 0,
              user_has_liked: !!replyUserLikeResult.data
            } as CommentWithDetails;
          })
        ) : [];

        return {
          ...comment,
          like_count: likesResult.count || 0,
          user_has_liked: !!userLikeResult.data,
          replies
        } as CommentWithDetails;
      })
    );
    
    return { data: commentsWithDetails, error: null };
  } catch (error) {
    console.error('Error fetching comments:', error);
    return { data: null, error };
  }
}

export async function createComment(commentData: Omit<Comment, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert([commentData])
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating comment:', error);
    return { data: null, error };
  }
}

export async function updateComment(id: string, commentData: Partial<Comment>) {
  try {
    const { data, error } = await supabase
      .from('comments')
      .update({ ...commentData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating comment:', error);
    return { data: null, error };
  }
}

export async function deleteComment(id: string) {
  try {
    const { data, error } = await supabase
      .from('comments')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error deleting comment:', error);
    return { data: null, error };
  }
}

// Funciones para manejar likes en posts
export async function togglePostLike(postId: string, userId: string) {
  try {
    // Verificar si ya existe el like
    const { data: existingLike, error: checkError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingLike) {
      // Remover like
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);
      
      if (error) throw error;
      return { data: { liked: false }, error: null };
    } else {
      // Agregar like
      const { data, error } = await supabase
        .from('post_likes')
        .insert([{ post_id: postId, user_id: userId }])
        .select()
        .single();
      
      if (error) throw error;
      return { data: { liked: true }, error: null };
    }
  } catch (error) {
    console.error('Error toggling post like:', error);
    return { data: null, error };
  }
}

// Funciones para manejar likes en comentarios
export async function toggleCommentLike(commentId: string, userId: string) {
  try {
    // Verificar si ya existe el like
    const { data: existingLike, error: checkError } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingLike) {
      // Remover like
      const { error } = await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userId);
      
      if (error) throw error;
      return { data: { liked: false }, error: null };
    } else {
      // Agregar like
      const { data, error } = await supabase
        .from('comment_likes')
        .insert([{ comment_id: commentId, user_id: userId }])
        .select()
        .single();
      
      if (error) throw error;
      return { data: { liked: true }, error: null };
    }
  } catch (error) {
    console.error('Error toggling comment like:', error);
    return { data: null, error };
  }
}