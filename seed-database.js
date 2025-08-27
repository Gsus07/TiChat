import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Cargar variables de entorno
config();

// Configurar variables de entorno para que estén disponibles como import.meta.env
process.env.PUBLIC_SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
process.env.PUBLIC_SUPABASE_ANON_KEY = process.env.PUBLIC_SUPABASE_ANON_KEY;

// Simular import.meta.env para Node.js
global.importMeta = {
  env: {
    PUBLIC_SUPABASE_URL: process.env.PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY: process.env.PUBLIC_SUPABASE_ANON_KEY
  }
};

// Importar y ejecutar seeders
import('./src/seeders/index.ts').then(async (module) => {
  try {
    await module.runSeeders();
    console.log('✅ Seeders ejecutados exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error ejecutando seeders:', error);
    process.exit(1);
  }
}).catch((error) => {
  console.error('❌ Error importando seeders:', error);
  process.exit(1);
});