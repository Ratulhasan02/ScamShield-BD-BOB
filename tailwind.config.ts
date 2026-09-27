import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefcf5",
          100: "#d5f6e6",
          200: "#aeecce",
          300: "#78dcae",
          400: "#3fc389",
          500: "#1aa76e",
          600: "#0f8a5b",
          700: "#0d6e4b",
          800: "#0d573e",
          900: "#0c4834",
        },
        danger: {
          50: "#fef2f2",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
        },
        warn: {
          50: "#fffbeb",
          500: "#f59e0b",
          600: "#d97706",
        },
        ink: {
          900: "#0a0f14",
          800: "#0f1720",
          700: "#16212c",
          600: "#1e2c39",
        },
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans Bengali", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(26,167,110,0.35)",
      },
      keyframes: {
        scan: { "0%": { transform: "translateY(-100%)" }, "100%": { transform: "translateY(100%)" } },
        pulseSoft: { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.5" } },
      },
      animation: {
        scan: "scan 2s linear infinite",
        pulseSoft: "pulseSoft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
