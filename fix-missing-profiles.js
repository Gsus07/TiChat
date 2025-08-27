// Script para crear perfiles faltantes en la base de datos
// Este script debe ejecutarse en el servidor o mediante una función de Supabase

// Función para crear un perfil faltante
async function createMissingProfile(userId, email) {
  console.log(`🔧 Creando perfil para usuario: ${email}`);
  
  try {
    // Generar username único basado en el email
    const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    let username = baseUsername;
    let counter = 1;
    
    // Verificar si el username ya existe y generar uno único
    while (true) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();
      
      if (!existingProfile) {
        break; // Username disponible
      }
      
      username = `${baseUsername}${counter}`;
      counter++;
    }
    
    // Crear el perfil
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        username: username,
        full_name: username,
        avatar_url: '/default-avatar.png',
        bio: null,
        user_role: 'user',
        is_active: true
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error creando perfil:', error);
      return null;
    }
    
    console.log('✅ Perfil creado exitosamente:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Error en createMissingProfile:', error);
    return null;
  }
}

// Función para verificar y crear perfil si no existe
async function ensureUserProfile(userId, email) {
  try {
    // Verificar si el perfil ya existe
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError && profileError.code === 'PGRST116') {
      // El perfil no existe, crearlo
      console.log(`📝 Perfil no encontrado para ${email}, creando...`);
      return await createMissingProfile(userId, email);
    } else if (profileError) {
      console.error('❌ Error verificando perfil:', profileError);
      return null;
    } else {
      console.log('✅ Perfil ya existe:', existingProfile.username);
      return existingProfile;
    }
    
  } catch (error) {
    console.error('❌ Error en ensureUserProfile:', error);
    return null;
  }
}

// Función para usar en el frontend (simulación)
function simulateProfileCreation() {
  console.log('🔧 Simulando creación de perfil...');
  
  // Obtener sesión actual
  const userSession = localStorage.getItem('userSession') || sessionStorage.getItem('userSession');
  
  if (!userSession) {
    console.error('❌ No hay sesión de usuario');
    return;
  }
  
  try {
    const session = JSON.parse(userSession);
    const user = session.user;
    
    console.log('👤 Usuario actual:', user);
    
    // Simular perfil creado
    const simulatedProfile = {
      id: user.id,
      username: user.username || user.email.split('@')[0],
      full_name: user.full_name || user.username || 'Usuario',
      avatar_url: user.avatar || '/default-avatar.png',
      bio: null,
      user_role: 'user',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('✅ Perfil simulado:', simulatedProfile);
    
    // Actualizar sesión con perfil
    const updatedSession = {
      ...session,
      profile: simulatedProfile
    };
    
    // Guardar sesión actualizada
    if (localStorage.getItem('userSession')) {
      localStorage.setItem('userSession', JSON.stringify(updatedSession));
    } else {
      sessionStorage.setItem('userSession', JSON.stringify(updatedSession));
    }
    
    console.log('✅ Sesión actualizada con perfil');
    
  } catch (error) {
    console.error('❌ Error simulando perfil:', error);
  }
}

// Función para probar la creación de servidor después de arreglar el perfil
function testServerCreationAfterProfileFix() {
  console.log('🧪 Probando creación de servidor...');
  
  // Verificar autenticación
  const userSession = localStorage.getItem('userSession') || sessionStorage.getItem('userSession');
  
  if (!userSession) {
    console.error('❌ No hay sesión de usuario');
    return;
  }
  
  try {
    const session = JSON.parse(userSession);
    console.log('✅ Usuario autenticado:', session.user.username || session.user.email);
    
    // Verificar si hay perfil
    if (session.profile) {
      console.log('✅ Perfil encontrado:', session.profile.username);
    } else {
      console.warn('⚠️ No hay perfil en la sesión');
    }
    
    // Simular datos del servidor
    const serverData = {
      name: 'Servidor de Prueba',
      description: 'Servidor creado para probar la funcionalidad',
      server_ip: '127.0.0.1',
      server_port: 25565,
      server_type: 'survival',
      max_players: 20
    };
    
    console.log('📋 Datos del servidor a crear:', serverData);
    console.log('✅ Listo para crear servidor');
    
  } catch (error) {
    console.error('❌ Error en test:', error);
  }
}

// Hacer funciones disponibles globalmente
if (typeof window !== 'undefined') {
  window.profileFixer = {
    simulateProfileCreation,
    testServerCreationAfterProfileFix
  };
  
  console.log('🔧 Funciones de arreglo de perfil disponibles en window.profileFixer');
  console.log('📋 Ejecuta window.profileFixer.simulateProfileCreation() para simular un perfil');
  console.log('🧪 Ejecuta window.profileFixer.testServerCreationAfterProfileFix() para probar');
}

// Para uso en servidor (Node.js/Supabase Functions)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createMissingProfile,
    ensureUserProfile
  };
}