// Script para replicar exactamente el flujo de AddServerModal
console.log('🚀 Iniciando diagnóstico del flujo de AddServerModal...');

// Importar funciones necesarias (simuladas)
const simulateGetGameByName = async (name) => {
  console.log(`🎮 Simulando getGameByName('${name}')...`);
  
  // Esto simula lo que hace la función getGameByName en utils/games.ts
  try {
    // Primero verificamos si tenemos acceso a supabase
    if (typeof window.supabase === 'undefined') {
      console.error('❌ Supabase no está disponible en window');
      return { data: null, error: 'Supabase no disponible' };
    }
    
    const { data, error } = await window.supabase
      .from('games')
      .select('*')
      .eq('name', name)
      .eq('is_active', true)
      .single();
    
    if (error) {
      console.error('❌ Error en getGameByName:', error);
      return { data: null, error };
    }
    
    console.log('✅ Juego encontrado:', data);
    return { data, error: null };
  } catch (error) {
    console.error('💥 Error en simulateGetGameByName:', error);
    return { data: null, error };
  }
};

const simulateGetServerByName = async (name) => {
  console.log(`🖥️ Simulando getServerByName('${name}')...`);
  
  try {
    if (typeof window.supabase === 'undefined') {
      console.error('❌ Supabase no está disponible en window');
      return null;
    }
    
    const { data, error } = await window.supabase
      .from('game_servers')
      .select('*')
      .eq('name', name)
      .eq('is_active', true)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('✅ Servidor no existe (esto es bueno)');
        return null;
      }
      console.error('❌ Error en getServerByName:', error);
      return null;
    }
    
    console.log('⚠️ Servidor ya existe:', data);
    return data;
  } catch (error) {
    console.error('💥 Error en simulateGetServerByName:', error);
    return null;
  }
};

const getCurrentUser = () => {
  try {
    const sessionData = localStorage.getItem('sb-localhost-auth-token') || sessionStorage.getItem('sb-localhost-auth-token');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      return session.user;
    }
    return null;
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return null;
  }
};

const getSupabaseSession = async () => {
  try {
    if (typeof window.supabase === 'undefined') {
      console.error('❌ Supabase no está disponible');
      return null;
    }
    
    const { data: { session }, error } = await window.supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Error obteniendo sesión:', error);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('💥 Error en getSupabaseSession:', error);
    return null;
  }
};

// Función principal que replica el flujo exacto de AddServerModal
async function testAddServerModalFlow() {
  console.log('🔄 Iniciando flujo completo de AddServerModal...');
  
  try {
    // Paso 1: Obtener el juego de Minecraft
    console.log('\n📋 Paso 1: Obteniendo juego Minecraft...');
    const minecraftGameResult = await simulateGetGameByName('Minecraft');
    if (!minecraftGameResult.data) {
      throw new Error('No se pudo encontrar el juego Minecraft');
    }
    
    // Paso 2: Obtener el usuario actual
    console.log('\n👤 Paso 2: Verificando usuario actual...');
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('Debes estar autenticado para crear un servidor');
    }
    console.log('✅ Usuario autenticado:', currentUser.email);
    
    // Paso 3: Crear datos del servidor
    console.log('\n📦 Paso 3: Preparando datos del servidor...');
    const serverData = {
      game_id: minecraftGameResult.data.id,
      name: 'Test Server ' + Date.now(),
      description: 'Servidor de prueba desde diagnóstico',
      server_ip: '127.0.0.1',
      server_port: 25565,
      server_version: '1.20.1',
      max_players: 20,
      server_type: 'survival',
      is_active: true,
      is_featured: false,
      owner_id: currentUser.id
    };
    console.log('✅ Datos del servidor preparados:', serverData);
    
    // Paso 4: Verificar si ya existe un servidor con el mismo nombre
    console.log('\n🔍 Paso 4: Verificando nombre único...');
    const existingServer = await simulateGetServerByName(serverData.name);
    if (existingServer) {
      throw new Error('Ya existe un servidor con ese nombre');
    }
    
    // Paso 5: Obtener sesión de Supabase
    console.log('\n🔐 Paso 5: Obteniendo sesión de Supabase...');
    const session = await getSupabaseSession();
    if (!session) {
      throw new Error('No hay sesión activa');
    }
    console.log('✅ Sesión activa obtenida');
    
    // Paso 6: Hacer la petición al endpoint
    console.log('\n🌐 Paso 6: Enviando petición a /api/servers...');
    const response = await fetch('/api/servers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(serverData)
    });
    
    console.log('📥 Respuesta recibida:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      url: response.url
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Error al crear el servidor');
    }
    
    console.log('🎉 ¡Servidor creado exitosamente!', result);
    
  } catch (error) {
    console.error('💥 Error en el flujo:', error.message);
    console.error('📊 Detalles del error:', error);
  }
}

// Función para verificar el estado de Supabase
function checkSupabaseStatus() {
  console.log('🔍 Verificando estado de Supabase...');
  
  if (typeof window.supabase === 'undefined') {
    console.error('❌ Supabase no está disponible en window');
    return false;
  }
  
  console.log('✅ Supabase está disponible');
  console.log('📋 URL de Supabase:', window.supabase.supabaseUrl);
  return true;
}

// Función para interceptar errores de red
function interceptNetworkErrors() {
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    console.log('🌐 Fetch interceptado:', args[0]);
    return originalFetch.apply(this, args)
      .then(response => {
        console.log('📡 Respuesta recibida:', {
          url: args[0],
          status: response.status,
          ok: response.ok
        });
        return response;
      })
      .catch(error => {
        console.error('🚨 Error de red interceptado:', {
          url: args[0],
          error: error.message,
          stack: error.stack
        });
        throw error;
      });
  };
}

// Función principal
function runCompleteTest() {
  console.log('🚀 Iniciando diagnóstico completo...');
  interceptNetworkErrors();
  
  if (!checkSupabaseStatus()) {
    console.error('❌ No se puede continuar sin Supabase');
    return;
  }
  
  testAddServerModalFlow();
}

// Hacer disponible globalmente
window.testAddServerFlow = {
  runCompleteTest,
  testAddServerModalFlow,
  checkSupabaseStatus,
  getCurrentUser,
  simulateGetGameByName,
  simulateGetServerByName
};

console.log('✅ Script cargado. Ejecuta: window.testAddServerFlow.runCompleteTest()');