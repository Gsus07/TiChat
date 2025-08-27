// Script detallado para probar la creación de servidores paso a paso
console.log('🔍 Iniciando prueba detallada de creación de servidores...');

// Función para verificar la sesión del usuario
function checkUserSession() {
  console.log('👤 Verificando sesión del usuario...');
  
  const userSession = localStorage.getItem('userSession') || sessionStorage.getItem('userSession');
  
  if (!userSession) {
    console.error('❌ No hay sesión de usuario');
    return null;
  }
  
  try {
    const session = JSON.parse(userSession);
    console.log('✅ Sesión encontrada:', session.user);
    return session;
  } catch (error) {
    console.error('❌ Error parseando sesión:', error);
    return null;
  }
}

// Función para probar getGameByName
async function testGetGameByName() {
  console.log('🎮 Probando getGameByName...');
  
  try {
    // Simular la función getGameByName
    const response = await fetch('/api/games?name=Minecraft');
    
    if (!response.ok) {
      console.error('❌ Error en la respuesta de games:', response.status, response.statusText);
      return null;
    }
    
    const result = await response.json();
    console.log('✅ Resultado de getGameByName:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Error en getGameByName:', error);
    return null;
  }
}

// Función para probar el endpoint de servidores
async function testServerEndpoint(gameData, userData) {
  console.log('🖥️ Probando endpoint /api/servers...');
  
  const testServerData = {
    game_id: gameData.id,
    name: 'Test Server ' + Date.now(),
    description: 'Servidor de prueba para diagnóstico',
    server_ip: '127.0.0.1',
    server_port: 25565,
    server_version: '1.20.1',
    max_players: 20,
    server_type: 'survival',
    is_active: true,
    is_featured: false,
    owner_id: userData.id
  };
  
  console.log('📤 Datos a enviar:', testServerData);
  
  try {
    const response = await fetch('/api/servers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer fake-token` // Simular token
      },
      body: JSON.stringify(testServerData)
    });
    
    console.log('📥 Respuesta del servidor:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    const result = await response.json();
    console.log('📋 Contenido de la respuesta:', result);
    
    return { response, result };
    
  } catch (error) {
    console.error('💥 Error en el endpoint:', error);
    return null;
  }
}

// Función para verificar si existe el juego Minecraft en la base de datos
async function checkMinecraftGame() {
  console.log('🔍 Verificando si existe el juego Minecraft...');
  
  try {
    const response = await fetch('/api/games');
    
    if (!response.ok) {
      console.error('❌ Error obteniendo juegos:', response.status);
      return null;
    }
    
    const games = await response.json();
    console.log('🎮 Juegos disponibles:', games);
    
    const minecraft = games.find(game => game.name === 'Minecraft');
    
    if (minecraft) {
      console.log('✅ Minecraft encontrado:', minecraft);
      return minecraft;
    } else {
      console.error('❌ Minecraft NO encontrado en la base de datos');
      return null;
    }
    
  } catch (error) {
    console.error('💥 Error verificando Minecraft:', error);
    return null;
  }
}

// Función principal de prueba
async function runDetailedTest() {
  console.log('🚀 Ejecutando prueba detallada...');
  
  // 1. Verificar sesión del usuario
  const userSession = checkUserSession();
  if (!userSession) {
    console.error('🛑 No se puede continuar sin sesión de usuario');
    return;
  }
  
  // 2. Verificar que existe Minecraft en la BD
  const minecraftGame = await checkMinecraftGame();
  if (!minecraftGame) {
    console.error('🛑 No se puede continuar sin el juego Minecraft');
    return;
  }
  
  // 3. Probar getGameByName
  const gameResult = await testGetGameByName();
  if (!gameResult) {
    console.error('🛑 getGameByName falló');
    return;
  }
  
  // 4. Probar endpoint de servidores
  const serverResult = await testServerEndpoint(minecraftGame, userSession.user);
  if (!serverResult) {
    console.error('🛑 Endpoint de servidores falló');
    return;
  }
  
  console.log('✨ Prueba detallada completada');
}

// Hacer funciones disponibles globalmente
window.detailedServerTest = {
  runDetailedTest,
  checkUserSession,
  testGetGameByName,
  testServerEndpoint,
  checkMinecraftGame
};

console.log('📚 Funciones de prueba detallada disponibles:');
console.log('- window.detailedServerTest.runDetailedTest() - Ejecutar prueba completa');
console.log('- window.detailedServerTest.checkUserSession() - Verificar sesión');
console.log('- window.detailedServerTest.checkMinecraftGame() - Verificar Minecraft en BD');

console.log('🎯 Para ejecutar la prueba completa, usa: window.detailedServerTest.runDetailedTest()');