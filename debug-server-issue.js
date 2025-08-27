// Script de diagnóstico para el problema de creación de servidores
console.log('🔍 Iniciando diagnóstico del problema de creación de servidores...');

// Función para verificar el estado de la aplicación
function checkAppState() {
  console.log('📊 Verificando estado de la aplicación...');
  
  // Verificar Supabase
  if (window.supabase) {
    console.log('✅ Supabase está disponible');
  } else {
    console.error('❌ Supabase NO está disponible');
    return false;
  }
  
  // Verificar sesión
  window.supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      console.log('✅ Usuario autenticado:', session.user.email);
    } else {
      console.error('❌ No hay sesión activa');
    }
  });
  
  return true;
}

// Función para probar el endpoint directamente
async function testEndpoint() {
  try {
    console.log('🧪 Probando endpoint /api/servers...');
    
    const { data: { session } } = await window.supabase.auth.getSession();
    
    if (!session) {
      console.error('❌ No hay sesión para probar el endpoint');
      return;
    }
    
    const testData = {
      name: 'Test Server ' + Date.now(),
      description: 'Servidor de prueba para diagnóstico',
      server_ip: '127.0.0.1',
      server_port: 25565,
      server_version: '1.20.1',
      max_players: 20,
      server_type: 'survival',
      game_id: 1
    };
    
    console.log('📤 Enviando datos:', testData);
    
    const response = await fetch('/api/servers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📥 Respuesta del servidor:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    const result = await response.json();
    console.log('📋 Contenido de la respuesta:', result);
    
    if (response.ok) {
      console.log('🎉 ¡Endpoint funcionando correctamente!');
    } else {
      console.error('❌ Error en el endpoint:', result.error);
    }
    
  } catch (error) {
    console.error('💥 Error al probar endpoint:', error);
  }
}

// Función para verificar el modal
function checkModal() {
  console.log('🔍 Verificando modal de agregar servidor...');
  
  const modal = document.querySelector('[data-testid="add-server-modal"]') || 
                document.querySelector('.add-server-modal') ||
                document.querySelector('[class*="modal"]');
  
  if (modal) {
    console.log('✅ Modal encontrado:', modal);
  } else {
    console.log('⚠️ Modal no encontrado en el DOM');
  }
  
  // Buscar botón de agregar servidor
  const addButton = document.querySelector('[data-testid="add-server-btn"]') ||
                   document.querySelector('.add-server-btn') ||
                   document.querySelector('button[aria-label*="agregar"]') ||
                   document.querySelector('button[aria-label*="add"]');
  
  if (addButton) {
    console.log('✅ Botón de agregar servidor encontrado:', addButton);
  } else {
    console.log('⚠️ Botón de agregar servidor no encontrado');
  }
}

// Función para interceptar errores de red
function interceptNetworkErrors() {
  console.log('🕵️ Interceptando errores de red...');
  
  // Interceptar fetch
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    console.log('🌐 Fetch interceptado:', args[0]);
    try {
      const response = await originalFetch.apply(this, args);
      console.log('📡 Respuesta fetch:', response.status, response.statusText);
      return response;
    } catch (error) {
      console.error('💥 Error en fetch:', error);
      throw error;
    }
  };
  
  // Interceptar errores de ventana
  window.addEventListener('error', (event) => {
    console.error('🚨 Error de ventana:', event.error);
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Promesa rechazada:', event.reason);
  });
}

// Función principal de diagnóstico
async function runDiagnostic() {
  console.log('🚀 Ejecutando diagnóstico completo...');
  
  // 1. Interceptar errores
  interceptNetworkErrors();
  
  // 2. Verificar estado de la app
  checkAppState();
  
  // 3. Verificar modal
  checkModal();
  
  // 4. Probar endpoint
  await testEndpoint();
  
  console.log('✨ Diagnóstico completado');
}

// Hacer funciones disponibles globalmente
window.debugServer = {
  runDiagnostic,
  checkAppState,
  testEndpoint,
  checkModal,
  interceptNetworkErrors
};

console.log('📚 Funciones de diagnóstico disponibles:');
console.log('- window.debugServer.runDiagnostic() - Ejecutar diagnóstico completo');
console.log('- window.debugServer.testEndpoint() - Probar endpoint directamente');
console.log('- window.debugServer.checkAppState() - Verificar estado de la app');
console.log('- window.debugServer.checkModal() - Verificar modal');

console.log('🎯 Para ejecutar el diagnóstico completo, usa: window.debugServer.runDiagnostic()');