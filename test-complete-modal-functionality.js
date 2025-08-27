// Script completo para probar toda la funcionalidad del AddServerModal

// Función principal de prueba completa
async function testCompleteModalFunctionality() {
  console.log('🔍 === PRUEBA COMPLETA DE FUNCIONALIDAD DEL MODAL ===');
  console.log('');
  
  // Paso 1: Verificar autenticación
  console.log('📋 Paso 1: Verificando autenticación...');
  const session = await checkAuthentication();
  if (!session) {
    console.error('❌ No se puede continuar sin autenticación');
    return false;
  }
  console.log('✅ Autenticación verificada');
  console.log('');
  
  // Paso 2: Verificar permisos del usuario
  console.log('📋 Paso 2: Verificando permisos del usuario...');
  const profile = await checkUserPermissions();
  if (!profile) {
    console.error('❌ No se puede continuar sin perfil válido');
    return false;
  }
  console.log('✅ Permisos verificados');
  console.log('');
  
  // Paso 3: Verificar disponibilidad del juego Minecraft
  console.log('📋 Paso 3: Verificando disponibilidad del juego Minecraft...');
  const minecraftGame = await getGameByName('Minecraft');
  if (!minecraftGame.success) {
    console.error('❌ No se pudo obtener el juego de Minecraft:', minecraftGame.error);
    return false;
  }
  console.log('✅ Juego Minecraft disponible:', minecraftGame.data.name);
  console.log('');
  
  // Paso 4: Probar endpoint directamente
  console.log('📋 Paso 4: Probando endpoint /api/servers directamente...');
  const endpointTest = await testServerCreationEndpoint();
  console.log('');
  
  // Paso 5: Probar apertura del modal
  console.log('📋 Paso 5: Probando apertura del modal...');
  const modalTest = await testModalOpening();
  if (!modalTest) {
    console.error('❌ No se pudo abrir el modal');
    return false;
  }
  console.log('✅ Modal se abre correctamente');
  console.log('');
  
  // Paso 6: Probar llenado del formulario
  console.log('📋 Paso 6: Probando llenado del formulario...');
  const formTest = await testFormFilling();
  if (!formTest) {
    console.error('❌ No se pudo llenar el formulario');
    return false;
  }
  console.log('✅ Formulario se llena correctamente');
  console.log('');
  
  // Paso 7: Probar envío del formulario
  console.log('📋 Paso 7: Probando envío del formulario...');
  const submitTest = await testFormSubmission();
  console.log('');
  
  console.log('🏁 === PRUEBA COMPLETA FINALIZADA ===');
  return true;
}

// Función para verificar autenticación
async function checkAuthentication() {
  try {
    const { data: { session }, error } = await window.supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Error al obtener sesión:', error);
      return null;
    }
    
    if (!session) {
      console.log('❌ No hay sesión activa');
      return null;
    }
    
    console.log('✅ Sesión activa:');
    console.log('- User ID:', session.user.id);
    console.log('- Email:', session.user.email);
    
    return session;
  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return null;
  }
}

// Función para verificar permisos del usuario
async function checkUserPermissions() {
  const session = await checkAuthentication();
  if (!session) return null;
  
  try {
    const { data: profile, error } = await window.supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (error) {
      console.error('❌ Error al obtener perfil:', error);
      return null;
    }
    
    if (!profile) {
      console.log('❌ No se encontró perfil para el usuario');
      return null;
    }
    
    console.log('✅ Perfil encontrado:');
    console.log('- Username:', profile.username);
    console.log('- Email:', profile.email);
    
    return profile;
  } catch (error) {
    console.error('❌ Error inesperado al verificar permisos:', error);
    return null;
  }
}

// Función para probar el endpoint directamente
async function testServerCreationEndpoint() {
  const session = await checkAuthentication();
  if (!session) return false;
  
  const minecraftGame = await window.getGameByName('Minecraft');
  if (!minecraftGame.success) return false;
  
  const testServerData = {
    game_id: minecraftGame.data.id,
    name: `Test Complete ${Date.now()}`,
    description: 'Servidor de prueba completa',
    server_ip: '127.0.0.1',
    server_port: 25565,
    server_version: '1.20.1',
    max_players: 20,
    server_type: 'survival',
    is_active: true,
    is_featured: false,
    owner_id: session.user.id
  };
  
  try {
    const response = await fetch('/api/servers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(testServerData)
    });
    
    console.log('📡 Respuesta del endpoint:');
    console.log('- Status:', response.status);
    console.log('- Status Text:', response.statusText);
    
    const responseText = await response.text();
    console.log('- Response Body:', responseText);
    
    if (response.ok) {
      console.log('✅ Endpoint funciona correctamente');
      return true;
    } else {
      console.log('❌ Error en endpoint');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error en petición al endpoint:', error);
    return false;
  }
}

