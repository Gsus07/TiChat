// Script de prueba simple para verificar creación de servidores
console.log('🚀 Iniciando prueba de creación de servidor Minecraft...');

// Función para probar el endpoint directamente
async function testServerEndpoint() {
  try {
    console.log('📡 Probando endpoint /api/servers...');
    
    // Datos de prueba para servidor Minecraft
    const serverData = {
      name: 'Test Minecraft Server ' + Date.now(),
      description: 'Servidor de prueba creado automáticamente',
      ip: '127.0.0.1',
      port: 25565,
      version: '1.20.1',
      game_id: 1, // Asumiendo que Minecraft tiene ID 1
      max_players: 20,
      is_public: true
    };
    
    console.log('📝 Datos del servidor:', serverData);
    
    // Obtener sesión actual
    if (typeof window !== 'undefined' && window.supabase) {
      const { data: { session } } = await window.supabase.auth.getSession();
      
      if (!session) {
        console.error('❌ No hay sesión activa. Por favor inicia sesión primero.');
        return;
      }
      
      console.log('✅ Sesión encontrada para usuario:', session.user.email);
      
      // Hacer petición al endpoint
      const response = await fetch('/api/servers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(serverData)
      });
      
      console.log('📊 Respuesta del servidor:', response.status, response.statusText);
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('🎉 ¡Servidor creado exitosamente!');
        console.log('📋 Datos del servidor creado:', result);
        
        // Verificar en la base de datos
        const { data: servers, error } = await window.supabase
          .from('game_servers')
          .select('*')
          .eq('name', serverData.name);
          
        if (error) {
          console.error('❌ Error al verificar en la base de datos:', error);
        } else if (servers && servers.length > 0) {
          console.log('✅ Servidor verificado en la base de datos:', servers[0]);
        } else {
          console.warn('⚠️ Servidor no encontrado en la base de datos');
        }
      } else {
        console.error('❌ Error al crear servidor:', result);
      }
    } else {
      console.error('❌ Supabase no está disponible. Asegúrate de estar en la página correcta.');
    }
  } catch (error) {
    console.error('💥 Error durante la prueba:', error);
  }
}

// Función para verificar la estructura de la base de datos
async function checkDatabaseStructure() {
  try {
    console.log('🔍 Verificando estructura de la base de datos...');
    
    if (typeof window !== 'undefined' && window.supabase) {
      // Verificar tabla game_servers
      const { data: servers, error: serversError } = await window.supabase
        .from('game_servers')
        .select('*')
        .limit(1);
        
      if (serversError) {
        console.error('❌ Error al acceder a game_servers:', serversError);
      } else {
        console.log('✅ Tabla game_servers accesible');
      }
      
      // Verificar tabla games
      const { data: games, error: gamesError } = await window.supabase
        .from('games')
        .select('*')
        .limit(5);
        
      if (gamesError) {
        console.error('❌ Error al acceder a games:', gamesError);
      } else {
        console.log('✅ Tabla games accesible. Juegos disponibles:', games);
      }
    }
  } catch (error) {
    console.error('💥 Error al verificar base de datos:', error);
  }
}

// Ejecutar pruebas
async function runAllTests() {
  console.log('🧪 Ejecutando todas las pruebas...');
  await checkDatabaseStructure();
  await testServerEndpoint();
  console.log('✨ Pruebas completadas');
}

// Hacer funciones disponibles globalmente
if (typeof window !== 'undefined') {
  window.testServerCreation = {
    runAllTests,
    testServerEndpoint,
    checkDatabaseStructure
  };
  
  console.log('📚 Funciones disponibles:');
  console.log('- window.testServerCreation.runAllTests()');
  console.log('- window.testServerCreation.testServerEndpoint()');
  console.log('- window.testServerCreation.checkDatabaseStructure()');
}

// Auto-ejecutar si se carga el script
if (typeof window !== 'undefined') {
  console.log('🎯 Para ejecutar la prueba, usa: window.testServerCreation.runAllTests()');
}