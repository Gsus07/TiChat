// Script para crear un usuario de prueba en Supabase
// Ejecutar en la consola del navegador en la pagina de Minecraft

(async function createTestUser() {
  try {
    console.log('Creando usuario de prueba...');
    
    // Datos del usuario de prueba
    const testUserData = {
      email: 'test@example.com',
      password: 'testpassword123',
      username: 'TestUser2024',
      full_name: 'Usuario de Prueba',
      bio: 'Usuario creado para pruebas de la aplicacion'
    };
    
    // Registrar usuario en Supabase Auth
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUserData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Usuario creado exitosamente:', result);
      
      // Guardar sesion en localStorage
      const userSession = {
        user: {
          id: result.data.user.id,
          email: result.data.user.email,
          username: testUserData.username,
          full_name: testUserData.full_name,
          avatar: null
        }
      };
      
      localStorage.setItem('userSession', JSON.stringify(userSession));
      console.log('✅ Sesion guardada en localStorage');
      
      // Recargar la pagina para aplicar los cambios
      window.location.reload();
    } else {
      console.error('❌ Error creando usuario:', result);
    }
    
  } catch (error) {
    console.error('❌ Error en el script:', error);
  }
})();