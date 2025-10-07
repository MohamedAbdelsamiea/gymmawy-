/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xlg': '1525px', // Custom breakpoint for header responsiveness
      },
      colors: {
        'gymmawy': {
          'primary': '#3F0071',
          'secondary': '#8B5CF6',
          'accent': '#FF6B35',
          'dark': '#1F1F1F',
          'light': '#F8F9FA',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'arabic': ['Alexandria', 'Noto Sans Arabic', 'system-ui', 'sans-serif'],
        'inter': ['Inter', 'system-ui', 'sans-serif'],
        'alexandria': ['Alexandria', 'Noto Sans Arabic', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
}
