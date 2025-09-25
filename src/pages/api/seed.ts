import type { APIRoute } from 'astro';
import { runSeeders } from '../../seeders/index';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Verificar que la petición incluya una clave de autorización básica
    const body = await request.json();
    const { authorization } = body;
    
    // Clave simple para evitar ejecuciones accidentales
    if (authorization !== 'seed-database-2024') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Autorización requerida' 
        }),
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Ejecutar seeders
    await runSeeders();
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Seeders ejecutados exitosamente' 
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
};

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({ 
      message: 'Endpoint para ejecutar seeders. Usar método POST con autorización.' 
    }),
    { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
};