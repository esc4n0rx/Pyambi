/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./templates/**/*.html",
    "./static/js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#6366f1',
        'primary-dark': '#4338ca',
        'secondary': '#f59e0b',
        'dark': '#111827',
        'light': '#f3f4f6'
      },
      boxShadow: {
        'ambilight': '0 0 180px 60px',
        'ambilight-lg': '0 0 300px 100px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
  safelist: [
    'z-10',
    'ambilight-active',
    'pulse-animation',
    'box-shadow'
  ]
}