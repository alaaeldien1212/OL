import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',        // Deeper Blue
        secondary: '#F59E0B',      // Deeper Gold/Amber
        accent: {
          green: '#10B981',        // Deeper Green
          red: '#EF4444',          // Deeper Red
        },
        ink: '#0F172A',            // Darker Navy
        surface: '#FFFFFF',        // White
        cloud: '#0F172A',          // Dark background
        bg: '#1E293B',             // Dark slate
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
      },
      fontFamily: {
        arabic: ['var(--font-almarai)', 'var(--font-cairo)', 'system-ui'],
        heading: ['var(--font-cairo)', 'var(--font-almarai)', 'system-ui'],
        body: ['var(--font-almarai)', 'var(--font-cairo)', 'system-ui'],
      },
      fontSize: {
        xs: ['14px', { lineHeight: '1.5', fontWeight: '600' }],
        sm: ['16px', { lineHeight: '1.5', fontWeight: '600' }],
        base: ['18px', { lineHeight: '1.6', fontWeight: '600' }],
        lg: ['20px', { lineHeight: '1.6', fontWeight: '700' }],
        xl: ['24px', { lineHeight: '1.5', fontWeight: '700' }],
        '2xl': ['28px', { lineHeight: '1.4', fontWeight: '800' }],
        '3xl': ['32px', { lineHeight: '1.3', fontWeight: '800' }],
      },
      borderRadius: {
        'xs': '6px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '28px',
      },
      boxShadow: {
        'card': '0 4px 12px rgba(0, 0, 0, 0.15)',
        'hover': '0 8px 24px rgba(0, 0, 0, 0.2)',
        'lg': '0 12px 32px rgba(0, 0, 0, 0.25)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'bounce-gentle': 'bounce-gentle 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        'bounce-gentle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'slide-up': {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      spacing: {
        'safe': 'env(safe-area-inset-bottom)',
      },
    },
  },
  plugins: [],
}

export default config
