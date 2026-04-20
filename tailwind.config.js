/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#313439",
          yellow: "#F5C200",
          text: "#333333",
        },
      },
      fontFamily: {
        spoqa: ["'Spoqa Han Sans Neo'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
