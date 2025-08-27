(async function() {
  try {
    console.log('Creando usuario de prueba...');
    
    const testUserData = {
      email: 'test@example.com',
      password: 'testpassword123',
      username: 'TestUser2024',
      full_name: 'Usuario de Prueba'
    };
    
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUserData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('Usuario creado:', result);
      
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
      console.log('Sesion guardada');
      window.location.reload();
    } else {
      console.error('Error:', result);
    }
  } catch (error) {
    console.error('Error:', error);
  }
})();

// Instrucciones:
// 1. Abre la consola del navegador (F12 -> Console)
// 2. Copia y pega todo el codigo de arriba
// 3. Presiona Enter para ejecutar
// 4. El usuario sera creado y la pagina se recargara automaticamente