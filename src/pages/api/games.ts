import type { APIRoute } from 'astro';
import { supabase } from '../../utils/supabaseClient';

export const GET: APIRoute = async ({ request }) => {
  try {
    console.log('🎮 API /api/games - Recibiendo petición GET');
    
    const url = new URL(request.url);
    const name = url.searchParams.get('name');
    const id = url.searchParams.get('id');
    
    if (name) {
      // Buscar juego por nombre
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('name', name)
        .eq('is_active', true)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return new Response(
            JSON.stringify({ error: 'Juego no encontrado' }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          );
        }
        console.error('❌ Error obteniendo juego por nombre:', error);
        return new Response(
          JSON.stringify({ error: 'Error al obtener juego' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('✅ Juego encontrado por nombre:', data.name);
      return new Response(
        JSON.stringify({ success: true, data }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (id) {
      // Buscar juego por ID
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return new Response(
            JSON.stringify({ error: 'Juego no encontrado' }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          );
        }
        console.error('❌ Error obteniendo juego por ID:', error);
        return new Response(
          JSON.stringify({ error: 'Error al obtener juego' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('✅ Juego encontrado por ID:', data.name);
      return new Response(
        JSON.stringify({ success: true, data }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Si no se especifica nombre ni ID, obtener todos los juegos
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) {
      console.error('❌ Error obteniendo juegos:', error);
      return new Response(
        JSON.stringify({ error: 'Error al obtener juegos' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`✅ ${data?.length || 0} juegos obtenidos`);
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: data || [],
        count: data?.length || 0
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('💥 Error en API /api/games:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};