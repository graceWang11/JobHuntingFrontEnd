/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: '#e8ecf4',
          50: '#f3f5fa',
          100: '#e8ecf4',
          200: '#d6dce8',
          300: '#b9c2d4',
        },
        ink: {
          DEFAULT: '#2a2f45',
          soft: '#4b5172',
          mute: '#8b91ac',
        },
        accent: {
          violet: '#7c5cff',
          pink: '#ff6ec7',
          sky: '#5cc8ff',
          mint: '#5cffb1',
          peach: '#ffb86c',
          rose: '#ff7a7a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'sans-serif'],
      },
      boxShadow: {
        neu: '8px 8px 20px #c5cad6, -8px -8px 20px #ffffff',
        'neu-sm': '4px 4px 10px #c5cad6, -4px -4px 10px #ffffff',
        'neu-lg': '14px 14px 32px #c5cad6, -14px -14px 32px #ffffff',
        'neu-inset': 'inset 5px 5px 10px #c5cad6, inset -5px -5px 10px #ffffff',
        'neu-inset-sm': 'inset 3px 3px 6px #c5cad6, inset -3px -3px 6px #ffffff',
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        'glass-lg': '0 18px 50px 0 rgba(31, 38, 135, 0.2)',
        glow: '0 0 24px rgba(124, 92, 255, 0.45)',
      },
      backgroundImage: {
        'mesh-aurora':
          'radial-gradient(at 18% 22%, rgba(124,92,255,0.55) 0px, transparent 50%), radial-gradient(at 82% 18%, rgba(255,110,199,0.45) 0px, transparent 50%), radial-gradient(at 78% 82%, rgba(92,200,255,0.45) 0px, transparent 50%), radial-gradient(at 18% 80%, rgba(255,184,108,0.35) 0px, transparent 50%)',
        'accent-grad': 'linear-gradient(135deg, #7c5cff 0%, #ff6ec7 50%, #5cc8ff 100%)',
      },
      borderRadius: {
        '2.5xl': '1.25rem',
        '4xl': '2rem',
      },
      animation: {
        float: 'float 8s ease-in-out infinite',
        'float-slow': 'float 14s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
          '50%': { transform: 'translateY(-22px) translateX(10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
