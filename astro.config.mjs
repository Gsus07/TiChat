// @ts-check
import { defineConfig } from 'astro/config';
import { config } from 'dotenv';

import react from '@astrojs/react';
import node from '@astrojs/node';

import tailwindcss from '@tailwindcss/vite';


// Cargar variables de entorno desde .env
config();

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [react()],
  
  // Enable View Transitions (no longer experimental in Astro 5)
  experimental: {},
  
  // Optimize build and dev server
  build: {
    inlineStylesheets: 'auto'
  },
  
  // Prefetch configuration for faster navigation
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover'
  },

  vite: {
    plugins: [tailwindcss()],
    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom']
    },
    // Build optimizations
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom']
          }
        }
      }
    }
  }
});