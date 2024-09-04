import { nextui } from '@nextui-org/theme'

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
          50: '#e6e6e6',
          100: '#cccccc',
          200: '#999999',
          300: '#666666',
          400: '#333333',
          500: '#1f1f1f',
          600: '#1a1a1a',
          700: '#141414',
          800: '#0d0d0d',
          900: '#070707',
        },
        ualert: {
          50: '#fff0fd',
          100: '#ffe0fb',
          200: '#ffc0f7',
          300: '#ffa0f3',
          400: '#ff80ef',
          500: '#ff00c7',
          600: '#cc00a0',
          700: '#990078',
          800: '#660050',
          900: '#330028',
        },
        notpurple: {
          50: '#fefeff',
          100: '#fcfbfe',
          200: '#faf9fd',
          300: '#f7f6fc',
          400: '#f5f4fc',
          500: '#f9f8fc',
          600: '#c7c6ca',
          700: '#959597',
          800: '#636365',
          900: '#323232',
        },
        gruel: {
          500: '#475C69',
        },
        ugh: {
          500: '#475C69',
          600: '#00FF84',
        }
      }
    },
  },
  darkMode: "class",
  plugins: [nextui({
    themes: {
      light: {
        colors: {
          primary: {
            DEFAULT: "#ff00c7",
            50: '#fff0fd',
            100: '#ffe0fb',
            200: '#ffc0f7',
            300: '#ffa0f3',
            400: '#ff80ef',
            500: '#ff00c7',
            600: '#cc00a0',
            700: '#990078',
            800: '#660050',
            900: '#330028',
          },
          ualert: {
            DEFAULT: "#ff00c7",
            50: '#fff0fd',
            100: '#ffe0fb',
            200: '#ffc0f7',
            300: '#ffa0f3',
            400: '#ff80ef',
            500: '#ff00c7',
            600: '#cc00a0',
            700: '#990078',
            800: '#660050',
            900: '#330028',
          },
          charyo: {
            DEFAULT: "#1f1f1f",
            50: '#e6e6e6',
            100: '#cccccc',
            200: '#999999',
            300: '#666666',
            400: '#333333',
            500: '#1f1f1f',
            600: '#1a1a1a',
            700: '#141414',
            800: '#0d0d0d',
            900: '#070707',
          },
          notpurple: {
            DEFAULT: "#f9f8fc",
            50: '#fefeff',
            100: '#fcfbfe',
            200: '#faf9fd',
            300: '#f7f6fc',
            400: '#f5f4fc',
            500: '#f9f8fc',
            600: '#c7c6ca',
            700: '#959597',
            800: '#636365',
            900: '#323232',
          },
          success: {
            DEFAULT: "#00FF84",
          },
          danger: {
            DEFAULT: "#ff00c7",
          },
        }
      }
    }
  })],
}
