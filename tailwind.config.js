/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  safelist: [
    // tone-driven utilities used dynamically across widgets
    { pattern: /(bg|text|border|from|to|ring)-(gold|cyan|coral|mint|work|creative|personal|rose|silver)(\/\d+)?/ },
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0A0E1A',
        'bg-deep': '#060912',
        surface: 'rgba(255,255,255,0.04)',
        'surface-solid': '#151A2E',
        border: 'rgba(255,255,255,0.08)',
        'border-strong': 'rgba(255,255,255,0.16)',
        text: {
          DEFAULT: '#EDEFF7',
          dim: '#9AA0B8',
          muted: '#5C6380',
        },
        gold: '#F5B942',
        mint: '#6EE7B7',
        coral: '#FF8A65',
        rose: '#F43F5E',
        cyan: '#06B6D4',
        silver: '#F1F5F9',
        work: '#60A5FA',
        personal: '#A78BFA',
        creative: '#F472B6',
        daily: '#6EE7B7',
      },
      fontFamily: {
        heading: ['"Bebas Neue"', 'system-ui', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '6px',
        sm: '4px',
        md: '6px',
        lg: '10px',
      },
    },
  },
  plugins: [],
}
