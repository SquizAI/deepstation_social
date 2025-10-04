/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1a1a2e',
        secondary: '#16213e',
        linkedin: '#0A66C2',
        twitter: '#1DA1F2',
        instagram: '#E4405F',
        discord: '#5865F2',
      },
    },
  },
  plugins: [],
}
