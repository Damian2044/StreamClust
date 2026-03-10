/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    fontFamily: {
      sans: ['"Nunito Sans"', "system-ui", "sans-serif"],
      serif: ['"Nunito Sans"', "system-ui", "sans-serif"],
      mono: ['"Nunito Sans"', "system-ui", "sans-serif"],
    },
    extend: {},
  },
  plugins: [],
}
