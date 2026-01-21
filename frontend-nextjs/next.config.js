/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: ['bge-heroesdelapatria.vercel.app', 'ui-avatars.com'],
        formats: ['image/webp', 'image/avif'],
    },
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
        NEXT_PUBLIC_APP_NAME: 'BGE Héroes de la Patria',
    },
    // Optimizations
    compress: true,
    poweredByHeader: false,

    // Redirects
    async redirects() {
        return [
            {
                source: '/home',
                destination: '/',
                permanent: true,
            },
        ];
    },
};

module.exports = nextConfig;