// Función para probar apertura del modal
async function testModalOpening() {
  console.log('🎯 Intentando abrir modal...');
  
  // Método 1: Buscar botón por ID
  const addServerBtn = document.getElementById('addServerBtn');
  if (addServerBtn) {
    console.log('✅ Botón encontrado por ID');
    addServerBtn.click();
  } else {
    // Método 2: Disparar evento directamente
    console.log('🎯 Disparando evento openAddServerModal');
    window.dispatchEvent(new CustomEvent('openAddServerModal'));
  }
  
  // Esperar y verificar si el modal se abrió
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const modal = document.querySelector('[data-react-modal="add-server"]') ||
               document.querySelector('.ReactModal__Content') ||
               document.querySelector('[role="dialog"]');
  
  if (modal) {
    const isVisible = modal.offsetParent !== null && 
                     window.getComputedStyle(modal).display !== 'none';
    
    if (isVisible) {
      console.log('✅ Modal abierto y visible');
      return modal;
    } else {
      console.log('❌ Modal encontrado pero no visible');
      return null;
    }
  } else {
    console.log('❌ Modal no encontrado');
    return null;
  }
}

// Función para probar llenado del formulario
async function testFormFilling() {
  const modal = await testModalOpening();
  if (!modal) return false;
  
  const formData = {
    name: `Test Form ${Date.now()}`,
    description: 'Servidor de prueba de formulario',
    ip: '127.0.0.1',
    port: '25565',
    version: '1.20.1',
    maxPlayers: '20'
  };
  
  console.log('📝 Llenando campos del formulario...');
  
  let fieldsFound = 0;
  let fieldsFilled = 0;
  
  Object.entries(formData).forEach(([fieldName, value]) => {
    const input = modal.querySelector(`input[name="${fieldName}"]`) ||
                 modal.querySelector(`#${fieldName}`) ||
                 modal.querySelector(`[placeholder*="${fieldName}"]`);
    
    fieldsFound++;
    
    if (input) {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      console.log(`✅ Campo ${fieldName} llenado`);
      fieldsFilled++;
    } else {
      console.log(`❌ Campo ${fieldName} no encontrado`);
    }
  });
  
  console.log(`📊 Campos llenados: ${fieldsFilled}/${fieldsFound}`);
  return fieldsFilled > 0;
}

// Función para probar envío del formulario
async function testFormSubmission() {
  const modal = await testModalOpening();
  if (!modal) return false;
  
  await testFormFilling();
  
  console.log('🚀 Buscando botón de envío...');
  
  const submitBtn = modal.querySelector('button[type="submit"]') ||
                   modal.querySelector('button:contains("Crear")') ||
                   modal.querySelector('button:contains("Agregar")') ||
                   modal.querySelector('.btn-primary');
  
  if (submitBtn) {
    console.log('✅ Botón de envío encontrado');
    
    // Interceptar la petición
    const originalFetch = window.fetch;
    let requestIntercepted = false;
    
    window.fetch = function(...args) {
      if (args[0].includes('/api/servers')) {
        console.log('🌐 Petición interceptada:', args[0]);
        requestIntercepted = true;
      }
      return originalFetch.apply(this, args);
    };
    
    // Hacer clic en el botón
    submitBtn.click();
    
    // Esperar un momento para ver si se interceptó la petición
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Restaurar fetch original
    window.fetch = originalFetch;
    
    if (requestIntercepted) {
      console.log('✅ Formulario enviado correctamente');
      return true;
    } else {
      console.log('❌ No se detectó envío del formulario');
      return false;
    }
  } else {
    console.log('❌ Botón de envío no encontrado');
    console.log('🔍 Botones disponibles:', modal.querySelectorAll('button'));
    return false;
  }
}

// Hacer funciones disponibles globalmente
window.completeModalTest = {
  testCompleteModalFunctionality,
  checkAuthentication,
  checkUserPermissions,
  testServerCreationEndpoint,
  testModalOpening,
  testFormFilling,
  testFormSubmission
};

console.log('🛠️ Script de prueba completa del modal cargado');
console.log('Ejecuta: completeModalTest.testCompleteModalFunctionality() para comenzar la prueba completa');