/** @type {import('tailwindcss').Config} */
// Theme: "Aurora" - a modern violet/indigo system on deep slate, generated
// in the spirit of the theme-factory skill. Used across auth, dashboards
// and the live scanner for a cohesive, premium look.
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        ink: {
          900: "#0b1020",
          800: "#11162a",
          700: "#1a2238",
          600: "#273150",
        },
        accent: "#22d3ee",
        success: "#34d399",
        danger: "#fb7185",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Sora", "Inter", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(99,102,241,0.25), 0 20px 60px -20px rgba(79,70,229,0.55)",
        card: "0 10px 40px -15px rgba(2,6,23,0.6)",
      },
      backgroundImage: {
        "aurora":
          "radial-gradient(1200px 600px at 10% -10%, rgba(99,102,241,0.25), transparent 60%), radial-gradient(900px 500px at 110% 10%, rgba(34,211,238,0.18), transparent 55%)",
        "brand-grad": "linear-gradient(135deg,#6366f1 0%,#4338ca 50%,#22d3ee 140%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: 0, transform: "translateY(8px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(99,102,241,0.55)" },
          "100%": { boxShadow: "0 0 0 22px rgba(99,102,241,0)" },
        },
      },
      animation: {
        "fade-up": "fade-up .5s ease both",
        "pulse-ring": "pulse-ring 1.6s ease-out infinite",
      },
    },
  },
  plugins: [],
};
