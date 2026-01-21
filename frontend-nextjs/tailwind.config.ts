import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#e3f2fd',
                    100: '#bbdefb',
                    200: '#90caf9',
                    300: '#64b5f6',
                    400: '#42a5f5',
                    500: '#1976D2',
                    600: '#1565c0',
                    700: '#0d47a1',
                    800: '#0a3d8f',
                    900: '#08306b',
                },
                secondary: {
                    50: '#fce4ec',
                    100: '#f8bbd0',
                    200: '#f48fb1',
                    300: '#f06292',
                    400: '#ec407a',
                    500: '#e91e63',
                    600: '#d81b60',
                    700: '#c2185b',
                    800: '#ad1457',
                    900: '#880e4f',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-in-out',
                'slide-in': 'slideIn 0.3s ease-out',
                'bounce-slow': 'bounce 3s infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideIn: {
                    '0%': { transform: 'translateY(-10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
};

export default config;
