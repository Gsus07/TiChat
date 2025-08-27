// Script inline para probar creación de servidores directamente en la página
console.log('🚀 Script de diagnóstico cargado');

// Función para simular el clic en el botón de agregar servidor
function simulateAddServerClick() {
  console.log('🔍 Buscando botón de agregar servidor...');
  
  // Buscar específicamente el botón con ID 'addServerBtn'
  let button = document.getElementById('addServerBtn');
  
  if (!button) {
    // Buscar por otros selectores como fallback
    const selectors = [
      'button[data-testid="add-server-btn"]',
      '.add-server-btn',
      '#add-server-btn'
    ];
    
    for (const selector of selectors) {
      button = document.querySelector(selector);
      if (button) {
        console.log('✅ Botón encontrado con selector:', selector);
        break;
      }
    }
    
    // Si aún no se encuentra, buscar por texto
    if (!button) {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        if (btn.textContent.includes('Agregar') || btn.textContent.includes('Add')) {
          button = btn;
          console.log('✅ Botón encontrado por texto:', btn.textContent.trim());
          break;
        }
      }
    }
  } else {
    console.log('✅ Botón encontrado con ID: addServerBtn');
  }
  
  if (!button) {
    console.error('❌ No se encontró el botón de agregar servidor');
    console.log('📋 Botones disponibles:');
    document.querySelectorAll('button').forEach((btn, index) => {
      console.log(`  ${index}: ${btn.textContent.trim()} - ${btn.className} - ID: ${btn.id}`);
    });
    return false;
  }
  
  console.log('🖱️ Simulando clic en el botón...');
  button.click();
  
  // También disparar el evento personalizado directamente
  console.log('📡 Disparando evento personalizado openAddServerModal...');
  window.dispatchEvent(new CustomEvent('openAddServerModal'));
  
  // Esperar un momento para que se abra el modal
  setTimeout(() => {
    checkModalOpened();
  }, 1000);
  
  return true;
}

// Función para verificar si el modal se abrió
function checkModalOpened() {
  console.log('🔍 Verificando si el modal se abrió...');
  
  // Buscar específicamente el modal de React con data-react-modal="add-server"
  let modal = document.querySelector('[data-react-modal="add-server"]');
  
  if (!modal) {
    // Buscar por otros selectores como fallback
    const modalSelectors = [
      '.fixed.inset-0',
      '[role="dialog"]',
      '.modal',
      '.add-server-modal',
      '.server-modal',
      'div[class*="modal"]',
      'div[class*="dialog"]'
    ];
    
    for (const selector of modalSelectors) {
      const foundModal = document.querySelector(selector);
      if (foundModal && foundModal.style.display !== 'none' && !foundModal.hidden && !foundModal.classList.contains('hidden')) {
        modal = foundModal;
        console.log('✅ Modal encontrado con selector:', selector);
        break;
      }
    }
  } else {
    console.log('✅ Modal React encontrado con data-react-modal="add-server"');
  }
  
  if (!modal) {
    console.error('❌ Modal no se abrió o no se encontró');
    console.log('🔍 Elementos con clase "fixed" encontrados:');
    document.querySelectorAll('.fixed').forEach((el, index) => {
      console.log(`  ${index}: ${el.className} - Display: ${el.style.display} - Hidden: ${el.hidden}`);
    });
    return false;
  }
  
  // Verificar si el modal está visible
  const isVisible = !modal.classList.contains('hidden') && modal.style.display !== 'none';
  console.log('👁️ Modal visible:', isVisible);
  console.log('📋 Clases del modal:', modal.className);
  
  if (!isVisible) {
    console.error('❌ Modal encontrado pero no está visible');
    return false;
  }
  
  // Buscar el formulario dentro del modal
  const form = modal.querySelector('form');
  if (form) {
    console.log('✅ Formulario encontrado en el modal');
    fillFormAndSubmit(form);
  } else {
    console.error('❌ No se encontró formulario en el modal');
    console.log('📋 Contenido del modal (primeros 300 caracteres):', modal.innerHTML.substring(0, 300) + '...');
  }
  
  return true;
}

