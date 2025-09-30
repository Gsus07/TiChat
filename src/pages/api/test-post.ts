import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('TEST POST endpoint called');
    
    const body = await request.json();
    console.log('Body received:', body);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Test endpoint working',
      received: body
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.log('Error in test endpoint:', error);
    return new Response(JSON.stringify({ 
      error: 'Test endpoint error',
      details: error
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};