import type { APIRoute } from 'astro';
import { supabase } from '../../utils/supabaseClient';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email, password, username, full_name } = body;
    
    // Registro con metadata para el trigger
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          full_name: full_name
        },
        emailRedirectTo: undefined // Deshabilitar confirmación por email
      }
    });

    if (error) {
      return new Response(
        JSON.stringify({ 
          error: error.message,
          code: error.status,
          details: error
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Registro exitoso', data }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Error del servidor', details: error }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};