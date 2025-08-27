import { supabase } from '../utils/supabaseClient';
import { getGameByName } from '../utils/games';

const serversData = [
  {
    name: 'Servidor Survival',
    description: 'Servidor de supervivencia clásico con economía y protecciones',
    ip_address: 'survival.minecraft.com',
    port: 25565,
    version: '1.20.1',
    max_players: 100,
    current_players: 45,
    is_online: true,
    game_name: 'Minecraft'
  },
  {
    name: 'Servidor Creativo',
    description: 'Servidor creativo para construir sin límites',
    ip_address: 'creative.minecraft.com',
    port: 25565,
    version: '1.20.1',
    max_players: 50,
    current_players: 23,
    is_online: true,
    game_name: 'Minecraft'
  },
  {
    name: 'Servidor PvP',
    description: 'Servidor PvP con arenas y torneos',
    ip_address: 'pvp.minecraft.com',
    port: 25565,
    version: '1.20.1',
    max_players: 80,
    current_players: 67,
    is_online: true,
    game_name: 'Minecraft'
  },
  {
    name: 'Servidor Minijuegos',
    description: 'Servidor con múltiples minijuegos y eventos',
    ip_address: 'minigames.minecraft.com',
    port: 25565,
    version: '1.20.1',
    max_players: 200,
    current_players: 156,
    is_online: true,
    game_name: 'Minecraft'
  },
  {
    name: 'Servidor Modded',
    description: 'Servidor con mods técnicos y de magia',
    ip_address: 'modded.minecraft.com',
    port: 25565,
    version: '1.19.2',
    max_players: 60,
    current_players: 34,
    is_online: true,
    game_name: 'Minecraft'
  }
];

export async function seedServers() {
  console.log('🖥️  Seeding servers...');
  
  try {
    // Verificar si ya existen servidores
    const { data: existingServers, error: checkError } = await supabase
      .from('game_servers')
      .select('id')
      .limit(1);
    
    if (checkError) {
      throw checkError;
    }
    
    if (existingServers && existingServers.length > 0) {
      console.log('⚠️  Los servidores ya existen, saltando seeder de servers');
      return;
    }
    
    // Obtener el ID del juego Minecraft
    const minecraftGameResult = await getGameByName('Minecraft');
    if (!minecraftGameResult.data) {
      throw new Error('Juego Minecraft no encontrado');
    }
    const minecraftGame = minecraftGameResult.data;
    
    // Preparar datos de servidores con game_id
    const serversWithGameId = serversData.map(server => ({
      name: server.name,
      description: server.description,
      server_ip: server.ip_address,
      server_port: server.port,
      server_version: server.version,
      max_players: server.max_players,
      server_type: 'survival',
      is_active: server.is_online,
      game_id: minecraftGame.id
    }));
    
    // Insertar servidores
    const { data, error } = await supabase
      .from('game_servers')
      .insert(serversWithGameId)
      .select();
    
    if (error) {
      throw error;
    }
    
    console.log(`✅ ${data?.length || 0} servidores creados exitosamente`);
    
  } catch (error) {
    console.error('❌ Error seeding servers:', error);
    throw error;
  }
}