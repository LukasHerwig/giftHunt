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
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        ios: {
          background: 'hsl(var(--ios-background))',
          secondary: 'hsl(var(--ios-secondary-background))',
          tertiary: 'hsl(var(--ios-tertiary-background))',
          quaternary: 'hsl(var(--ios-quaternary-background))',
          blue: 'hsl(var(--ios-blue))',
          green: 'hsl(var(--ios-green))',
          purple: 'hsl(var(--ios-purple))',
          gray: 'hsl(var(--ios-gray))',
          separator: 'hsl(var(--ios-separator))',
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
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
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
