// Script para probar la creación de servidores de Minecraft
// Ejecutar en la consola del navegador

console.log('🎮 Iniciando prueba de creación de servidor de Minecraft...');

// Función para simular autenticación
function simulateAuth() {
  // Simular usuario autenticado
  const mockUser = {
    id: 'test-user-123',
    email: 'test@example.com'
  };
  
  // Guardar en localStorage para simular sesión
  localStorage.setItem('supabase.auth.token', JSON.stringify({
    access_token: 'mock-token',
    user: mockUser
  }));
  
  console.log('✅ Usuario simulado autenticado:', mockUser);
  return mockUser;
}

// Función para probar la creación de servidor
async function testServerCreation() {
  try {
    console.log('📝 Preparando datos del servidor...');
    
    const serverData = {
      name: 'Servidor de Prueba ' + Date.now(),
      description: 'Servidor creado para pruebas de funcionalidad',
      game_id: 1, // ID de Minecraft
      server_type: 'survival',
      max_players: 20,
      ip_address: '192.168.1.100',
      port: 25565,
      version: '1.20.1',
      owner_id: 'test-user-123'
    };
    
    console.log('📊 Datos del servidor:', serverData);
    
    // Verificar si existe la función createServer
    if (typeof window.createServer === 'function') {
      console.log('🔧 Usando función createServer del window...');
      const result = await window.createServer(serverData);
      console.log('📤 Resultado de createServer:', result);
    } else {
      console.log('🌐 Enviando petición directa a la API...');
      
      // Hacer petición directa a la API
      const response = await fetch('/api/servers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serverData)
      });
      
      console.log('📡 Respuesta HTTP:', response.status, response.statusText);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Servidor creado exitosamente:', result);
      } else {
        const error = await response.text();
        console.error('❌ Error al crear servidor:', error);
      }
    }
    
  } catch (error) {
    console.error('💥 Error durante la prueba:', error);
    console.error('📋 Stack trace:', error.stack);
  }
}

// Función para verificar el estado de Supabase
function checkSupabaseConnection() {
  console.log('🔍 Verificando conexión a Supabase...');
  
  // Verificar si Supabase está disponible
  if (typeof window.supabase !== 'undefined') {
    console.log('✅ Cliente Supabase disponible');
    return true;
  } else {
    console.warn('⚠️ Cliente Supabase no encontrado en window');
    return false;
  }
}

// Función para monitorear errores de red
function monitorNetworkErrors() {
  console.log('📡 Monitoreando errores de red...');
  
  // Interceptar fetch para capturar errores
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    try {
      console.log('🌐 Petición fetch:', args[0]);
      const response = await originalFetch.apply(this, args);
      
      if (!response.ok) {
        console.error('❌ Error en petición:', {
          url: args[0],
          status: response.status,
          statusText: response.statusText
        });
      }
      
      return response;
    } catch (error) {
      console.error('💥 Error de red:', error);
      throw error;
    }
  };
}

// Función principal de prueba
async function runTest() {
  console.log('🚀 Ejecutando prueba completa de creación de servidor...');
  
  // 1. Monitorear errores de red
  monitorNetworkErrors();
  
  // 2. Verificar conexión a Supabase
  checkSupabaseConnection();
  
  // 3. Simular autenticación
  simulateAuth();
  
  // 4. Esperar un momento para que se carguen los componentes
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 5. Probar creación de servidor
  await testServerCreation();
  
  console.log('🏁 Prueba completada. Revisa los logs anteriores para ver los resultados.');
}

// Ejecutar la prueba
runTest().catch(error => {
  console.error('💥 Error fatal en la prueba:', error);
});

// Exportar funciones para uso manual
window.testMinecraftServer = {
  runTest,
  testServerCreation,
  simulateAuth,
  checkSupabaseConnection
};

console.log('📚 Funciones disponibles en window.testMinecraftServer:', Object.keys(window.testMinecraftServer));