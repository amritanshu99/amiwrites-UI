/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  safelist: [
    "hover:text-blue-700",
    "hover:text-gray-800",
    "hover:text-pink-500",
    "hover:text-blue-600",
  ],
  theme: {
    extend: {
      animation: {
        "fade-in-left": "fadeInLeft 0.8s ease-out forwards",
        "text-glow-hover": "textGlowHover 1.5s ease-in-out infinite alternate",
        "fade-in": "fadeIn 0.3s ease-in-out forwards",
        "fade-in-down": "fadeInDown 0.4s ease-out both",
        "popup-fade-in": "popupFadeIn 0.3s ease-out forwards",
        "spin-slower": "spin 2s linear infinite",
        "fade-in-slow": "fadeInSlow 3s ease-out forwards",
        glitch: "glitch 0.7s infinite linear alternate", // ✅ new
        flicker: "flicker 3s ease-in-out infinite", // ✅ new
        smoke: "smoke 1s ease-out",

        /* ---------- ADDED: professional hero animations & helpers ---------- */
        "fade-in-up": "fadeInUp 0.8s ease-out forwards",
        "fade-in-up-delay-1": "fadeInUp 0.8s ease-out 0.12s forwards",
        "fade-in-up-delay-2": "fadeInUp 0.8s ease-out 0.24s forwards",
        "fade-in-up-delay-3": "fadeInUp 0.8s ease-out 0.36s forwards",

        "fade-in-up-pop": "fadeInUpPop 0.9s cubic-bezier(.0,.95,.12,1) forwards",
        "fade-in-up-pop-delay-1":
          "fadeInUpPop 0.9s cubic-bezier(.0,.95,.12,1) 0.12s forwards",

        "hero-entrance": "heroEntrance 0.95s cubic-bezier(.0,.95,.12,1) both",
        "hero-entrance-delay-1":
          "heroEntrance 0.95s cubic-bezier(.0,.95,.12,1) 0.10s both",
        "hero-entrance-delay-2":
          "heroEntrance 0.95s cubic-bezier(.0,.95,.12,1) 0.20s both",
        "hero-entrance-delay-3":
          "heroEntrance 0.95s cubic-bezier(.0,.95,.12,1) 0.30s both",

        "underline-reveal": "underlineReveal 0.6s cubic-bezier(.2,.9,.2,1) both",

        /* --------- REFINED: slower, softer, professional shimmer ---------- */
        "headline-shimmer": "headlineShimmer 3s ease-in-out infinite",
      },
      keyframes: {
        fadeInLeft: {
          "0%": { opacity: 0, transform: "translateX(-30px)" },
          "100%": { opacity: 1, transform: "translateX(0)" },
        },
        textGlowHover: {
          "0%": {
            filter: "drop-shadow(0 0 1px #0ea5e9)",
            color: "#0284c7",
          },
          "100%": {
            filter: "drop-shadow(0 0 6px #38bdf8)",
            color: "#0369a1",
          },
        },
        fadeIn: {
          "0%": { opacity: 0, transform: "scale(0.95)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
        fadeInDown: {
          "0%": { opacity: 0, transform: "translateY(-10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        popupFadeIn: {
          "0%": { opacity: 0, transform: "scale(0.9)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
        fadeInSlow: {
          "0%": { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        smoke: {
          "0%": {
            opacity: "0",
            transform: "translateY(10px) scale(0.98)",
            filter: "blur(4px)",
          },
          "30%": {
            opacity: "0.7",
            transform: "translateY(-2px) scale(1.01)",
            filter: "blur(1.5px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0px) scale(1)",
            filter: "blur(0px)",
          },
        },
        glitch: {
          "0%, 100%": { transform: "translate(0)" },
          "20%": { transform: "translate(-2px, 2px)" },
          "40%": { transform: "translate(2px, -2px)" },
          "60%": { transform: "translate(-1px, 1px)" },
          "80%": { transform: "translate(1px, -1px)" },
        },
        flicker: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.3 },
        },

        /* ---------- ADDED: fadeInUp + pop variants ---------- */
        fadeInUp: {
          "0%": { opacity: 0, transform: "translateY(18px) scale(0.995)" },
          "60%": {
            opacity: 0.92,
            transform: "translateY(6px) scale(1.01)",
          },
          "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
        },
        fadeInUpPop: {
          "0%": { opacity: 0, transform: "translateY(20px) scale(0.985)" },
          "55%": {
            opacity: 0.95,
            transform: "translateY(8px) scale(1.03)",
          },
          "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
        },

        /* ---------- ADDED: hero entrance + underline + refined shimmer ---------- */
        heroEntrance: {
          "0%": {
            opacity: 0,
            transform: "translateY(26px) scale(0.985)",
            filter: "blur(2px)",
          },
          "55%": {
            opacity: 1,
            transform: "translateY(-6px) scale(1.02)",
            filter: "blur(0)",
          },
          "100%": {
            opacity: 1,
            transform: "translateY(0) scale(1)",
            filter: "blur(0)",
          },
        },
        underlineReveal: {
          "0%": { transform: "scaleX(0)", opacity: 0 },
          "60%": { transform: "scaleX(1.02)", opacity: 1 },
          "100%": { transform: "scaleX(1)", opacity: 1 },
        },

        /* refined shimmer: narrower range and slower for a subtle professional look */
        headlineShimmer: {
          "0%": { "background-position": "-150% 0" },
          "100%": { "background-position": "150% 0" },
        },
      },
    },
  },
};
