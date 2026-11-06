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
          DEFAULT: "#172554", // Navy Blue
          light: "#1e3a8a",
          dark: "#0f172a",
        },
        secondary: {
          DEFAULT: "#2563EB", // Blue
          light: "#3b82f6",
          dark: "#1d4ed8",
        },
        background: "#F8FAFC",
        surface: "#FFFFFF",
        textMain: "#0F172A",
        textMuted: "#64748B",
        brandSuccess: "#16A34A",
        brandWarning: "#F59E0B",
        brandDanger: "#DC2626",
      },
    },
  },
  plugins: [],
};

