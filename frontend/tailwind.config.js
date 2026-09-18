/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        brand: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          900: "#0c4a6e",
        },
        command: {
          bg: "#0b111e",
          card: "#121b2d",
          border: "#1e293b",
          hover: "#1a263e",
        },
        verified: {
          bg: "#064e3b",
          text: "#34d399",
          border: "#059669"
        },
        suspicious: {
          bg: "#7f1d1d",
          text: "#f87171",
          border: "#dc2626"
        },
        review: {
          bg: "#78350f",
          text: "#fbbf24",
          border: "#d97706"
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
