import { seedGames } from './games';
import { seedServers } from './servers';
import { seedUsers } from './users';
import { seedPosts } from './posts';
import { supabase } from '../utils/supabaseClient';

export async function runSeeders() {
  
  try {
    // Verificar conexión a Supabase
    const { data, error } = await supabase.from('games').select('count').limit(1);
    if (error) {
      throw new Error(`Error de conexión a Supabase: ${error.message}`);
    }
    
    // Ejecutar seeders en orden
    await seedGames();
    await seedServers();
    await seedUsers();
    await seedPosts();
    
  } catch (error) {
    throw error;
  }
}

// Ejecutar seeders si este archivo se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runSeeders();
}