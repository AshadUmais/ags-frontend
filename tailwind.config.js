/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#7662B4",      // deep purple
        secondary: "#8571BC",    // medium lavender
        accent: "#FBDE5E",       // bright yellow
        lightPurple: "#9889C7",  // soft lilac
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Oxygen",
               "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", "sans-serif"],
      },
    },
  },
  plugins: [],
};
