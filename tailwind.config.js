/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ... (warna yang sudah ada)
        background: {
          light: '#F8FAFC',
          dark: '#0E0B20',
        },
        accent: {
          blue: '#4A90E2',
          pink: '#E040FB',
          yellow: '#F5A623',
        },
        text: {
          DEFAULT: '#1A202C',
          light: '#F8FAFC',
          dark: '#1A202C',
        },
        neutral: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#181E2E',
          900: '#111621',
        },
        primary: {
          DEFAULT: '#4A90E2',
          '50': '#EEF6FC',
          '100': '#DCECF9',
          '200': '#B9DFF4',
          '300': '#96D2EE',
          '400': '#73C6E9',
          '500': '#4A90E2',
          '600': '#3A7AC9',
          '700': '#2963B0',
          '800': '#1A4D97',
          '900': '#0D387E',
          '950': '#062057',
        },
        secondary: {
          DEFAULT: '#E040FB',
          '50': '#FDF2FE',
          '100': '#F9E5FF',
          '200': '#F3CFFF',
          '300': '#EEB8FF',
          '400': '#E8A2FF',
          '500': '#E040FB',
          '600': '#C92BEE',
          '700': '#B31ACF',
          '800': '#9D0AB0',
          '900': '#870091',
          '950': '#5E006A',
        },
      },
      fontFamily: { // MODIFIED: Tambahkan konfigurasi font family
        sans: ['"Inter"', 'sans-serif'], // Contoh: Gunakan Inter (perlu diimport di index.css)
        mono: ['"Space Mono"', 'monospace'], // Contoh: Font monospaced yang futuristik
      },
      boxShadow: { // MODIFIED: Tambahkan shadow kustom untuk glow
        'glow-sm': '0 0 8px rgba(74, 144, 226, 0.4), 0 0 16px rgba(224, 64, 251, 0.2)', // Gabungan primary dan secondary
        'glow-md': '0 0 15px rgba(74, 144, 226, 0.6), 0 0 30px rgba(224, 64, 251, 0.4)',
        'glow-lg': '0 0 25px rgba(74, 144, 226, 0.8), 0 0 50px rgba(224, 64, 251, 0.6)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'fade-in': 'fadeIn 0.8s ease-out forwards',
      },
      animationDelay: {
        '0': '0s',
        '100': '0.1s',
        '150': '0.15s',
        '200': '0.2s',
        '300': '0.3s',
        '400': '0.4s',
        '500': '0.5s',
        '600': '0.6s',
        '700': '0.7s',
        '800': '0.8s',
        '900': '0.9s',
        '1000': '1s',
      },
    },
  },
  plugins: [],
};