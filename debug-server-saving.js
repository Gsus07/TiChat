// Script de debugging para el problema de guardado de servidores
// Ejecutar en la consola del navegador después de abrir el modal de agregar servidor

// Función para interceptar y monitorear todas las llamadas de red
function interceptNetworkCalls() {
  console.log('🔍 Interceptando llamadas de red...');
  
  // Interceptar fetch
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    console.log('📡 Fetch call:', args[0], args[1]);
    return originalFetch.apply(this, args)
      .then(response => {
        console.log('📡 Fetch response:', response.status, response.statusText);
        return response;
      })
      .catch(error => {
        console.error('📡 Fetch error:', error);
        throw error;
      });
  };
  
  // Interceptar XMLHttpRequest
  const originalXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = function() {
    const xhr = new originalXHR();
    const originalSend = xhr.send;
    
    xhr.send = function(...args) {
      console.log('📡 XHR call:', xhr.method || 'GET', xhr.url || 'unknown');
      return originalSend.apply(this, args);
    };
    
    xhr.addEventListener('load', function() {
      console.log('📡 XHR response:', xhr.status, xhr.statusText);
    });
    
    xhr.addEventListener('error', function() {
      console.error('📡 XHR error:', xhr.status, xhr.statusText);
    });
    
    return xhr;
  };
}

// Función para monitorear errores de JavaScript
function interceptJavaScriptErrors() {
  console.log('🐛 Interceptando errores de JavaScript...');
  
  // Interceptar errores globales
  window.addEventListener('error', function(event) {
    console.error('🐛 JavaScript Error:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });
  });
  
  // Interceptar promesas rechazadas
  window.addEventListener('unhandledrejection', function(event) {
    console.error('🐛 Unhandled Promise Rejection:', event.reason);
  });
}

// Función para monitorear el estado del formulario
function monitorFormState() {
  console.log('📋 Monitoreando estado del formulario...');
  
  const form = document.querySelector('form');
  if (!form) {
    console.log('❌ No se encontró formulario');
    return;
  }
  
  console.log('✅ Formulario encontrado');
  
  // Monitorear envío del formulario
  form.addEventListener('submit', function(event) {
    console.log('📋 Formulario enviado:', event);
    
    // Capturar datos del formulario
    const formData = new FormData(form);
    const data = {};
    for (let [key, value] of formData.entries()) {
      data[key] = value;
    }
    console.log('📋 Datos del formulario:', data);
    
    // Verificar campos requeridos
    const requiredFields = ['name', 'ip', 'port', 'serverType'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      console.warn('⚠️ Campos faltantes:', missingFields);
    } else {
      console.log('✅ Todos los campos requeridos están presentes');
    }
  });
  
  // Monitorear cambios en los inputs
  const inputs = form.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    input.addEventListener('change', function() {
      console.log(`📋 Campo ${input.name} cambiado a:`, input.value);
    });
  });
}

// Función para verificar la autenticación
function checkAuthentication() {
  console.log('🔐 Verificando autenticación...');
  
  const userSession = localStorage.getItem('userSession') || sessionStorage.getItem('userSession');
  
  if (!userSession) {
    console.error('❌ No hay sesión de usuario');
    return false;
  }
  
  try {
    const user = JSON.parse(userSession);
    console.log('✅ Usuario autenticado:', user.user?.username || user.user?.email);
    return true;
  } catch (error) {
    console.error('❌ Error al parsear sesión de usuario:', error);
    return false;
  }
}

// Función para verificar la conexión con Supabase
function checkSupabaseConnection() {
  console.log('🗄️ Verificando conexión con Supabase...');
  
  // Intentar hacer una consulta simple
  fetch('/api/games')
    .then(response => {
      if (response.ok) {
        console.log('✅ Conexión con Supabase OK');
      } else {
        console.error('❌ Error en conexión con Supabase:', response.status);
      }
    })
    .catch(error => {
      console.error('❌ Error de red con Supabase:', error);
    });
}

// Función para monitorear notificaciones
function monitorNotifications() {
  console.log('🔔 Monitoreando notificaciones...');
  
  // Interceptar console.log para capturar notificaciones
  const originalLog = console.log;
  console.log = function(...args) {
    if (args.some(arg => typeof arg === 'string' && (arg.includes('notification') || arg.includes('Notification')))) {
      console.log('🔔 Notificación detectada:', ...args);
    }
    return originalLog.apply(this, args);
  };
}

// Función principal de debugging
function startDebugging() {
  console.log('🚀 Iniciando debugging del guardado de servidores...');
  console.log('=' .repeat(50));
  
  // Ejecutar todas las verificaciones
  interceptNetworkCalls();
  interceptJavaScriptErrors();
  monitorFormState();
  checkAuthentication();
  checkSupabaseConnection();
  monitorNotifications();
  
  console.log('=' .repeat(50));
  console.log('✅ Debugging iniciado. Ahora intenta crear un servidor.');
  console.log('📝 Observa la consola para ver todos los logs detallados.');
}

// Función para simular usuario si no está autenticado
function simulateUserIfNeeded() {
  if (!checkAuthentication()) {
    console.log('🔧 Simulando usuario autenticado...');
    
    const userSession = {
      user: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'debug@example.com',
        username: 'DebugUser',
        full_name: 'Usuario Debug',
        avatar: '/default-avatar.png'
      }
    };
    
    localStorage.setItem('userSession', JSON.stringify(userSession));
    console.log('✅ Usuario simulado creado');
    
    // Recargar la página para aplicar la autenticación
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
}

// Ejecutar automáticamente
startDebugging();
simulateUserIfNeeded();

// Hacer funciones disponibles globalmente
window.debugServerSaving = {
  startDebugging,
  checkAuthentication,
  checkSupabaseConnection,
  simulateUserIfNeeded
};

console.log('📋 Funciones de debugging disponibles en window.debugServerSaving');