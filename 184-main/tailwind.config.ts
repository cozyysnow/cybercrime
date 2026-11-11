import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#102a43',
        },
        slate: {
          850: '#172033',
          950: '#0a0f1d',
        },
        neon: '#2563eb', // Updated to subtle brand blue for clean SaaS theme
        obsidian: '#ffffff', // Updated to clean white background
        gunmetal: '#f1f5f9', // Updated to clean light background
        charcoal: '#e2e8f0', // Light border
        ash: '#64748b', // Slate muted
        silver: '#94a3b8',
        alabaster: '#f8fafc',
        platinum: '#f1f5f9',
        porcelain: '#ffffff',
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'Inter', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
        body: ['var(--font-body)', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'technical-grid': 'linear-gradient(to right, rgba(0, 0, 0, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.04) 1px, transparent 1px)',
        'technical-grid-dark': 'linear-gradient(to right, rgba(0, 0, 0, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.04) 1px, transparent 1px)',
        'technical-grid-light': 'linear-gradient(to right, rgba(0, 0, 0, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.04) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid-unit': '32px 32px',
      },
      animation: {
        'slideDown': 'slideDown 0.3s ease-out forwards',
        'slideUp': 'slideUp 0.3s ease-in forwards',
        'marquee': 'marquee 30s linear infinite',
      },
      keyframes: {
        slideDown: {
          '0%': { height: '0', opacity: '0' },
          '100%': { height: 'var(--radix-content-height, auto)', opacity: '1' }
        },
        slideUp: {
          '0%': { height: 'var(--radix-content-height, auto)', opacity: '1' },
          '100%': { height: '0', opacity: '0' }
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' }
        }
      }
    },
  },
  plugins: [],
};

export default config;
