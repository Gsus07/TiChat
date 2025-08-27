import { createClient } from '@supabase/supabase-js';

// Función para obtener variables de entorno que funcione en navegador y Node.js
function getEnvVar(name: string): string {
  // En el navegador (Astro)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[name];
  }
  
  // En Node.js
  if (typeof process !== 'undefined' && process.env) {
    return process.env[name] || '';
  }
  
  // Fallback para contextos especiales
  if (typeof globalThis !== 'undefined' && (globalThis as any).importMeta?.env) {
    return (globalThis as any).importMeta.env[name];
  }
  
  throw new Error(`No se pudo obtener la variable de entorno: ${name}`);
}

const supabaseUrl = getEnvVar('PUBLIC_SUPABASE_URL');
const supabaseKey = getEnvVar('PUBLIC_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Las variables de entorno de Supabase no están configuradas correctamente');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

// Exportar también las variables para debugging
export { supabaseUrl, supabaseKey };
