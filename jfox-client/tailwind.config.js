/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-dark': '#121212', // A very dark gray, almost black
        'brand-light': '#1e1e1e', // A slightly lighter gray for cards/inputs
        'brand-orange': '#ff6600',
        'brand-orange-hover': '#e65c00',
        'brand-text': '#f0f0f0', // A soft white
        'brand-subtext': '#a0a0a0', // A gray for less important text
      },
    },
  },
  plugins: [],
}