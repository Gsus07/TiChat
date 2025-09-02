/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Paleta inspirada en gata calico
        calico: {
          // Blanco dominante (60%)
          white: '#FEFEFE',
          'white-soft': '#F8F9FA',
          'white-warm': '#FDF8F5',
          
          // Gris atigrado (35%)
          gray: {
            50: '#F7F8F9',
            100: '#E8EAED',
            200: '#D1D5DB',
            300: '#9CA3AF',
            400: '#6B7280',
            500: '#4B5563',
            600: '#374151',
            700: '#1F2937',
            800: '#111827',
            900: '#0F172A'
          },
          
          // Naranja cálido (15%)
          orange: {
            50: '#FFF7ED',
            100: '#FFEDD5',
            200: '#FED7AA',
            300: '#FDBA74',
            400: '#FB923C',
            500: '#F97316',
            600: '#EA580C',
            700: '#C2410C',
            800: '#9A3412',
            900: '#7C2D12'
          },
          
          // Colores de acento para patrones atigrados
          stripe: {
            light: '#E5E7EB',
            medium: '#9CA3AF',
            dark: '#4B5563'
          }
        }
      },
      backgroundImage: {
        // Patrones que evocan pelaje atigrado
        'calico-stripes': 'linear-gradient(45deg, transparent 25%, rgba(156, 163, 175, 0.1) 25%, rgba(156, 163, 175, 0.1) 50%, transparent 50%, transparent 75%, rgba(156, 163, 175, 0.1) 75%)',
        'calico-gradient': 'linear-gradient(135deg, #FEFEFE 0%, #F8F9FA 60%, #FDBA74 85%, #F97316 100%)'
      }
    },
  },
  plugins: [],
}