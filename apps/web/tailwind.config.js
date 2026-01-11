/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050508",
        foreground: "#f8fafc",
        panel: "#0a0a0f",
        primary: {
          DEFAULT: "#00f2ff",
          glow: "rgba(0, 242, 255, 0.5)",
        },
        secondary: {
          DEFAULT: "#7000ff",
          glow: "rgba(112, 0, 255, 0.5)",
        },
        accent: {
          DEFAULT: "#ff00e5",
          glow: "rgba(255, 0, 229, 0.5)",
        },
        border: "rgba(255, 255, 255, 0.08)",
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-line': 'glow-line 3s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        'glow-line': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'scanline': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        }
      },
      backgroundImage: {
        'cyber-grid': 'linear-gradient(to right, rgba(0, 242, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 242, 255, 0.05) 1px, transparent 1px)',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
