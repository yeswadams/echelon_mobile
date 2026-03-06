/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        rubik: ["Rubik-Regular", "sans-serif"],
        "rubik-light": ["Rubik-Light", "sans-serif"],
        "rubik-medium": ["Rubik-Medium", "sans-serif"],
        "rubik-semi-bold": ["Rubik-SemiBold", "sans-serif"],
        "rubik-bold": ["Rubik-Bold", "sans-serif"],
      },
      colors: {
        primary: {
          100: "#F4EFE1",
          200: "#E3D6AE",
          300: "#C9B581",
        },
        secondary: {
          100: "#FFF6D1",
          200: "#F6E79B",
          300: "#EBD467",
        },
        accent: {
          100: "#DCE8E7",
          200: "#7A9C9A",
          300: "#1F4442",
        },
        black: {
          DEFAULT: "#000000",
          100: "#0000001A",
          200: "#00000033",
          300: "#0000004D",
        },
        danger: "#F75555",
        success: "#4CAF50",
        warning: "#FFC107",
      },
    },
  },
  plugins: [],
};
