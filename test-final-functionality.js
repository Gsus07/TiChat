// Script de prueba final para verificar las correcciones implementadas
// Ejecutar en la consola del navegador después de abrir http://localhost:4321/minecraft

// Función para probar el dropdown de tipos de servidor
function testServerTypeDropdown() {
  console.log('🧪 Probando dropdown de tipos de servidor...');
  
  // Buscar el botón de agregar servidor
  const addServerBtn = document.querySelector('button[data-testid="add-server-btn"], button:contains("Agregar Servidor"), .add-server-btn');
  
  if (!addServerBtn) {
    // Buscar por texto
    const buttons = Array.from(document.querySelectorAll('button'));
    const foundBtn = buttons.find(btn => btn.textContent.includes('Agregar') || btn.textContent.includes('Servidor'));
    
    if (!foundBtn) {
      console.error('❌ No se encontró el botón de agregar servidor');
      return false;
    }
    
    console.log('✅ Botón de agregar servidor encontrado');
    foundBtn.click();
  } else {
    console.log('✅ Botón de agregar servidor encontrado');
    addServerBtn.click();
  }
  
  // Esperar a que aparezca el modal
  setTimeout(() => {
    const modal = document.querySelector('[role="dialog"], .modal, .fixed.inset-0');
    
    if (!modal) {
      console.error('❌ Modal no se abrió');
      return false;
    }
    
    console.log('✅ Modal abierto correctamente');
    
    // Buscar el dropdown de tipos de servidor
    const serverTypeSelect = document.querySelector('select[name="serverType"], #serverType, select:has(option[value="survival"])');
    
    if (!serverTypeSelect) {
      console.error('❌ Dropdown de tipos de servidor no encontrado');
      return false;
    }
    
    console.log('✅ Dropdown de tipos de servidor encontrado');
    
    // Verificar que las opciones sean visibles
    const options = serverTypeSelect.querySelectorAll('option');
    console.log(`📋 Opciones encontradas: ${options.length}`);
    
    let visibleOptions = 0;
    options.forEach((option, index) => {
      const styles = window.getComputedStyle(option);
      const isVisible = styles.display !== 'none' && styles.visibility !== 'hidden' && option.textContent.trim() !== '';
      
      console.log(`   ${index + 1}. "${option.textContent}" (value: "${option.value}") - Visible: ${isVisible}`);
      
      if (isVisible && option.textContent.trim() !== '') {
        visibleOptions++;
      }
    });
    
    if (visibleOptions >= 2) {
      console.log('✅ Dropdown de tipos funciona correctamente');
      return true;
    } else {
      console.error('❌ Dropdown de tipos no tiene opciones visibles');
      return false;
    }
  }, 1000);
}

// Función para probar el guardado de servidor
function testServerSaving() {
  console.log('🧪 Probando guardado de servidor...');
  
  // Verificar autenticación
  const userSession = localStorage.getItem('userSession') || sessionStorage.getItem('userSession');
  
  if (!userSession) {
    console.log('🔧 Creando sesión de usuario de prueba...');
    
    const testSession = {
      user: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        username: 'TestUser',
        full_name: 'Usuario de Prueba',
        avatar: '/default-avatar.png'
      },
      profile: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        username: 'TestUser',
        full_name: 'Usuario de Prueba',
        avatar_url: '/default-avatar.png',
        user_role: 'user',
        is_active: true
      }
    };
    
    localStorage.setItem('userSession', JSON.stringify(testSession));
    console.log('✅ Sesión de prueba creada');
  } else {
    console.log('✅ Usuario ya autenticado');
  }
  
  // Buscar el modal si no está abierto
  let modal = document.querySelector('[role="dialog"], .modal, .fixed.inset-0');
  
  if (!modal) {
    console.log('📋 Abriendo modal de agregar servidor...');
    const addServerBtn = document.querySelector('button[data-testid="add-server-btn"]') || 
                        Array.from(document.querySelectorAll('button')).find(btn => 
                          btn.textContent.includes('Agregar') || btn.textContent.includes('Servidor'));
    
    if (addServerBtn) {
      addServerBtn.click();
      
      // Esperar a que se abra el modal
      setTimeout(() => {
        testServerSavingForm();
      }, 1000);
    } else {
      console.error('❌ No se pudo abrir el modal');
      return false;
    }
  } else {
    testServerSavingForm();
  }
}

