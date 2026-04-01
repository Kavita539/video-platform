/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: 'var(--bg-base)',
        surface: 'var(--bg-surface)',
        raised: 'var(--bg-raised)',
        overlay: 'var(--bg-overlay)',
        border: 'var(--border)',
        'border-bright': 'var(--border-bright)',
        
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        
        accent: 'var(--accent)',
        'accent-dim': 'var(--accent-dim)',
        danger: 'var(--danger)',
        'danger-dim': 'var(--danger-dim)',
        success: 'var(--success)',
        info: 'var(--info)',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius)',
        lg: 'var(--radius-lg)',
      },
      transitionTimingFunction: {
        custom: 'cubic-bezier(0.4,0,0.2,1)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.4s ease both',
        fadeIn: 'fadeIn 0.3s ease both',
        shimmer: 'shimmer 1.4s infinite',
      },
    },
  },
  plugins: [],
}