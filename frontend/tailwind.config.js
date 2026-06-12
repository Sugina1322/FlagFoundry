export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"Fira Code"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        sans: ['"Fira Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        void: '#050607',
        panel: '#0c1412',
        panel2: '#111b18',
        line: '#244039',
        matrix: '#00ff41',
        acid: '#b7ff5a',
        aqua: '#38e8ff',
        amber: '#ffcf5a',
        orchid: '#c084fc',
        danger: '#ff3333',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(0,255,65,.22), 0 18px 60px rgba(0,0,0,.28), 0 0 30px rgba(0,255,65,.08)',
        soft: '0 18px 70px rgba(0,0,0,.34)',
      },
    },
  },
  plugins: [],
};
