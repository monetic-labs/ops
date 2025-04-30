import { heroui } from "@heroui/theme";

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
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
        warning: {
          DEFAULT: "#B45309",
          foreground: "#FFFFFF",
        },
      },
      keyframes: {
        slideLeft: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideRight: {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "slide-left": "slideLeft 0.3s ease-in-out",
        "slide-right": "slideRight 0.3s ease-in-out",
        "fade-in": "fadeIn 0.2s ease-in-out",
      },
      boxShadow: {
        hover: "0 4px 12px rgba(0, 0, 0, 0.08)",
        card: "0 2px 6px rgba(0, 0, 0, 0.04)",
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
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
            success: "#00FF84",
            warning: "#B45309",
            danger: "#DC2626",
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
              DEFAULT: "rgba(17, 24, 28, 0.12)",
            },
            focus: {
              DEFAULT: "#134E4A",
            },
            border: {
              DEFAULT: "rgba(17, 24, 28, 0.15)",
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
            primary: "#0D9488",
            success: "#00FF84",
            warning: "#92400E",
            danger: "#DC2626",
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
