import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Cargar variables de entorno
config();

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.PUBLIC_SUPABASE_ANON_KEY
);

async function verifyDatabase() {
  console.log('🔍 Verificando datos en la base de datos...');
  
  try {
    // Verificar juegos
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('*');
    
    if (gamesError) {
      console.error('❌ Error obteniendo juegos:', gamesError);
    } else {
      console.log(`✅ Juegos encontrados: ${games?.length || 0}`);
      games?.forEach(game => {
        console.log(`  - ${game.name} (ID: ${game.id})`);
      });
    }
    
    // Verificar servidores
    const { data: servers, error: serversError } = await supabase
      .from('game_servers')
      .select('*');
    
    if (serversError) {
      console.error('❌ Error obteniendo servidores:', serversError);
    } else {
      console.log(`\n✅ Servidores encontrados: ${servers?.length || 0}`);
      servers?.forEach(server => {
        console.log(`  - ${server.name} (ID: ${server.id}, Game ID: ${server.game_id})`);
      });
    }
    
    // Buscar específicamente Minecraft
    const { data: minecraft, error: minecraftError } = await supabase
      .from('games')
      .select('*')
      .eq('name', 'Minecraft')
      .single();
    
    if (minecraftError) {
      console.error('\n❌ Error buscando Minecraft:', minecraftError);
    } else {
      console.log('\n✅ Minecraft encontrado:', minecraft);
      
      // Buscar servidores de Minecraft
      const { data: minecraftServers, error: mcServersError } = await supabase
        .from('game_servers')
        .select('*')
        .eq('game_id', minecraft.id);
      
      if (mcServersError) {
        console.error('❌ Error obteniendo servidores de Minecraft:', mcServersError);
      } else {
        console.log(`✅ Servidores de Minecraft: ${minecraftServers?.length || 0}`);
        minecraftServers?.forEach(server => {
          console.log(`  - ${server.name} (ID: ${server.id})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

verifyDatabase();