// Script para probar autenticación y creación de servidor

// Función para verificar autenticación
async function checkAuthentication() {
  console.log('🔐 Verificando autenticación...');
  
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
    
    console.log('✅ Sesión activa encontrada:');
    console.log('- User ID:', session.user.id);
    console.log('- Email:', session.user.email);
    console.log('- Access Token:', session.access_token ? 'Presente' : 'Ausente');
    
    return session;
  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return null;
  }
}

// Función para probar el endpoint directamente
async function testServerCreationEndpoint() {
  console.log('🚀 Probando endpoint /api/servers...');
  
  const session = await checkAuthentication();
  if (!session) {
    console.log('❌ No se puede probar sin autenticación');
    return;
  }
  
  // Obtener el juego de Minecraft
  const minecraftGame = await window.getGameByName('Minecraft');
  if (!minecraftGame.success) {
    console.error('❌ No se pudo obtener el juego de Minecraft:', minecraftGame.error);
    return;
  }
  
  const testServerData = {
    game_id: minecraftGame.data.id,
    name: `Test Server ${Date.now()}`,
    description: 'Servidor de prueba para debugging',
    server_ip: '127.0.0.1',
    server_port: 25565,
    server_version: '1.20.1',
    max_players: 20,
    server_type: 'survival',
    is_active: true,
    is_featured: false,
    owner_id: session.user.id
  };
  
  console.log('📤 Enviando datos del servidor:', testServerData);
  
  try {
    const response = await fetch('/api/servers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(testServerData)
    });
    
    console.log('📥 Respuesta del servidor:');
    console.log('- Status:', response.status);
    console.log('- Status Text:', response.statusText);
    console.log('- Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('- Response Body (raw):', responseText);
    
    try {
      const responseData = JSON.parse(responseText);
      console.log('- Response Body (parsed):', responseData);
    } catch (parseError) {
      console.log('- Response Body no es JSON válido');
    }
    
    if (response.ok) {
      console.log('✅ Servidor creado exitosamente!');
    } else {
      console.log('❌ Error al crear servidor');
    }
    
  } catch (error) {
    console.error('❌ Error en la petición:', error);
  }
}

// Función para verificar permisos del usuario
async function checkUserPermissions() {
  console.log('🔑 Verificando permisos del usuario...');
  
  const session = await checkAuthentication();
  if (!session) return;
  
  try {
    // Verificar si el usuario existe en la tabla profiles
    const { data: profile, error } = await window.supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (error) {
      console.error('❌ Error al obtener perfil:', error);
      return;
    }
    
    if (!profile) {
      console.log('❌ No se encontró perfil para el usuario');
      return;
    }
    
    console.log('✅ Perfil del usuario encontrado:');
    console.log('- ID:', profile.id);
    console.log('- Username:', profile.username);
    console.log('- Email:', profile.email);
    console.log('- Created At:', profile.created_at);
    
  } catch (error) {
    console.error('❌ Error inesperado al verificar permisos:', error);
  }
}

// Función principal de diagnóstico
async function runAuthDiagnostic() {
  console.log('🔍 === DIAGNÓSTICO DE AUTENTICACIÓN Y PERMISOS ===');
  console.log('');
  
  await checkAuthentication();
  console.log('');
  
  await checkUserPermissions();
  console.log('');
  
  await testServerCreationEndpoint();
  console.log('');
  
  console.log('🏁 Diagnóstico completado');
}

// Hacer las funciones disponibles globalmente
window.authDebug = {
  checkAuthentication,
  testServerCreationEndpoint,
  checkUserPermissions,
  runAuthDiagnostic
};

console.log('🛠️ Script de diagnóstico de autenticación cargado');
console.log('Ejecuta: authDebug.runAuthDiagnostic() para comenzar');