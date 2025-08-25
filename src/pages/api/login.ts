import type { APIRoute } from 'astro';
import { supabase } from '../../utils/supabaseClient';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    console.log('Intentando login:', { email }); // Solo para debug
    
    // Autenticación con Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Error de login:', error);
      return new Response(
        JSON.stringify({ 
          error: error.message,
          code: error.status
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener el perfil del usuario desde la tabla profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user?.id)
      .single();

    if (profileError) {
      console.error('Error obteniendo perfil:', profileError);
      // Aún así devolvemos éxito del login, el perfil se puede crear después
    }

    return new Response(
      JSON.stringify({ 
        message: 'Login exitoso', 
        user: data.user,
        profile: profile,
        session: data.session
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error del servidor:', error);
    return new Response(
      JSON.stringify({ error: 'Error del servidor', details: error }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};