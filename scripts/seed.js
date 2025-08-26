import { runSeeders } from '../src/seeders/index.ts';

// Ejecutar seeders
runSeeders()
  .then(() => {
    console.log('🎉 Seeders completados exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error ejecutando seeders:', error);
    process.exit(1);
  });