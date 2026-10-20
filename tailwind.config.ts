import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'rgb(var(--border) / <alpha-value>)',
        input: 'rgb(var(--input) / <alpha-value>)',
        ring: 'rgb(var(--ring) / <alpha-value>)',
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          foreground: 'rgb(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
          foreground: 'rgb(var(--secondary-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'rgb(var(--destructive) / <alpha-value>)',
          foreground: 'rgb(var(--destructive-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
          foreground: 'rgb(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          foreground: 'rgb(var(--accent-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'rgb(var(--popover) / <alpha-value>)',
          foreground: 'rgb(var(--popover-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'rgb(var(--card) / <alpha-value>)',
          foreground: 'rgb(var(--card-foreground) / <alpha-value>)',
        },
        ios: {
          background: 'rgb(var(--ios-background) / <alpha-value>)',
          secondary: 'rgb(var(--ios-secondary-background) / <alpha-value>)',
          tertiary: 'rgb(var(--ios-tertiary-background) / <alpha-value>)',
          quaternary: 'rgb(var(--ios-quaternary-background) / <alpha-value>)',
          blue: 'rgb(var(--ios-blue) / <alpha-value>)',
          green: 'rgb(var(--ios-green) / <alpha-value>)',
          purple: 'rgb(var(--ios-purple) / <alpha-value>)',
          gray: 'rgb(var(--ios-gray) / <alpha-value>)',
          separator: 'rgb(var(--ios-separator) / <alpha-value>)',
          red: 'rgb(var(--ios-red) / <alpha-value>)',
          'on-blue': 'rgb(var(--ios-on-blue) / <alpha-value>)',
          'on-red': 'rgb(var(--ios-on-red) / <alpha-value>)',
        },
        gh: {
          bg: 'rgb(var(--gh-bg) / <alpha-value>)',
          scrim: 'var(--gh-scrim)',
          'surface-100': 'rgb(var(--gh-surface-100) / <alpha-value>)',
          'surface-200': 'rgb(var(--gh-surface-200) / <alpha-value>)',
          'surface-300': 'rgb(var(--gh-surface-300) / <alpha-value>)',
          'surface-400': 'rgb(var(--gh-surface-400) / <alpha-value>)',
          line: 'rgb(var(--gh-line) / <alpha-value>)',
          'line-strong': 'rgb(var(--gh-line-strong) / <alpha-value>)',
          ink: 'rgb(var(--gh-ink) / <alpha-value>)',
          'ink-2': 'rgb(var(--gh-ink-2) / <alpha-value>)',
          muted: 'rgb(var(--gh-muted) / <alpha-value>)',
          subtle: 'rgb(var(--gh-subtle) / <alpha-value>)',
          primary: 'rgb(var(--gh-primary) / <alpha-value>)',
          'on-primary': 'rgb(var(--gh-on-primary) / <alpha-value>)',
          'primary-pressed': 'rgb(var(--gh-primary-pressed) / <alpha-value>)',
          'primary-strong': 'rgb(var(--gh-primary-strong) / <alpha-value>)',
          'primary-tint': 'rgb(var(--gh-primary-tint) / <alpha-value>)',
          'focus-ring': 'rgb(var(--gh-focus-ring) / <alpha-value>)',
          available: 'rgb(var(--gh-available) / <alpha-value>)',
          'available-bg': 'rgb(var(--gh-available-bg) / <alpha-value>)',
          taken: 'rgb(var(--gh-taken) / <alpha-value>)',
          'taken-bg': 'rgb(var(--gh-taken-bg) / <alpha-value>)',
          warning: 'rgb(var(--gh-warning) / <alpha-value>)',
          'warning-bg': 'rgb(var(--gh-warning-bg) / <alpha-value>)',
          danger: 'rgb(var(--gh-danger) / <alpha-value>)',
          'danger-bg': 'rgb(var(--gh-danger-bg) / <alpha-value>)',
        },
        sidebar: {
          DEFAULT: 'rgb(var(--sidebar-background) / <alpha-value>)',
          foreground: 'rgb(var(--sidebar-foreground) / <alpha-value>)',
          primary: 'rgb(var(--sidebar-primary) / <alpha-value>)',
          'primary-foreground': 'rgb(var(--sidebar-primary-foreground) / <alpha-value>)',
          accent: 'rgb(var(--sidebar-accent) / <alpha-value>)',
          'accent-foreground': 'rgb(var(--sidebar-accent-foreground) / <alpha-value>)',
          border: 'rgb(var(--sidebar-border) / <alpha-value>)',
          ring: 'rgb(var(--sidebar-ring) / <alpha-value>)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        'gh-sm': 'var(--gh-radius-sm)',
        'gh-md': 'var(--gh-radius-md)',
        'gh-lg': 'var(--gh-radius-lg)',
        'gh-xl': 'var(--gh-radius-xl)',
        'gh-sheet': 'var(--gh-radius-sheet)',
        'gh-pill': 'var(--gh-radius-pill)',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
        brand: ['Fredoka', '"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'gh-sheet': 'var(--gh-shadow-sheet)',
        'gh-panel': 'var(--gh-shadow-panel)',
        'gh-menu': 'var(--gh-shadow-menu)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
