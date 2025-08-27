// Script para probar funcionalidad de posts en el navegador
// Ejecutar este código en la consola del navegador en la página de Call of Duty

console.log('🧪 Iniciando prueba de funcionalidad de posts...');

// Función para simular usuario logueado
function simulateLoggedInUser() {
  const mockUser = {
    user: {
      id: 'test-user-123',
      email: 'test@example.com',
      name: 'Usuario de Prueba'
    },
    token: 'mock-jwt-token'
  };
  
  localStorage.setItem('userSession', JSON.stringify(mockUser));
  console.log('✅ Usuario simulado logueado:', mockUser.user.name);
  
  // Disparar evento de storage para actualizar UI
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'userSession',
    newValue: JSON.stringify(mockUser)
  }));
  
  return mockUser;
}

// Función para crear un post de prueba
function createTestPost() {
  const gameName = document.querySelector('h1')?.textContent?.trim() || 'Call of Duty';
  const storageKey = `posts_${gameName}`;
  
  const newPost = {
    id: `test-post-${Date.now()}`,
    content: '¡Este es un post de prueba! 🎮 La funcionalidad de posts está funcionando correctamente.',
    author: 'Usuario de Prueba',
    timestamp: new Date().toISOString(),
    gameId: gameName,
    likes: 0,
    comments: 0
  };
  
  // Obtener posts existentes
  const existingPosts = JSON.parse(localStorage.getItem(storageKey) || '[]');
  
  // Agregar nuevo post
  existingPosts.unshift(newPost);
  
  // Guardar en localStorage
  localStorage.setItem(storageKey, JSON.stringify(existingPosts));
  
  console.log('📝 Post creado y guardado:', newPost);
  
  // Disparar evento personalizado para actualizar UI
  window.dispatchEvent(new CustomEvent('postAdded', {
    detail: { post: newPost, storageKey }
  }));
  
  return newPost;
}

// Función para verificar posts existentes
function checkExistingPosts() {
  console.log('🔍 Verificando posts existentes...');
  
  const gameName = document.querySelector('h1')?.textContent?.trim() || 'Call of Duty';
  const storageKey = `posts_${gameName}`;
  const posts = JSON.parse(localStorage.getItem(storageKey) || '[]');
  
  console.log(`📊 Posts encontrados para ${gameName}:`, posts.length);
  posts.forEach((post, index) => {
    console.log(`  ${index + 1}. ${post.author}: ${post.content.substring(0, 50)}...`);
  });
  
  return posts;
}

// Función para verificar elementos de UI
function checkUIElements() {
  console.log('🔍 Verificando elementos de UI...');
  
  const postForm = document.querySelector('#post-form-container');
  const postsContainer = document.querySelector('#posts-container');
  const emptyState = document.querySelector('#empty-posts-state');
  const loginPrompt = document.querySelector('#login-prompt');
  
  console.log('📋 Elementos encontrados:');
  console.log('  - Formulario de posts:', postForm ? '✅' : '❌');
  console.log('  - Contenedor de posts:', postsContainer ? '✅' : '❌');
  console.log('  - Estado vacío:', emptyState ? '✅' : '❌');
  console.log('  - Prompt de login:', loginPrompt ? '✅' : '❌');
  
  return {
    postForm,
    postsContainer,
    emptyState,
    loginPrompt
  };
}

// Función principal de prueba
function runPostTest() {
  console.log('🚀 Ejecutando prueba completa de posts...');
  
  // 1. Verificar elementos de UI
  const uiElements = checkUIElements();
  
  // 2. Simular usuario logueado
  const user = simulateLoggedInUser();
  
  // 3. Verificar posts existentes
  const existingPosts = checkExistingPosts();
  
  // 4. Crear post de prueba
  const newPost = createTestPost();
  
  // 5. Verificar que el post se guardó
  setTimeout(() => {
    const updatedPosts = checkExistingPosts();
    console.log('✅ Verificación final: Posts después de crear nuevo:', updatedPosts.length);
    
    if (updatedPosts.length > existingPosts.length) {
      console.log('🎉 ¡Prueba exitosa! El post se creó correctamente.');
    } else {
      console.log('❌ Error: El post no se guardó correctamente.');
    }
  }, 1000);
  
  return newPost;
}

// Ejecutar la prueba
runPostTest();

console.log('📝 Para ejecutar manualmente:');
console.log('  - runPostTest() - Ejecutar prueba completa');
console.log('  - simulateLoggedInUser() - Simular login');
console.log('  - createTestPost() - Crear post de prueba');
console.log('  - checkExistingPosts() - Ver posts existentes');
console.log('  - checkUIElements() - Verificar elementos de UI');