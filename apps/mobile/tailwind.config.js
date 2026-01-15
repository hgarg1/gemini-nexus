/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#00f2ff",
        secondary: "#7000ff",
        accent: "#f59e0b",
        background: "#050505",
        panel: "rgba(255, 255, 255, 0.05)",
      },
      fontFamily: {
        sans: ["System"],
        mono: ["System"],
      },
    },
  },
  plugins: [],
}
