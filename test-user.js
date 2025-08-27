// Script para crear un usuario de prueba en localStorage
const testUser = {
  user: {
    id: 'test-user-123',
    email: 'test@example.com',
    username: 'TestUser',
    full_name: 'Usuario de Prueba',
    avatar: '/default-avatar.png'
  },
  loginTime: new Date().toISOString(),
  rememberMe: true
};

// Guardar en localStorage
localStorage.setItem('userSession', JSON.stringify(testUser));
console.log('Usuario de prueba creado:', testUser);
console.log('Sesión guardada en localStorage');

// Verificar que se guardó correctamente
const savedSession = localStorage.getItem('userSession');
if (savedSession) {
  console.log('Sesión verificada:', JSON.parse(savedSession));
} else {
  console.error('Error: No se pudo guardar la sesión');
}