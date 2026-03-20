// tailwind.config.ts
const plugin = require('tailwindcss/plugin')

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {},
    },
    plugins: [
        plugin(function ({ addUtilities }) {
            addUtilities({
                '.perspective-1000': {
                    'perspective': '1000px',
                },
                '.preserve-3d': {
                    'transform-style': 'preserve-3d',
                },
                '.backface-hidden': {
                    'backface-visibility': 'hidden',
                    '-webkit-backface-visibility': 'hidden',
                },
                '.rotate-y-180': {
                    'transform': 'rotateY(180deg)',
                },
            })
        }),
    ],
}