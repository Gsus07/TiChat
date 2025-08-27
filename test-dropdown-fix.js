// Script para probar y corregir el problema del dropdown de tipos de servidor

// Función para probar el dropdown
function testDropdownVisibility() {
  console.log('=== TESTING DROPDOWN VISIBILITY ===');
  
  // Buscar el select de tipo de servidor
  const serverTypeSelect = document.querySelector('select[name="serverType"]');
  
  if (!serverTypeSelect) {
    console.log('❌ No se encontró el select de tipo de servidor');
    return;
  }
  
  console.log('✅ Select encontrado:', serverTypeSelect);
  
  // Verificar las opciones
  const options = serverTypeSelect.querySelectorAll('option');
  console.log('📋 Opciones encontradas:', options.length);
  
  options.forEach((option, index) => {
    console.log(`  ${index + 1}. Value: "${option.value}", Text: "${option.textContent}"`);
  });
  
  // Verificar estilos computados
  const computedStyles = window.getComputedStyle(serverTypeSelect);
  console.log('🎨 Estilos del select:');
  console.log('  Background:', computedStyles.backgroundColor);
  console.log('  Color:', computedStyles.color);
  console.log('  Border:', computedStyles.border);
  
  // Verificar estilos de las opciones
  if (options.length > 0) {
    const firstOption = options[0];
    const optionStyles = window.getComputedStyle(firstOption);
    console.log('🎨 Estilos de las opciones:');
    console.log('  Background:', optionStyles.backgroundColor);
    console.log('  Color:', optionStyles.color);
  }
  
  return serverTypeSelect;
}

// Función para aplicar fix temporal al dropdown
function applyDropdownFix() {
  console.log('=== APPLYING DROPDOWN FIX ===');
  
  const serverTypeSelect = document.querySelector('select[name="serverType"]');
  
  if (!serverTypeSelect) {
    console.log('❌ No se encontró el select para aplicar el fix');
    return;
  }
  
  // Aplicar estilos específicos para mejorar la visibilidad
  serverTypeSelect.style.cssText += `
    background-color: rgb(30, 41, 59) !important;
    color: white !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
  `;
  
  // Aplicar estilos a las opciones
  const options = serverTypeSelect.querySelectorAll('option');
  options.forEach(option => {
    option.style.cssText += `
      background-color: rgb(30, 41, 59) !important;
      color: white !important;
      padding: 8px !important;
    `;
  });
  
  console.log('✅ Fix aplicado al dropdown');
  
  // Agregar event listeners para debugging
  serverTypeSelect.addEventListener('focus', () => {
    console.log('🔍 Select enfocado');
  });
  
  serverTypeSelect.addEventListener('change', (e) => {
    console.log('🔄 Valor cambiado a:', e.target.value);
  });
  
  serverTypeSelect.addEventListener('click', () => {
    console.log('👆 Select clickeado');
  });
}

// Función para probar la funcionalidad de guardado
function testServerSaving() {
  console.log('=== TESTING SERVER SAVING ===');
  
  // Verificar si hay un usuario autenticado
  const userSession = localStorage.getItem('userSession') || sessionStorage.getItem('userSession');
  
  if (!userSession) {
    console.log('❌ No hay usuario autenticado');
    console.log('💡 Ejecuta el script simulate-user.js primero');
    return;
  }
  
  try {
    const user = JSON.parse(userSession);
    console.log('✅ Usuario autenticado:', user.name);
  } catch (error) {
    console.log('❌ Error al parsear sesión de usuario:', error);
    return;
  }
  
  // Verificar el formulario
  const form = document.querySelector('form');
  if (!form) {
    console.log('❌ No se encontró el formulario');
    return;
  }
  
  console.log('✅ Formulario encontrado');
  
  // Verificar campos requeridos
  const requiredFields = [
    'input[name="name"]',
    'input[name="ip"]',
    'input[name="port"]',
    'select[name="serverType"]'
  ];
  
  requiredFields.forEach(selector => {
    const field = form.querySelector(selector);
    if (field) {
      console.log(`✅ Campo encontrado: ${selector} = "${field.value}"`);
    } else {
      console.log(`❌ Campo no encontrado: ${selector}`);
    }
  });
}

// Función principal
function runAllTests() {
  console.log('🚀 Iniciando pruebas del modal de servidor...');
  
  // Esperar a que el modal esté abierto
  const modal = document.querySelector('[data-react-modal="add-server"]');
  
  if (!modal || modal.classList.contains('hidden')) {
    console.log('⚠️ El modal no está abierto. Ábrelo primero y luego ejecuta este script.');
    return;
  }
  
  console.log('✅ Modal detectado y abierto');
  
  // Ejecutar pruebas
  testDropdownVisibility();
  applyDropdownFix();
  testServerSaving();
  
  console.log('✅ Todas las pruebas completadas');
  console.log('💡 Ahora prueba a seleccionar un tipo de servidor y crear un servidor');
}

// Ejecutar automáticamente
runAllTests();

// Hacer funciones disponibles globalmente para uso manual
window.testDropdownVisibility = testDropdownVisibility;
window.applyDropdownFix = applyDropdownFix;
window.testServerSaving = testServerSaving;
window.runAllTests = runAllTests;

console.log('📋 Funciones disponibles:');
console.log('  - testDropdownVisibility()');
console.log('  - applyDropdownFix()');
console.log('  - testServerSaving()');
console.log('  - runAllTests()');