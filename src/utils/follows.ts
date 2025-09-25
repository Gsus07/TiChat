import { supabase } from './supabaseClient';

export interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface UserWithFollowInfo {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  follower_count: number;
  following_count: number;
  is_following?: boolean;
  is_followed_by?: boolean;
}

// Funciones para manejar seguimiento de usuarios
export async function followUser(followerId: string, followingId: string) {
  try {
    // Verificar que no se esté siguiendo a sí mismo
    if (followerId === followingId) {
      return { data: null, error: { message: 'No puedes seguirte a ti mismo' } };
    }

    // Verificar si ya existe la relación de seguimiento
    const { data: existingFollow, error: checkError } = await supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingFollow) {
      return { data: null, error: { message: 'Ya sigues a este usuario' } };
    }

    // Crear la relación de seguimiento
    const { data, error } = await supabase
      .from('user_follows')
      .insert([{ follower_id: followerId, following_id: followingId }])
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function unfollowUser(followerId: string, followingId: string) {
  try {
    const { data, error } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function isFollowing(followerId: string, followingId: string) {
  try {
    const { data, error } = await supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return { data: !!data, error: null };
  } catch (error) {
    return { data: false, error };
  }
}

export async function getFollowers(userId: string, currentUserId?: string, limit = 20, offset = 0) {
  try {
    const { data: followers, error } = await supabase
      .from('user_follows')
      .select(`
        follower_id,
        created_at,
        profiles:follower_id(id, username, full_name, avatar_url, bio)
      `)
      .eq('following_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    
    if (!followers) return { data: [], error: null };

    // Agregar información de seguimiento para el usuario actual
    const followersWithInfo = await Promise.all(
      followers.map(async (follow) => {
        const profile = follow.profiles as any;
        if (!profile) return null;

        let isFollowing = false;
        let isFollowedBy = false;

        if (currentUserId && currentUserId !== profile.id) {
          const [followingResult, followedByResult] = await Promise.all([
            supabase
              .from('user_follows')
              .select('id')
              .eq('follower_id', currentUserId)
              .eq('following_id', profile.id)
              .single(),
            supabase
              .from('user_follows')
              .select('id')
              .eq('follower_id', profile.id)
              .eq('following_id', currentUserId)
              .single()
          ]);

          isFollowing = !!followingResult.data;
          isFollowedBy = !!followedByResult.data;
        }

        // Obtener conteos de seguidores y seguidos
        const [followerCountResult, followingCountResult] = await Promise.all([
          supabase
            .from('user_follows')
            .select('id', { count: 'exact', head: true })
            .eq('following_id', profile.id),
          supabase
            .from('user_follows')
            .select('id', { count: 'exact', head: true })
            .eq('follower_id', profile.id)
        ]);

        return {
          ...profile,
          follower_count: (followerCountResult as any).count || 0,
          following_count: (followingCountResult as any).count || 0,
          is_following: isFollowing,
          is_followed_by: isFollowedBy
        } as UserWithFollowInfo;
      })
    );
    
    return { data: followersWithInfo.filter(Boolean), error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getFollowing(userId: string, currentUserId?: string, limit = 20, offset = 0) {
  try {
    const { data: following, error } = await supabase
      .from('user_follows')
      .select(`
        following_id,
        created_at,
        profiles:following_id(id, username, full_name, avatar_url, bio)
      `)
      .eq('follower_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    
    if (!following) return { data: [], error: null };

    // Agregar información de seguimiento para el usuario actual
    const followingWithInfo = await Promise.all(
      following.map(async (follow) => {
        const profile = follow.profiles as any;
        if (!profile) return null;

        let isFollowing = false;
        let isFollowedBy = false;

        if (currentUserId && currentUserId !== profile.id) {
          const [followingResult, followedByResult] = await Promise.all([
            supabase
              .from('user_follows')
              .select('id')
              .eq('follower_id', currentUserId)
              .eq('following_id', profile.id)
              .single(),
            supabase
              .from('user_follows')
              .select('id')
              .eq('follower_id', profile.id)
              .eq('following_id', currentUserId)
              .single()
          ]);

          isFollowing = !!followingResult.data;
          isFollowedBy = !!followedByResult.data;
        }

        // Obtener conteos de seguidores y seguidos
        const [followerCountResult, followingCountResult] = await Promise.all([
          supabase
            .from('user_follows')
            .select('id', { count: 'exact', head: true })
            .eq('following_id', profile.id),
          supabase
            .from('user_follows')
            .select('id', { count: 'exact', head: true })
            .eq('follower_id', profile.id)
        ]);

        return {
          ...profile,
          follower_count: (followerCountResult as any).count || 0,
          following_count: (followingCountResult as any).count || 0,
          is_following: isFollowing,
          is_followed_by: isFollowedBy
        } as UserWithFollowInfo;
      })
    );
    
    return { data: followingWithInfo.filter(Boolean), error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getUserFollowCounts(userId: string) {
  try {
    const [followerCountResult, followingCountResult] = await Promise.all([
      supabase
        .from('user_follows')
        .select('id', { count: 'exact', head: true })
        .eq('following_id', userId),
      supabase
        .from('user_follows')
        .select('id', { count: 'exact', head: true })
        .eq('follower_id', userId)
    ]);

    return {
      data: {
        follower_count: followerCountResult.count || 0,
        following_count: followingCountResult.count || 0
      },
      error: null
    };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getMutualFollows(userId1: string, userId2: string) {
  try {
    // Primero obtener los IDs que sigue userId2
    const { data: user2Following, error: user2FollowingError } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', userId2);

    if (user2FollowingError) throw user2FollowingError;

    // Primero obtener los IDs que siguen a userId2
    const { data: user2Followers, error: user2FollowersError } = await supabase
      .from('user_follows')
      .select('follower_id')
      .eq('following_id', userId2);

    if (user2FollowersError) throw user2FollowersError;

    const user2FollowingIds = user2Following?.map(f => f.following_id) || [];
    const user2FollowerIds = user2Followers?.map(f => f.follower_id) || [];

    // Obtener usuarios que ambos siguen
    const { data: mutualFollowing, error: followingError } = user2FollowingIds.length > 0 ? await supabase
      .from('user_follows')
      .select(`
        following_id,
        profiles:following_id(id, username, full_name, avatar_url)
      `)
      .eq('follower_id', userId1)
      .in('following_id', user2FollowingIds) : { data: [], error: null };

    if (followingError) throw followingError;

    // Obtener usuarios que siguen a ambos
    const { data: mutualFollowers, error: followersError } = user2FollowerIds.length > 0 ? await supabase
      .from('user_follows')
      .select(`
        follower_id,
        profiles:follower_id(id, username, full_name, avatar_url)
      `)
      .eq('following_id', userId1)
      .in('follower_id', user2FollowerIds) : { data: [], error: null };

    if (followersError) throw followersError;

    return {
      data: {
        mutual_following: mutualFollowing?.map(f => f.profiles).filter(Boolean) || [],
        mutual_followers: mutualFollowers?.map(f => f.profiles).filter(Boolean) || []
      },
      error: null
    };
  } catch (error) {
    return { data: null, error };
  }
}

export async function searchUsers(query: string, currentUserId?: string, limit = 20) {
  try {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, bio')
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(limit);
    
    if (error) throw error;
    
    if (!users) return { data: [], error: null };

    // Agregar información de seguimiento para cada usuario
    const usersWithInfo = await Promise.all(
      users.map(async (user) => {
        let isFollowing = false;
        let isFollowedBy = false;

        if (currentUserId && currentUserId !== user.id) {
          const [followingResult, followedByResult] = await Promise.all([
            supabase
              .from('user_follows')
              .select('id')
              .eq('follower_id', currentUserId)
              .eq('following_id', user.id)
              .single(),
            supabase
              .from('user_follows')
              .select('id')
              .eq('follower_id', user.id)
              .eq('following_id', currentUserId)
              .single()
          ]);

          isFollowing = !!followingResult.data;
          isFollowedBy = !!followedByResult.data;
        }

        // Obtener conteos de seguidores y seguidos
        const [followerCountResult, followingCountResult] = await Promise.all([
          supabase
            .from('user_follows')
            .select('id', { count: 'exact', head: true })
            .eq('following_id', user.id),
          supabase
            .from('user_follows')
            .select('id', { count: 'exact', head: true })
            .eq('follower_id', user.id)
        ]);

        return {
          ...user,
          follower_count: followerCountResult.count || 0,
          following_count: followingCountResult.count || 0,
          is_following: isFollowing,
          is_followed_by: isFollowedBy
        } as UserWithFollowInfo;
      })
    );
    
    return { data: usersWithInfo, error: null };
  } catch (error) {
    return { data: null, error };
  }
}