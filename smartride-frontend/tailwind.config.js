/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brandBlue: "#007AFF",   // Uber-like blue
        brandGreen: "#00C48C",  // BlaBlaCar-like green
      },
    },
  },
  plugins: [],
};
