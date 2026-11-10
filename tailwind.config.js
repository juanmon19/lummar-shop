/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./views/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        ivory: '#FFF8F0',
        elegantBlack: '#1C1718',
        dustyRose: '#DFA6AF',
        nudePink: '#E9B8A9',
        pastelPink: '#FCE9E9',
        champagneGold: '#C99A3B',
        softGold: '#F5DCA4'
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif']
      }
    }
  },
  plugins: []
};
