/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
    darkMode: 'class',
  theme: {
    extend: {
      animation: {
        'fade-in-left': 'fadeInLeft 0.8s ease-out forwards',
        'text-glow-hover': 'textGlowHover 1.5s ease-in-out infinite alternate',
        'fade-in': 'fadeIn 0.3s ease-in-out forwards',
        'fade-in-down': 'fadeInDown 0.4s ease-out both',
        'popup-fade-in': 'popupFadeIn 0.3s ease-out forwards',
        'spin-slower': 'spin 2s linear infinite', // ✅ existing
        'fade-in-slow': 'fadeInSlow 3s ease-out forwards', // ✅ new
      },
      keyframes: {
        fadeInLeft: {
          '0%': { opacity: 0, transform: 'translateX(-30px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
        textGlowHover: {
          '0%': {
            filter: 'drop-shadow(0 0 1px #0ea5e9)',
            color: '#0284c7',
          },
          '100%': {
            filter: 'drop-shadow(0 0 6px #38bdf8)',
            color: '#0369a1',
          },
        },
        fadeIn: {
          '0%': { opacity: 0, transform: 'scale(0.95)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        fadeInDown: {
          '0%': { opacity: 0, transform: 'translateY(-10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        popupFadeIn: {
          '0%': { opacity: 0, transform: 'scale(0.9)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        fadeInSlow: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        }, // ✅ new
      },
    },
  },
};
