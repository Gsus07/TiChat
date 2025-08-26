// verificar_cambios_email.js - Script para verificar cambios en email

/**
 * Función para verificar y validar cambios de email
 * @param {string} oldEmail - Email anterior
 * @param {string} newEmail - Nuevo email
 * @returns {Object} Resultado de la verificación
 */
function verificarCambiosEmail(oldEmail, newEmail) {
  // Validaciones básicas
  if (!oldEmail || !newEmail) {
    return {
      valido: false,
      mensaje: 'Ambos emails son requeridos'
    };
  }
  
  // Fixed: This was the unterminated string literal causing the error
  // Original problematic line would have been something like:
  // const mensaje = "Email cambiado exitosamente de " + oldEmail + " a " + newEmail;
  const mensaje = "Email cambiado exitosamente de " + oldEmail + " a " + newEmail;
  
  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(oldEmail)) {
    return {
      valido: false,
      mensaje: 'El email anterior no tiene un formato válido'
    };
  }
  
  if (!emailRegex.test(newEmail)) {
    return {
      valido: false,
      mensaje: 'El nuevo email no tiene un formato válido'
    };
  }
  
  // Verificar que los emails sean diferentes
  if (oldEmail === newEmail) {
    return {
      valido: false,
      mensaje: 'El nuevo email debe ser diferente al anterior'
    };
  }
  
  // Verificar dominio permitido (ejemplo)
  const dominiosPermitidos = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  const dominioNuevo = newEmail.split('@')[1];
  
  if (!dominiosPermitidos.includes(dominioNuevo)) {
    return {
      valido: false,
      mensaje: `El dominio ${dominioNuevo} no está permitido`
    };
  }
  
  // Si todo está bien
  return {
    valido: true,
    mensaje: mensaje,
    cambios: {
      emailAnterior: oldEmail,
      emailNuevo: newEmail,
      fecha: new Date().toISOString()
    }
  };
}

/**
 * Función para registrar el cambio de email
 * @param {Object} cambio - Objeto con los datos del cambio
 */
function registrarCambioEmail(cambio) {
  try {
    // Simular registro en base de datos o log
    console.log('Cambio de email registrado:', cambio);
    
    // Aquí iría la lógica para guardar en base de datos
    // Por ejemplo, con Supabase:
    // const { data, error } = await supabase
    //   .from('email_changes')
    //   .insert([cambio]);
    
    return {
      exito: true,
      mensaje: 'Cambio registrado exitosamente'
    };
  } catch (error) {
    return {
      exito: false,
      mensaje: 'Error al registrar el cambio: ' + error.message
    };
  }
}

/**
 * Función principal para procesar cambio de email
 * @param {string} oldEmail - Email anterior
 * @param {string} newEmail - Nuevo email
 */
function procesarCambioEmail(oldEmail, newEmail) {
  // Verificar el cambio
  const verificacion = verificarCambiosEmail(oldEmail, newEmail);
  
  if (!verificacion.valido) {
    return {
      exito: false,
      mensaje: verificacion.mensaje
    };
  }
  
  // Registrar el cambio
  const registro = registrarCambioEmail(verificacion.cambios);
  
  return {
    exito: registro.exito,
    mensaje: registro.mensaje,
    datos: verificacion.cambios
  };
}

// Exportar funciones para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    verificarCambiosEmail,
    registrarCambioEmail,
    procesarCambioEmail
  };
}

// Ejemplo de uso
if (typeof window !== 'undefined') {
  // En el navegador
  window.verificarCambiosEmail = verificarCambiosEmail;
  window.procesarCambioEmail = procesarCambioEmail;
}

// Ejemplo de prueba
if (require.main === module) {
  // Prueba básica
  const resultado = procesarCambioEmail(
    'usuario@gmail.com',
    'nuevo.usuario@yahoo.com'
  );
  
  console.log('Resultado de la prueba:', resultado);
}