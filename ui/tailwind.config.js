import colors from "tailwindcss/colors";

// Remove deprecated color aliases to silence Tailwind warnings
// eslint-disable-next-line no-unused-vars
const { lightBlue, warmGray, trueGray, coolGray, blueGray, ...safeColors } =
  colors;

/** @type {import('tailwindcss').Config} */
export default {
  content: [],
  theme: {
    extend: {
      fontFamily: {
        handwriting: ["Inter", "system-ui", "sans-serif"],
      },
    },
    colors: {
      primary: {
        light: "#ffffff",
        DEFAULT: "#000000",
        dark: "#000000",
      },
      ...safeColors,
    },
  },
  plugins: [],
};