// Función para llenar el formulario y enviarlo
function fillFormAndSubmit(form) {
  console.log('📝 Llenando formulario...');
  
  const testData = {
    name: 'Test Server ' + Date.now(),
    description: 'Servidor de prueba automática',
    ip: '127.0.0.1',
    port: '25565',
    version: '1.20.1',
    maxPlayers: '20'
  };
  
  // Llenar campos del formulario
  const inputs = form.querySelectorAll('input, textarea, select');
  
  inputs.forEach(input => {
    const name = input.name || input.id || input.getAttribute('data-field');
    const type = input.type;
    
    console.log(`🔍 Campo encontrado: ${name} (${type})`);
    
    if (name && testData[name]) {
      input.value = testData[name];
      console.log(`✅ Campo ${name} llenado con: ${testData[name]}`);
      
      // Disparar eventos de cambio
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  
  // Buscar y hacer clic en el botón de envío
  const submitButton = form.querySelector('button[type="submit"], button:contains("Crear"), button:contains("Guardar")');
  
  if (submitButton) {
    console.log('🚀 Enviando formulario...');
    
    // Interceptar el envío para ver qué pasa
    const originalSubmit = form.onsubmit;
    form.onsubmit = function(e) {
      console.log('📤 Formulario enviado');
      console.log('📋 Datos del formulario:', new FormData(form));
      
      if (originalSubmit) {
        return originalSubmit.call(this, e);
      }
    };
    
    submitButton.click();
  } else {
    console.error('❌ No se encontró botón de envío');
  }
}

// Función para interceptar errores de red
function interceptNetworkCalls() {
  console.log('🌐 Interceptando llamadas de red...');
  
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    console.log('🌐 Fetch interceptado:', args[0]);
    
    return originalFetch.apply(this, args)
      .then(response => {
        console.log('📡 Respuesta recibida:', {
          url: args[0],
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });
        
        // Si es una respuesta de error, intentar leer el contenido
        if (!response.ok) {
          response.clone().text().then(text => {
            console.error('❌ Contenido del error:', text);
          });
        }
        
        return response;
      })
      .catch(error => {
        console.error('🚨 Error de red:', {
          url: args[0],
          error: error.message,
          stack: error.stack
        });
        throw error;
      });
  };
}

// Función para interceptar errores de JavaScript
function interceptJavaScriptErrors() {
  console.log('🐛 Interceptando errores de JavaScript...');
  
  window.addEventListener('error', function(e) {
    console.error('🚨 Error de JavaScript:', {
      message: e.message,
      filename: e.filename,
      lineno: e.lineno,
      colno: e.colno,
      error: e.error
    });
  });
  
  window.addEventListener('unhandledrejection', function(e) {
    console.error('🚨 Promise rechazada:', {
      reason: e.reason,
      promise: e.promise
    });
  });
}

// Función principal para ejecutar todas las pruebas
function runFullDiagnostic() {
  console.log('🚀 Iniciando diagnóstico completo...');
  
  interceptNetworkCalls();
  interceptJavaScriptErrors();
  
  // Verificar si la página está completamente cargada
  if (document.readyState !== 'complete') {
    console.log('⏳ Esperando a que la página termine de cargar...');
    window.addEventListener('load', () => {
      setTimeout(() => {
        simulateAddServerClick();
      }, 1000);
    });
  } else {
    console.log('⏱️ Esperando 2 segundos antes de simular clic...');
    setTimeout(() => {
      simulateAddServerClick();
    }, 2000);
  }
}

// Función para abrir el modal directamente
function openModalDirectly() {
  console.log('🎯 Abriendo modal directamente...');
  window.dispatchEvent(new CustomEvent('openAddServerModal'));
  
  setTimeout(() => {
    checkModalOpened();
  }, 1000);
}

// Hacer disponible globalmente
window.serverDiagnostic = {
  runFullDiagnostic,
  simulateAddServerClick,
  checkModalOpened,
  interceptNetworkCalls,
  interceptJavaScriptErrors,
  openModalDirectly,
  fillFormAndSubmit
};

console.log('✅ Script de diagnóstico listo.');
console.log('🎯 Comandos disponibles:');
console.log('  - window.serverDiagnostic.runFullDiagnostic() // Ejecutar diagnóstico completo');
console.log('  - window.serverDiagnostic.openModalDirectly() // Abrir modal directamente');
console.log('  - window.serverDiagnostic.simulateAddServerClick() // Simular clic en botón');