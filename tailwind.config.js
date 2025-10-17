/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class', // Habilita el modo oscuro basado en la clase 'dark' del elemento HTML
  theme: {
    extend: {
      colors: {
        // Paleta modernizada inspirada en gata calico
        calico: {
          // Blancos y superficies
          white: '#FAFAFC',
          'white-soft': '#F5F7FA',
          'white-warm': '#FFF7F0',
          cream: '#FFF1E6',
          sand: '#F4E1C1',
          
          // Neutros (slate moderno)
          gray: {
            50: '#F6F7FB',
            100: '#ECEEF5',
            200: '#D7DBE8',
            300: '#A9B0C6',
            400: '#7C859F',
            500: '#5E667A',
            600: '#474E62',
            700: '#323849',
            800: '#222739',
            900: '#161A2A'
          },
          
          // Naranja cálido refinado
          orange: {
            50: '#FFF3E8',
            100: '#FFE4CC',
            200: '#FFD0A8',
            300: '#FEB97A',
            400: '#FD974D',
            500: '#FB7A1F',
            600: '#E76812',
            700: '#C4570F',
            800: '#9F440C',
            900: '#7D360A'
          },
          
          // Colores de acento para patrones atigrados
          stripe: {
            light: '#E6E8F0',
            medium: '#A9B0C6',
            dark: '#5E667A'
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