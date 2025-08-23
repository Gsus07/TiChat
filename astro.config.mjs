// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'server',
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