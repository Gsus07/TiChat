/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class', // Habilita el modo oscuro basado en la clase 'dark' del elemento HTML
  theme: {
    extend: {
      colors: {
        // Paleta basada en variables CSS para soportar tema global
        calico: {
          // Blancos y superficies
          white: 'var(--calico-white)',
          'white-soft': 'var(--calico-white-soft)',
          'white-warm': 'var(--calico-white-warm)',
          cream: 'var(--calico-cream)',
          sand: 'var(--calico-ivory)',
          
          // Neutros (slate moderno)
          gray: {
            50: 'var(--calico-gray-50)',
            100: 'var(--calico-gray-100)',
            200: 'var(--calico-gray-200)',
            300: 'var(--calico-gray-300)',
            400: 'var(--calico-gray-400)',
            500: 'var(--calico-gray-500)',
            600: 'var(--calico-gray-600)',
            700: 'var(--calico-gray-700)',
            800: 'var(--calico-gray-800)',
            900: 'var(--calico-gray-900)'
          },
          
          // Naranja cálido refinado
          orange: {
            50: 'var(--calico-orange-50)',
            100: 'var(--calico-orange-100)',
            200: 'var(--calico-orange-200)',
            300: 'var(--calico-orange-300)',
            400: 'var(--calico-orange-400)',
            500: 'var(--calico-orange-500)',
            600: 'var(--calico-orange-600)',
            700: 'var(--calico-orange-700)',
            800: 'var(--calico-orange-800)',
            900: 'var(--calico-orange-900)'
          },
          
          // Colores de acento para patrones atigrados
          stripe: {
            light: 'var(--calico-stripe-light)',
            medium: 'var(--calico-stripe-medium)',
            dark: 'var(--calico-stripe-dark)'
          }
        }
      },
      backgroundImage: {
        // Patrones que evocan pelaje atigrado (modernizados)
        'calico-stripes': 'linear-gradient(45deg, transparent 25%, rgba(124, 133, 159, 0.08) 25%, rgba(124, 133, 159, 0.08) 50%, transparent 50%, transparent 75%, rgba(124, 133, 159, 0.08) 75%)',
        'calico-gradient': 'linear-gradient(135deg, #FAFAFC 0%, #F5F7FA 60%, #FEB97A 85%, #FB7A1F 100%)'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
        heading: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      }
    },
  },
  plugins: [],
}