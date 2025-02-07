import { nextui } from "@nextui-org/theme";

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        charyo: {
          50: "#e6e6e6",
          100: "#cccccc",
          200: "#999999",
          300: "#666666",
          400: "#333333",
          500: "#1f1f1f",
          600: "#1a1a1a",
          700: "#141414",
          800: "#0d0d0d",
          900: "#070707",
        },
        ualert: {
          50: "#fff0fd",
          100: "#ffe0fb",
          200: "#ffc0f7",
          300: "#ffa0f3",
          400: "#ff80ef",
          500: "#ff00c7",
          600: "#cc00a0",
          700: "#990078",
          800: "#660050",
          900: "#330028",
        },
        notpurple: {
          50: "#fefeff",
          100: "#fcfbfe",
          200: "#faf9fd",
          300: "#f7f6fc",
          400: "#f5f4fc",
          500: "#f9f8fc",
          600: "#c7c6ca",
          700: "#959597",
          800: "#636365",
          900: "#323232",
        },
      },
      keyframes: {
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-5px)" },
          "75%": { transform: "translateX(5px)" },
        },
      },
      animation: {
        shake: "shake 0.2s ease-in-out 0s 2",
      },
    },
  },
  darkMode: "class",
  plugins: [
    nextui({
      addCommonColors: true,
      themes: {
        light: {
          colors: {
            background: "#FFFFFF",
            foreground: "#11181C",
            primary: {
              DEFAULT: "#134E4A",
              foreground: "#FFFFFF",
            },
            content1: {
              DEFAULT: "#FFFFFF",
              foreground: "#11181C",
            },
            content2: {
              DEFAULT: "#F8F9FA",
              foreground: "#11181C",
            },
            content3: {
              DEFAULT: "#F1F3F5",
              foreground: "#11181C",
            },
            content4: {
              DEFAULT: "#ECEEF0",
              foreground: "#11181C",
            },
            divider: {
              DEFAULT: "rgba(17, 24, 28, 0.08)",
            },
            focus: {
              DEFAULT: "#134E4A",
            },
            border: {
              DEFAULT: "rgba(17, 24, 28, 0.1)",
            },
            success: {
              DEFAULT: "#00FF84",
              foreground: "#11181C",
            },
            danger: {
              DEFAULT: "#DC2626",
              foreground: "#FFFFFF",
            },
          },
          layout: {
            radius: {
              small: "6px",
              medium: "8px",
              large: "12px",
            },
            borderWidth: {
              small: "1px",
              medium: "2px",
              large: "3px",
            },
          },
        },
        dark: {
          colors: {
            background: "#000000",
            foreground: "#ECEDEE",
            primary: {
              DEFAULT: "#0D9488",
              foreground: "#FFFFFF",
            },
            content1: {
              DEFAULT: "#1A1A1A",
              foreground: "#ECEDEE",
            },
            content2: {
              DEFAULT: "#252525",
              foreground: "#ECEDEE",
            },
            content3: {
              DEFAULT: "#313131",
              foreground: "#ECEDEE",
            },
            content4: {
              DEFAULT: "#3D3D3D",
              foreground: "#ECEDEE",
            },
            divider: {
              DEFAULT: "rgba(236, 237, 238, 0.08)",
            },
            focus: {
              DEFAULT: "#0D9488",
            },
            border: {
              DEFAULT: "rgba(236, 237, 238, 0.1)",
            },
            success: {
              DEFAULT: "#00FF84",
              foreground: "#000000",
            },
            danger: {
              DEFAULT: "#DC2626",
              foreground: "#FFFFFF",
            },
          },
          layout: {
            radius: {
              small: "6px",
              medium: "8px",
              large: "12px",
            },
            borderWidth: {
              small: "1px",
              medium: "2px",
              large: "3px",
            },
          },
        },
      },
    }),
  ],
};
