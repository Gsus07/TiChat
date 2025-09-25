import { supabase } from '../utils/supabaseClient';

const usersData = [
  {
    username: 'GamerPro2024',
    display_name: 'Alex García',
    bio: 'Jugador apasionado de Minecraft y estrategias PvP',
    avatar_url: '/avatars/alex.jpg',
    is_verified: false
  },
  {
    username: 'BuilderMaster',
    display_name: 'María López',
    bio: 'Arquitecta virtual especializada en construcciones épicas',
    avatar_url: '/avatars/maria.jpg',
    is_verified: true
  },
  {
    username: 'RedstoneWizard',
    display_name: 'Carlos Ruiz',
    bio: 'Experto en redstone y automatización',
    avatar_url: '/avatars/carlos.jpg',
    is_verified: false
  },
  {
    username: 'PvPLegend',
    display_name: 'Ana Martín',
    bio: 'Campeona de torneos PvP y Call of Duty',
    avatar_url: '/avatars/ana.jpg',
    is_verified: true
  },
  {
    username: 'CreativeArtist',
    display_name: 'Diego Fernández',
    bio: 'Artista digital y creador de contenido',
    avatar_url: '/avatars/diego.jpg',
    is_verified: false
  },
  {
    username: 'SurvivalExpert',
    display_name: 'Laura Sánchez',
    bio: 'Especialista en supervivencia extrema',
    avatar_url: '/avatars/laura.jpg',
    is_verified: false
  },
  {
    username: 'ModdedGuru',
    display_name: 'Miguel Torres',
    bio: 'Experto en mods técnicos y configuraciones avanzadas',
    avatar_url: '/avatars/miguel.jpg',
    is_verified: true
  },
  {
    username: 'MinigameKing',
    display_name: 'Sofia Jiménez',
    bio: 'Reina de los minijuegos y eventos especiales',
    avatar_url: '/avatars/sofia.jpg',
    is_verified: false
  }
];

export async function seedUsers() {
  
  try {
    // Verificar si ya existen usuarios (además del usuario autenticado)
    const { data: existingUsers, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .limit(5);
    
    if (checkError) {
      throw checkError;
    }
    
    if (existingUsers && existingUsers.length >= 3) {
      return;
    }
    
    // Insertar usuarios demo
    const { data, error } = await supabase
      .from('profiles')
      .insert(usersData)
      .select();
    
    if (error) {
      throw error;
    }
    
  } catch (error) {
    throw error;
  }
}