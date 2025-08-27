// Script para crear servidores de prueba
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.PUBLIC_SUPABASE_ANON_KEY
);

async function createTestServers() {
  try {
    console.log('Verificando juego de Minecraft...');
    
    // Obtener el juego de Minecraft
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id, name')
      .eq('name', 'Minecraft')
      .single();
    
    if (gameError || !game) {
      console.error('Error: No se encontró el juego de Minecraft:', gameError);
      return;
    }
    
    console.log('Juego encontrado:', game.name, 'ID:', game.id);
    
    // Verificar servidores existentes
    const { data: existingServers, error: serverError } = await supabase
      .from('game_servers')
      .select('id, name')
      .eq('game_id', game.id);
    
    if (serverError) {
      console.error('Error verificando servidores:', serverError);
      return;
    }
    
    console.log('Servidores existentes:', existingServers?.length || 0);
    
    if (existingServers && existingServers.length > 0) {
      console.log('Servidores encontrados:');
      existingServers.forEach(server => {
        console.log(`- ${server.name} (ID: ${server.id})`);
      });
      return;
    }
    
    // Crear servidores de prueba
    const testServers = [
      {
        game_id: game.id,
        name: 'Servidor Survival',
        description: 'Servidor de supervivencia clásico',
        server_ip: 'survival.minecraft.com',
        server_port: 25565,
        server_version: '1.20.1',
        max_players: 100,
        server_type: 'survival',
        is_active: true,
        is_featured: true,
        image_url: '/minecraft-survival.jpg'
      },
      {
        game_id: game.id,
        name: 'Servidor Creativo',
        description: 'Servidor creativo para construir',
        server_ip: 'creative.minecraft.com',
        server_port: 25565,
        server_version: '1.20.1',
        max_players: 50,
        server_type: 'creative',
        is_active: true,
        is_featured: true,
        image_url: '/minecraft-creative.jpg'
      },
      {
        game_id: game.id,
        name: 'Servidor PvP',
        description: 'Servidor PvP con arenas',
        server_ip: 'pvp.minecraft.com',
        server_port: 25565,
        server_version: '1.20.1',
        max_players: 80,
        server_type: 'pvp',
        is_active: true,
        is_featured: true,
        image_url: '/minecraft-pvp.jpg'
      }
    ];
    
    console.log('Creando servidores de prueba...');
    
    for (const serverData of testServers) {
      const { data, error } = await supabase
        .from('game_servers')
        .insert(serverData)
        .select()
        .single();
      
      if (error) {
        console.error(`Error creando servidor ${serverData.name}:`, error);
      } else {
        console.log(`✅ Servidor creado: ${data.name} (ID: ${data.id})`);
      }
    }
    
    console.log('\n✅ Proceso completado!');
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

createTestServers();