import { seedGames } from './games';
import { seedServers } from './servers';
import { seedUsers } from './users';
import { seedPosts } from './posts';
import { supabase } from '../utils/supabaseClient';

export async function runSeeders() {
  console.log('🌱 Iniciando seeders...');
  
  try {
    // Verificar conexión a Supabase
    const { data, error } = await supabase.from('games').select('count').limit(1);
    if (error) {
      throw new Error(`Error de conexión a Supabase: ${error.message}`);
    }
    
    console.log('✅ Conexión a Supabase establecida');
    
    // Ejecutar seeders en orden
    await seedGames();
    await seedServers();
    await seedUsers();
    await seedPosts();
    
    console.log('🎉 Seeders completados exitosamente');
  } catch (error) {
    console.error('❌ Error ejecutando seeders:', error);
    throw error;
  }
}

// Ejecutar seeders si este archivo se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runSeeders();
}