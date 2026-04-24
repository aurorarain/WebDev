/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      /* 亮色简洁主题配色 — Apple 风格白底 + 紫色强调 */
      colors: {
        'sw-bg': '#ffffff',
        'sw-surface': '#f5f5f7',
        'sw-surface-2': '#e8e8ed',
        'sw-border': '#d2d2d7',
        'sw-text': '#1d1d1f',
        'sw-muted': '#86868b',
        'sw-accent': '#6366f1',
        'sw-accent-2': '#8b5cf6',
        'sw-glow': '#4f46e5',
      },
      /* 字体配置 — Outfit 做标题（苹果感宽字距），Inter 做正文 */
      fontFamily: {
        'display': ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      /* 自定义动画 */
      boxShadow: {
        'glass': '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
        'glass-hover': '0 10px 30px rgba(0,0,0,0.06), 0 1px 8px rgba(0,0,0,0.04)',
        'elevated': '0 20px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
      },
      animation: {
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
