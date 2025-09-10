import { createClient } from '@supabase/supabase-js';

// Función para obtener variables de entorno que funcione en navegador y Node.js
function getEnvVar(name: string): string {
  // En el navegador (Astro client-side)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const value = import.meta.env[name];
    if (value) return value;
  }
  
  // En Node.js (Astro server-side)
  if (typeof process !== 'undefined' && process.env) {
    const value = process.env[name];
    if (value) return value;
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
