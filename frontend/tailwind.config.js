/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#e0fbff',
          100: '#b8f5ff',
          200: '#7aedff',
          300: '#38e2ff',
          400: '#00d4f0',
          500: '#00b8d4',
          600: '#0097b2',
          700: '#007a91',
          800: '#005f70',
          900: '#00404d',
        },
        navy: {
          900: '#040d1a',
          800: '#071628',
          700: '#0d2137',
          600: '#112940',
          500: '#173450',
          400: '#1e4060',
          300: '#2a5478',
          200: '#3b6f9a',
          100: '#6b9ec7',
          50:  '#a9cdea',
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        secondary: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
        },
        accent: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'dark-radial': 'radial-gradient(ellipse at 50% 0%, #0d2137 0%, #040d1a 70%)',
        'hero-glow': 'radial-gradient(ellipse at 50% 40%, rgba(0,180,212,0.12) 0%, transparent 65%)',
        'card-glow': 'radial-gradient(ellipse at 50% 0%, rgba(0,180,212,0.08) 0%, transparent 70%)',
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 180, 212, 0.25)',
        'glow-cyan-lg': '0 0 40px rgba(0, 180, 212, 0.3)',
        'card-dark': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 40px rgba(0, 180, 212, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
