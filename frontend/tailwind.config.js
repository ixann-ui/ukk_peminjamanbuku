/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563eb",
          50: "#eff6ff",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        secondary: {
          500: "#f59e0b",
          600: "#d97706",
        },
        success: {
          500: "#10b981",
          600: "#059669",
        },
        danger: {
          500: "#ef4444",
          600: "#dc2626",
        },
        warning: {
          500: "#f59e0b",
          600: "#d97706",
        },
        dark: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
      },
      animation: {
        modalSlideIn: "modalSlideIn 0.3s ease-out forwards",
        fadeSlideIn: "fadeSlideIn 0.5s ease-out forwards",
        fadeOut: "fadeOut 0.3s ease-in-out forwards",
        notificationPulse: "notificationPulse 0.5s ease-in-out",
      },
      keyframes: {
        modalSlideIn: {
          "0%": { opacity: "0", transform: "scale(0.9) translateY(-20px)" },
          "50%": { opacity: "0.9", transform: "scale(1.02) translateY(5px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        fadeSlideIn: {
          "0%": { opacity: "0", transform: "translateY(-40px) scale(0.9)" },
          "30%": { opacity: "0.8", transform: "translateY(5px) scale(1.02)" },
          "60%": { opacity: "1", transform: "translateY(-5px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        fadeOut: {
          "0%": { opacity: "1", transform: "scale(1) translateY(0)" },
          "100%": { opacity: "0", transform: "scale(0.95) translateY(10px)" },
        },
        notificationPulse: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
