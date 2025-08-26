import { supabase } from '../utils/supabaseClient';

const gamesData = [
  {
    name: 'Minecraft',
    description: 'Un juego de construcción y supervivencia en un mundo de bloques infinito',
    image_url: '/minecraft-bg.jpg',
    category: 'Sandbox',
    is_active: true
  },
  {
    name: 'Among Us',
    description: 'Juego de deducción social donde debes encontrar al impostor',
    image_url: '/among-us-bg.jpg',
    category: 'Social Deduction',
    is_active: true
  },
  {
    name: 'Call of Duty',
    description: 'Shooter en primera persona con modos multijugador competitivos',
    image_url: '/cod-bg.jpg',
    category: 'FPS',
    is_active: true
  },
  {
    name: 'Fortnite',
    description: 'Battle royale con construcción y elementos únicos',
    image_url: '/fortnite-bg.jpg',
    category: 'Battle Royale',
    is_active: true
  },
  {
    name: 'Pinturillo',
    description: 'Juego de dibujo y adivinanzas online',
    image_url: '/pinturillo-bg.jpg',
    category: 'Party Game',
    is_active: true
  },
  {
    name: 'UNO',
    description: 'El clásico juego de cartas ahora en versión digital',
    image_url: '/uno-bg.jpg',
    category: 'Card Game',
    is_active: true
  }
];

export async function seedGames() {
  console.log('🎮 Seeding games...');
  
  try {
    // Verificar si ya existen juegos
    const { data: existingGames, error: checkError } = await supabase
      .from('games')
      .select('id')
      .limit(1);
    
    if (checkError) {
      throw checkError;
    }
    
    if (existingGames && existingGames.length > 0) {
      console.log('⚠️  Los juegos ya existen, saltando seeder de games');
      return;
    }
    
    // Insertar juegos
    const { data, error } = await supabase
      .from('games')
      .insert(gamesData)
      .select();
    
    if (error) {
      throw error;
    }
    
    console.log(`✅ ${data?.length || 0} juegos creados exitosamente`);
    
  } catch (error) {
    console.error('❌ Error seeding games:', error);
    throw error;
  }
}