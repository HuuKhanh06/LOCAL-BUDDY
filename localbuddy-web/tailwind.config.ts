import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // 4 Core Brand Colors
        burgundy: {
          DEFAULT: '#1A0A0F',
          light: '#2E131C',
          soft: '#4A202E',
        },
        blush: {
          DEFAULT: '#F6E6EA',
          light: '#FBF4F6',
          medium: '#EDD2D9',
          border: '#E4C3CC',
        },
        navy: {
          DEFAULT: '#1C1C28',
          light: '#2B2B3D',
          muted: '#52526B',
          subtle: '#787891',
        },
        cyan: {
          DEFAULT: '#1EC1CB',
          hover: '#18A7B0',
          active: '#138E96',
          soft: '#E5F8F9',
          border: '#8CE2E7',
        },
        // Layout aliases
        bg: '#FBF4F6',
        surface: '#FFFFFF',
        'text-main': '#1C1C28',
        'text-muted': '#52526B',
        border: '#E4C3CC',
        // Semantic statuses
        success: {
          DEFAULT: '#0F6E4B',
          bg: '#E3F7EF',
          border: '#99E2C4',
        },
        warning: {
          DEFAULT: '#8C4A08',
          bg: '#FEF1DC',
          border: '#F8CA84',
        },
        error: {
          DEFAULT: '#A61B2B',
          bg: '#FCE8EB',
          border: '#F5B2BA',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        btn: '12px',
        card: '12px',
        modal: '16px',
        badge: '9999px',
      },
      boxShadow: {
        card: '0 2px 10px rgba(26, 10, 15, 0.05), 0 1px 3px rgba(28, 28, 40, 0.04)',
        'card-hover': '0 10px 24px rgba(26, 10, 15, 0.09), 0 4px 8px rgba(28, 28, 40, 0.05)',
        modal: '0 20px 40px rgba(26, 10, 15, 0.22)',
      },
    },
  },
  plugins: [],
}

export default config
