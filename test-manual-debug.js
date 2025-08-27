// Script de diagnóstico manual para ejecutar en la consola del navegador
// Copiar y pegar en la consola de Chrome DevTools

console.log('🔍 Iniciando diagnóstico manual de AddServerModal...');

// 1. Verificar que Supabase esté disponible
function checkSupabase() {
  console.log('\n=== 1. VERIFICANDO SUPABASE ===');
  if (window.supabase) {
    console.log('✅ Supabase disponible:', window.supabase);
    return true;
  } else {
    console.log('❌ Supabase no disponible');
    return false;
  }
}

// 2. Verificar sesión de usuario
async function checkUserSession() {
  console.log('\n=== 2. VERIFICANDO SESIÓN DE USUARIO ===');
  try {
    const { data: { session }, error } = await window.supabase.auth.getSession();
    if (error) {
      console.log('❌ Error obteniendo sesión:', error);
      return null;
    }
    if (session) {
      console.log('✅ Usuario autenticado:', session.user.email);
      return session;
    } else {
      console.log('⚠️ No hay sesión activa');
      return null;
    }
  } catch (error) {
    console.log('❌ Error verificando sesión:', error);
    return null;
  }
}

// 3. Probar getGameByName
async function testGetGameByName() {
  console.log('\n=== 3. PROBANDO getGameByName ===');
  try {
    const { data, error } = await window.supabase
      .from('games')
      .select('*')
      .eq('name', 'Minecraft')
      .eq('is_active', true)
      .single();
    
    if (error) {
      console.log('❌ Error en getGameByName:', error);
      return null;
    }
    
    console.log('✅ Juego encontrado:', data);
    return data;
  } catch (error) {
    console.log('❌ Error ejecutando getGameByName:', error);
    return null;
  }
}

// 4. Probar endpoint /api/servers
async function testServersEndpoint(gameId, session) {
  console.log('\n=== 4. PROBANDO ENDPOINT /api/servers ===');
  
  const serverData = {
    name: 'Test Server Manual',
    description: 'Servidor de prueba manual',
    ip: '127.0.0.1',
    port: 25565,
    version: '1.20.1',
    server_type: 'survival',
    max_players: 20,
    game_id: gameId,
    image_url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
  };
  
  console.log('📤 Enviando datos:', serverData);
  
  try {
    const response = await fetch('/api/servers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(serverData)
    });
    
    console.log('📡 Respuesta del servidor:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    const responseText = await response.text();
    console.log('📄 Contenido de la respuesta:', responseText);
    
    if (response.ok) {
      try {
        const responseData = JSON.parse(responseText);
        console.log('✅ Servidor creado exitosamente:', responseData);
        return responseData;
      } catch (parseError) {
        console.log('⚠️ Respuesta exitosa pero no es JSON válido:', responseText);
        return { success: true, response: responseText };
      }
    } else {
      console.log('❌ Error del servidor:', response.status, responseText);
      return null;
    }
  } catch (error) {
    console.log('❌ Error de red:', error);
    return null;
  }
}

// 5. Buscar el botón de agregar servidor
function findAddServerButton() {
  console.log('\n=== 5. BUSCANDO BOTÓN DE AGREGAR SERVIDOR ===');
  
  // Buscar por ID
  let button = document.getElementById('addServerBtn');
  if (button) {
    console.log('✅ Botón encontrado por ID:', button);
    return button;
  }
  
  // Buscar por texto
  const buttons = Array.from(document.querySelectorAll('button'));
  button = buttons.find(btn => 
    btn.textContent.includes('Agregar Servidor') || 
    btn.textContent.includes('Add Server') ||
    btn.textContent.includes('+')
  );
  
  if (button) {
    console.log('✅ Botón encontrado por texto:', button);
    return button;
  }
  
  console.log('❌ Botón no encontrado');
  console.log('🔍 Botones disponibles:', buttons.map(btn => btn.textContent));
  return null;
}

// 6. Verificar modal
function checkModal() {
  console.log('\n=== 6. VERIFICANDO MODAL ===');
  
  let modal = document.querySelector('[data-react-modal="add-server"]');
  
  if (!modal) {
    modal = document.querySelector('.ReactModal__Content') ||
            document.querySelector('[role="dialog"]') ||
            document.querySelector('.modal');
  }
  
  if (modal) {
    const isVisible = modal.offsetParent !== null && 
                     window.getComputedStyle(modal).display !== 'none' &&
                     window.getComputedStyle(modal).visibility !== 'hidden';
    
    console.log('✅ Modal encontrado:', modal);
    console.log('👁️ Modal visible:', isVisible);
    return { modal, isVisible };
  } else {
    console.log('❌ Modal no encontrado');
    return { modal: null, isVisible: false };
  }
}

// Función principal para ejecutar todos los tests
async function runFullDiagnostic() {
  console.log('🚀 INICIANDO DIAGNÓSTICO COMPLETO\n');
  
  // 1. Verificar Supabase
  if (!checkSupabase()) {
    console.log('🛑 No se puede continuar sin Supabase');
    return;
  }
  
  // 2. Verificar sesión
  const session = await checkUserSession();
  if (!session) {
    console.log('🛑 No se puede continuar sin sesión de usuario');
    return;
  }
  
  // 3. Probar getGameByName
  const game = await testGetGameByName();
  if (!game) {
    console.log('🛑 No se puede continuar sin datos del juego');
    return;
  }
  
  // 4. Probar endpoint de servidores
  const result = await testServersEndpoint(game.id, session);
  if (result) {
    console.log('\n🎉 ¡DIAGNÓSTICO EXITOSO! El endpoint funciona correctamente.');
  } else {
    console.log('\n❌ DIAGNÓSTICO FALLIDO: Hay problemas con el endpoint.');
  }
  
  // 5. Verificar UI
  const button = findAddServerButton();
  const modalInfo = checkModal();
  
  console.log('\n=== RESUMEN DEL DIAGNÓSTICO ===');
  console.log('Supabase:', '✅');
  console.log('Sesión de usuario:', session ? '✅' : '❌');
  console.log('Datos del juego:', game ? '✅' : '❌');
  console.log('Endpoint /api/servers:', result ? '✅' : '❌');
  console.log('Botón agregar servidor:', button ? '✅' : '❌');
  console.log('Modal disponible:', modalInfo.modal ? '✅' : '❌');
}

// Funciones individuales para testing manual
window.debugFunctions = {
  checkSupabase,
  checkUserSession,
  testGetGameByName,
  testServersEndpoint,
  findAddServerButton,
  checkModal,
  runFullDiagnostic
};

console.log('\n📋 FUNCIONES DISPONIBLES:');
console.log('- debugFunctions.runFullDiagnostic() - Ejecutar diagnóstico completo');
console.log('- debugFunctions.checkSupabase() - Verificar Supabase');
console.log('- debugFunctions.checkUserSession() - Verificar sesión');
console.log('- debugFunctions.testGetGameByName() - Probar obtener juego');
console.log('- debugFunctions.findAddServerButton() - Buscar botón');
console.log('- debugFunctions.checkModal() - Verificar modal');
console.log('\n🚀 Para empezar, ejecuta: debugFunctions.runFullDiagnostic()');