// Función para probar el formulario de guardado
function testServerSavingForm() {
  console.log('📋 Llenando formulario de servidor...');
  
  // Datos de prueba
  const testData = {
    name: 'Servidor de Prueba ' + Date.now(),
    description: 'Servidor creado para probar la funcionalidad',
    server_ip: '127.0.0.1',
    server_port: '25565',
    serverType: 'survival'
  };
  
  // Llenar campos del formulario
  const nameInput = document.querySelector('input[name="name"], #name');
  const descInput = document.querySelector('textarea[name="description"], #description');
  const ipInput = document.querySelector('input[name="server_ip"], #server_ip');
  const portInput = document.querySelector('input[name="server_port"], #server_port');
  const typeSelect = document.querySelector('select[name="serverType"], #serverType');
  
  if (nameInput) {
    nameInput.value = testData.name;
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('✅ Nombre del servidor llenado');
  }
  
  if (descInput) {
    descInput.value = testData.description;
    descInput.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('✅ Descripción llenada');
  }
  
  if (ipInput) {
    ipInput.value = testData.server_ip;
    ipInput.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('✅ IP del servidor llenada');
  }
  
  if (portInput) {
    portInput.value = testData.server_port;
    portInput.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('✅ Puerto del servidor llenado');
  }
  
  if (typeSelect) {
    typeSelect.value = testData.serverType;
    typeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    console.log('✅ Tipo de servidor seleccionado');
  }
  
  console.log('📋 Formulario llenado, datos:', testData);
  
  // Buscar y hacer clic en el botón de guardar
  setTimeout(() => {
    const saveBtn = document.querySelector('button[type="submit"], button:contains("Guardar"), button:contains("Crear")');
    
    if (!saveBtn) {
      const buttons = Array.from(document.querySelectorAll('button'));
      const foundSaveBtn = buttons.find(btn => 
        btn.textContent.includes('Guardar') || 
        btn.textContent.includes('Crear') || 
        btn.textContent.includes('Agregar'));
      
      if (foundSaveBtn) {
        console.log('🚀 Enviando formulario...');
        foundSaveBtn.click();
      } else {
        console.error('❌ Botón de guardar no encontrado');
      }
    } else {
      console.log('🚀 Enviando formulario...');
      saveBtn.click();
    }
    
    // Monitorear el resultado
    setTimeout(() => {
      checkSaveResult();
    }, 3000);
  }, 500);
}

// Función para verificar el resultado del guardado
function checkSaveResult() {
  console.log('🔍 Verificando resultado del guardado...');
  
  // Buscar notificaciones de éxito o error
  const notifications = document.querySelectorAll('.notification, .toast, .alert, [role="alert"]');
  
  let hasSuccessNotification = false;
  let hasErrorNotification = false;
  
  notifications.forEach(notification => {
    const text = notification.textContent.toLowerCase();
    
    if (text.includes('éxito') || text.includes('exitoso') || text.includes('creado') || text.includes('guardado')) {
      hasSuccessNotification = true;
      console.log('✅ Notificación de éxito encontrada:', notification.textContent);
    }
    
    if (text.includes('error') || text.includes('fallo') || text.includes('problema')) {
      hasErrorNotification = true;
      console.log('❌ Notificación de error encontrada:', notification.textContent);
    }
  });
  
  // Verificar si el modal se cerró (indicativo de éxito)
  const modal = document.querySelector('[role="dialog"], .modal, .fixed.inset-0');
  const modalClosed = !modal || modal.style.display === 'none' || !modal.offsetParent;
  
  if (hasSuccessNotification || modalClosed) {
    console.log('🎉 ¡Servidor guardado exitosamente!');
    return true;
  } else if (hasErrorNotification) {
    console.log('❌ Error al guardar el servidor');
    return false;
  } else {
    console.log('⏳ Resultado del guardado no claro, verificar manualmente');
    return null;
  }
}

// Función principal de prueba
function runAllTests() {
  console.log('🚀 Iniciando pruebas de funcionalidad...');
  console.log('=' .repeat(50));
  
  // Probar dropdown primero
  testServerTypeDropdown();
  
  // Esperar y luego probar guardado
  setTimeout(() => {
    console.log('\n' + '=' .repeat(50));
    testServerSaving();
  }, 3000);
  
  console.log('\n📝 Observa la consola para ver los resultados de las pruebas.');
}

// Hacer funciones disponibles globalmente
window.finalTest = {
  runAllTests,
  testServerTypeDropdown,
  testServerSaving,
  checkSaveResult
};

console.log('🧪 Funciones de prueba final disponibles en window.finalTest');
console.log('🚀 Ejecuta window.finalTest.runAllTests() para probar todo');

// Ejecutar automáticamente
runAllTests();