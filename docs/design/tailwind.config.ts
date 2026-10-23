import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      xs: '360px',
      sm: '480px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1440px',
    },
    extend: {
      colors: {
        // Core Theme & Canvas
        background: '#121212',
        foreground: '#F5F5F0',

        // Surfaces & Cards
        surface: {
          DEFAULT: '#1A1A1A',
          elevated: '#242424',
          hover: '#2C2C2C',
        },
        card: {
          DEFAULT: '#1A1A1A',
          foreground: '#F5F5F0',
          elevated: '#242424',
          hover: '#2C2C2C',
        },
        popover: {
          DEFAULT: '#1E1E1E',
          foreground: '#F5F5F0',
        },

        // Primary Brand CTA (Warm Vintage Amber)
        primary: {
          DEFAULT: '#D97706',
          hover: '#F59E0B',
          foreground: '#121212',
          light: '#F59E0B',
          dark: '#B45309',
        },

        // Secondary Brand Accent (Cognac Leather)
        secondary: {
          DEFAULT: '#784C25',
          hover: '#8C582B',
          foreground: '#FFFFFF',
          light: '#9E6738',
          dark: '#5C3819',
        },

        // Muted & Subtle Neutrals
        muted: {
          DEFAULT: '#262626',
          foreground: '#A8A29E',
          subtle: '#78716C',
        },
        accent: {
          DEFAULT: '#F59E0B',
          foreground: '#121212',
        },

        // Form Controls & Borders
        border: {
          DEFAULT: '#2E2E2E',
          accent: '#D97706',
        },
        input: '#2E2E2E',
        ring: '#D97706',

        // Feedback & Alerts
        destructive: {
          DEFAULT: '#B91C1C',
          foreground: '#FFFFFF',
        },
        success: {
          DEFAULT: '#047857',
          foreground: '#FFFFFF',
          solid: '#10B981',
        },

        // Booking Status Badges (Strict M0/M1 Contract)
        status: {
          confirmed: {
            DEFAULT: '#064E3B',
            text: '#34D399',
            solid: '#10B981',
          },
          pending: {
            DEFAULT: '#451A03',
            text: '#FBBF24',
            solid: '#D97706',
          },
          noshow: {
            DEFAULT: '#450A0A',
            text: '#F87171',
            solid: '#DC2626',
          },
          cancelled: {
            DEFAULT: '#27272A',
            text: '#A1A1AA',
            solid: '#52525B',
          },
        },

        // Damez Specific Brand Palette
        damez: {
          charcoal: {
            DEFAULT: '#121212',
            900: '#121212',
            800: '#1A1A1A',
            700: '#242424',
            600: '#2C2C2C',
            500: '#383838',
          },
          amber: {
            50: '#FFFBEB',
            100: '#FEF3C7',
            200: '#FDE68A',
            300: '#FCD34D',
            400: '#FBBF24',
            500: '#F59E0B',
            600: '#D97706',
            700: '#B45309',
            800: '#92400E',
            900: '#78350F',
          },
          cognac: {
            DEFAULT: '#784C25',
            hover: '#8C582B',
            light: '#9E6738',
            dark: '#5C3819',
          },
          cream: {
            DEFAULT: '#F5F5F0',
            100: '#FAF9F6',
            200: '#F5F5F0',
            300: '#EBEAE5',
            400: '#DCDAD5',
          },
          stone: {
            muted: '#A8A29E',
            subtle: '#78716C',
          },
        },
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'display-lg': ['2.75rem', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-md': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
        'heading-lg': ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '700' }],
        'heading-md': ['1.25rem', { lineHeight: '1.35', letterSpacing: '0em', fontWeight: '600' }],
        'heading-sm': ['1.125rem', { lineHeight: '1.4', letterSpacing: '0em', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6', letterSpacing: '0em', fontWeight: '400' }],
        'body-md': ['1rem', { lineHeight: '1.5', letterSpacing: '0em', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0em', fontWeight: '400' }],
        caption: ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.04em', fontWeight: '500' }],
        'mono-code': ['0.875rem', { lineHeight: '1.4', letterSpacing: '0.05em', fontWeight: '600' }],
      },
      borderRadius: {
        none: '0px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      boxShadow: {
        card: '0 4px 12px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.5)',
        'card-selected': '0 0 16px rgba(217, 119, 6, 0.20)',
        'amber-glow': '0 0 20px rgba(217, 119, 6, 0.25)',
        'sticky-bar': '0 -4px 20px rgba(0, 0, 0, 0.6)',
        modal: '0 20px 40px rgba(0, 0, 0, 0.8)',
      },
    },
  },
  plugins: [],
};

export default config;
