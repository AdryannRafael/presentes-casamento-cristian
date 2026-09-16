/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta extraída do convite (eucalipto + dourado envelhecido)
        sage: {
          50: '#F3F5EE',
          100: '#E3E8D7',
          200: '#C4CDAD',
          400: '#8B996E',
          500: '#6E7C5A',
          600: '#586447',
          700: '#454F37',
        },
        gold: {
          100: '#F1E6C8',
          300: '#D8BD79',
          500: '#B99A4B',
          600: '#9C7F37',
        },
        cream: '#FBF8F2',
        ink: '#33362F',
        line: '#E4DFD3',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 20px -4px rgba(51, 54, 47, 0.08)',
        softer: '0 2px 10px -2px rgba(51, 54, 47, 0.06)',
      },
      borderRadius: {
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
}
