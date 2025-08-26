import { supabase } from '../utils/supabaseClient';
import { getGameByName, getServerByName } from '../utils/games';

const postsData = [
  // Posts para Minecraft Survival
  {
    content: '¡Acabo de terminar mi castillo medieval! Me tomó 3 semanas pero valió la pena cada bloque colocado 🏰',
    image_url: '/posts/castle.jpg',
    game_name: 'Minecraft',
    server_name: 'Servidor Survival',
    author_username: 'BuilderMaster'
  },
  {
    content: 'Encontré una mina de diamantes increíble en las coordenadas -1250, 12, 890. ¡Hay suficientes para todos!',
    game_name: 'Minecraft',
    server_name: 'Servidor Survival',
    author_username: 'SurvivalExpert'
  },
  {
    content: 'Mi granja automática de trigo ya está funcionando. Produce 2 stacks por hora sin intervención manual',
    image_url: '/posts/farm.jpg',
    game_name: 'Minecraft',
    server_name: 'Servidor Survival',
    author_username: 'RedstoneWizard'
  },
  
  // Posts para Minecraft Creativo
  {
    content: 'Estoy recreando la Torre Eiffel a escala 1:1. Ya llevo 200 bloques de altura y se ve espectacular',
    image_url: '/posts/eiffel.jpg',
    game_name: 'Minecraft',
    server_name: 'Servidor Creativo',
    author_username: 'CreativeArtist'
  },
  {
    content: 'Tutorial: Cómo hacer círculos perfectos en Minecraft. Link en mi perfil para el video completo',
    game_name: 'Minecraft',
    server_name: 'Servidor Creativo',
    author_username: 'BuilderMaster'
  },
  
  // Posts para Minecraft PvP
  {
    content: '¡15 kills seguidos en la arena! Mi nueva estrategia con arco está funcionando perfectamente 🏹',
    game_name: 'Minecraft',
    server_name: 'Servidor PvP',
    author_username: 'PvPLegend'
  },
  {
    content: 'Torneo de PvP este sábado a las 20:00. Premio: 64 diamantes para el ganador. ¡Apúntense!',
    game_name: 'Minecraft',
    server_name: 'Servidor PvP',
    author_username: 'GamerPro2024'
  },
  
  // Posts para Minecraft Minijuegos
  {
    content: 'Nuevo récord en SkyWars: 8 victorias consecutivas. La clave está en controlar el centro rápidamente',
    game_name: 'Minecraft',
    server_name: 'Servidor Minijuegos',
    author_username: 'MinigameKing'
  },
  {
    content: 'El nuevo minijuego de parkour está increíble. Nivel de dificultad perfecto, ni muy fácil ni imposible',
    game_name: 'Minecraft',
    server_name: 'Servidor Minijuegos',
    author_username: 'GamerPro2024'
  },
  
  // Posts para Minecraft Modded
  {
    content: 'Mi reactor nuclear ya está generando 10,000 RF/t. El mod Industrial Craft es increíble ⚡',
    image_url: '/posts/reactor.jpg',
    game_name: 'Minecraft',
    server_name: 'Servidor Modded',
    author_username: 'ModdedGuru'
  },
  {
    content: 'Guía completa de Thaumcraft para principiantes. Los aspectos básicos explicados paso a paso',
    game_name: 'Minecraft',
    server_name: 'Servidor Modded',
    author_username: 'RedstoneWizard'
  },
  
  // Posts para Among Us
  {
    content: '¡Gané como impostor sin que nadie sospechara! La clave fue actuar natural en las tareas 🕵️',
    game_name: 'Among Us'
  },
  {
    content: 'Estrategia pro: siempre ve a electrical al principio. Si hay un impostor, lo pillarás fácil',
    game_name: 'Among Us'
  },
  
  // Posts para Call of Duty
  {
    content: '¡Victoria épica en Warzone! El círculo final fue intenso, tuve que usar todas mis granadas 💣',
    image_url: '/posts/warzone.jpg',
    game_name: 'Call of Duty'
  },
  {
    content: 'Mi nueva configuración de AK-47: mira holográfica, silenciador y empuñadura. Funciona increíble',
    game_name: 'Call of Duty'
  },
  
  // Posts para Pinturillo
  {
    content: '¡Nadie adivinó mi dibujo de "elefante"! Admito que parecía más un ratón gigante 🐭🎨',
    game_name: 'Pinturillo'
  },
  {
    content: 'Consejo: cuando no sepas qué dibujar, empieza con formas básicas. Círculos y líneas salvan vidas',
    game_name: 'Pinturillo'
  }
];

export async function seedPosts() {
  console.log('📝 Seeding posts...');
  
  try {
    // Verificar si ya existen posts
    const { data: existingPosts, error: checkError } = await supabase
      .from('posts')
      .select('id')
      .limit(1);
    
    if (checkError) {
      throw checkError;
    }
    
    if (existingPosts && existingPosts.length > 0) {
      console.log('⚠️  Los posts ya existen, saltando seeder de posts');
      return;
    }
    
    // Obtener usuarios para asignar como autores
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username');
    
    if (usersError) {
      throw usersError;
    }
    
    if (!users || users.length === 0) {
      console.log('⚠️  No hay usuarios disponibles, saltando seeder de posts');
      return;
    }
    
    // Crear un mapa de usernames a IDs
    const userMap = new Map(users.map((user: any) => [user.username, user.id]));
    
    // Procesar posts
    const processedPosts = [];
    
    for (const post of postsData) {
      try {
        // Obtener game_id
        const gameResult = await getGameByName(post.game_name);
        if (!gameResult.data) {
          console.warn(`Juego ${post.game_name} no encontrado, saltando post`);
          continue;
        }
        const game = gameResult.data;
        
        // Obtener server_id si aplica
        let server_id = null;
        if (post.server_name) {
          const serverResult = await getServerByName(post.server_name);
          if (serverResult.data) {
            server_id = serverResult.data.id;
          }
        }
        
        // Obtener author_id
        let author_id = null;
        if (post.author_username && userMap.has(post.author_username)) {
          author_id = userMap.get(post.author_username);
        } else {
          // Asignar un usuario aleatorio si no se especifica
          const randomUser = users[Math.floor(Math.random() * users.length)];
          author_id = randomUser.id;
        }
        
        processedPosts.push({
          content: post.content,
          image_url: post.image_url || null,
          game_id: game.id,
          server_id: server_id,
          author_id: author_id,
          likes_count: Math.floor(Math.random() * 50) + 1, // 1-50 likes aleatorios
          comments_count: Math.floor(Math.random() * 20) + 1 // 1-20 comentarios aleatorios
        });
      } catch (error) {
        console.warn(`Error procesando post: ${error}`);
        continue;
      }
    }
    
    if (processedPosts.length === 0) {
      console.log('⚠️  No se pudieron procesar posts');
      return;
    }
    
    // Insertar posts
    const { data, error } = await supabase
      .from('posts')
      .insert(processedPosts)
      .select();
    
    if (error) {
      throw error;
    }
    
    console.log(`✅ ${data?.length || 0} posts creados exitosamente`);
    
  } catch (error) {
    console.error('❌ Error seeding posts:', error);
    throw error;
  }
}