// Script para verificar servidores en la base de datos
import { supabase } from './src/utils/supabaseClient.js';

async function checkServers() {
  try {
    console.log('Verificando servidores en la base de datos...');
    
    const { data: servers, error } = await supabase
      .from('game_servers')
      .select(`
        id,
        name,
        game_id,
        is_active,
        games(name)
      `)
      .eq('is_active', true);
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log('Servidores encontrados:', servers?.length || 0);
    
    if (servers && servers.length > 0) {
      servers.forEach(server => {
        console.log(`- ${server.name} (ID: ${server.id}) - Juego: ${server.games?.name}`);
      });
    } else {
      console.log('No se encontraron servidores activos.');
    }
    
  } catch (error) {
    console.error('Error ejecutando consulta:', error);
  }
}

checkServers();