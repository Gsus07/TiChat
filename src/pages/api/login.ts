import type { APIRoute } from 'astro';
import { supabase } from '../../utils/supabaseClient';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    // Autenticación con Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return new Response(
        JSON.stringify({ 
          error: error.message,
          code: error.status
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener el perfil del usuario desde la tabla profiles
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user?.id)
      .single();

    // Si el perfil no existe, crearlo automáticamente
    if (profileError && profileError.code === 'PGRST116') {
      
      // Verificar que el email existe antes de usarlo
      if (!data.user.email) {
        return new Response(JSON.stringify({ 
          error: 'Email del usuario no disponible' 
        }), { status: 400 });
      }
      
      // Generar username único basado en el email
      const baseUsername = data.user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      let username = baseUsername;
      let counter = 1;
      
      // Verificar si el username ya existe y generar uno único
      while (true) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username)
          .single();
        
        if (!existingProfile) {
          break; // Username disponible
        }
        
        username = `${baseUsername}${counter}`;
        counter++;
      }
      
      // Crear el perfil
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          username: username,
          full_name: data.user.user_metadata?.full_name || username,
          avatar_url: '/default-avatar.png',
          bio: null,
          user_role: 'user',
          is_active: true
        })
        .select()
        .single();
      
      if (createError) {
      } else {
        profile = newProfile;
        profileError = null;
      }
    } else if (profileError) {
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
    return new Response(
      JSON.stringify({ error: 'Error del servidor', details: error }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};