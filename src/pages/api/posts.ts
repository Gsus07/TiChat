import type { APIRoute } from 'astro';
import { getPostsByServerId, getPostsByGameId } from '../../utils/posts';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const serverId = url.searchParams.get('serverId');
    const gameId = url.searchParams.get('gameId');
    const userId = url.searchParams.get('userId');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let result;
    
    if (serverId) {
      result = await getPostsByServerId(serverId, userId || undefined, limit, offset);
    } else if (gameId) {
      result = await getPostsByGameId(gameId, userId || undefined, limit, offset);
    } else {
      return new Response(JSON.stringify({ error: 'serverId or gameId is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    if (result.error) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    return new Response(JSON.stringify({ posts: result.data || [] }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};