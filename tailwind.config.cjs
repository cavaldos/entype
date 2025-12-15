module.exports = {
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            keyframes: {
                shake: {
                    '0%': { transform: 'translateX(0)' },
                    '25%': { transform: 'translateX(-3px)' },
                    '50%': { transform: 'translateX(3px)' },
                    '75%': { transform: 'translateX(-2px)' },
                    '100%': { transform: 'translateX(0)' },
                },
                'caret-blink': {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.3' },
                },
            },
            animation: {
                shake: 'shake 160ms ease-in-out',
                'caret-blink': 'caret-blink 1s ease-in-out infinite',
            },
        },
    },
    plugins: [],
}
