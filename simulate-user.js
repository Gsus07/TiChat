// Script para simular un usuario existente y probar la creacion de servidores
// Ejecutar en la consola del navegador

(function simulateUser() {
  try {
    console.log('Simulando usuario existente...');
    
    // Simular un usuario de los seeders
    const userSession = {
      user: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'buildmaster@example.com',
        username: 'BuilderMaster',
        full_name: 'Maria Lopez',
        avatar: '/avatars/maria.jpg'
      }
    };
    
    // Guardar en localStorage
    localStorage.setItem('userSession', JSON.stringify(userSession));
    console.log('Usuario simulado guardado en localStorage');
    
    // Recargar la pagina
    window.location.reload();
    
  } catch (error) {
    console.error('Error simulando usuario:', error);
  }
})();

// Instrucciones:
// 1. Abre la consola del navegador (F12 -> Console)
// 2. Copia y pega el codigo de arriba
// 3. Presiona Enter para ejecutar
// 4. La pagina se recargara con el usuario simulado