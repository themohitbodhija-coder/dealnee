module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0066cc",
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
  ],
}
