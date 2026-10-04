import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Token "ink", "cream", "magenta", "cobalt", "lime", "tangerine"
        ink: "#0F0E0C",
        cream: "#F4EEDF",
        cream2: "#E8E0C9",
        magenta: {
          DEFAULT: "#FF2E7E",
          50: "#FFE7F0",
          100: "#FFC9DD",
          200: "#FF9EC2",
          300: "#FF74A6",
          400: "#FF4989",
          500: "#FF2E7E",
          600: "#E5005C",
          700: "#B30049",
        },
        cobalt: {
          DEFAULT: "#1A45D8",
          50: "#E6ECFB",
          100: "#C4D2F6",
          200: "#94AEF0",
          300: "#6589EA",
          400: "#3665E3",
          500: "#1A45D8",
          600: "#1334A8",
          700: "#0D2478",
        },
        lime: {
          DEFAULT: "#C9F03A",
          50: "#F5FCE0",
          100: "#EAFAB8",
          200: "#DBF685",
          300: "#C9F03A",
          400: "#A8D90F",
          500: "#86B700",
          600: "#638500",
        },
        tangerine: {
          DEFAULT: "#FF8A1E",
          50: "#FFF1DC",
          100: "#FFDFAE",
          200: "#FFC676",
          300: "#FFAD3E",
          400: "#FF8A1E",
          500: "#E56A00",
          600: "#B25100",
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        body: ['"Inter"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        "brutal": "4px 4px 0 0 #0F0E0C",
        "brutal-magenta": "4px 4px 0 0 #FF2E7E",
        "brutal-cobalt": "4px 4px 0 0 #1A45D8",
        "brutal-lime": "4px 4px 0 0 #86B700",
        "brutal-tangerine": "4px 4px 0 0 #FF8A1E",
        "brutal-lg": "8px 8px 0 0 #0F0E0C",
        "brutal-xl": "12px 12px 0 0 #0F0E0C",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        stamp: {
          "0%": { opacity: "0", transform: "scale(1.6) rotate(-8deg)" },
          "70%": { opacity: "1", transform: "scale(0.96) rotate(2deg)" },
          "100%": { opacity: "1", transform: "scale(1) rotate(0)" },
        },
        sweep: {
          "0%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%, 80%": { transform: "translateX(-4px)" },
          "40%, 60%": { transform: "translateX(4px)" },
        },
      },
      animation: {
        rise: "rise 0.5s cubic-bezier(0.2, 0.7, 0.3, 1) both",
        stamp: "stamp 0.55s cubic-bezier(0.2, 0.8, 0.4, 1) both",
        sweep: "sweep 1.8s ease-in-out infinite",
        shake: "shake 0.4s ease-in-out",
      },
    },
  },
  plugins: [],
};

export default config;