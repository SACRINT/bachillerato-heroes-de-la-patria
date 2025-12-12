import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        outDir: 'public/dist',
        rollupOptions: {
            input: {
                main: 'src/main.ts',
            },
            output: {
                entryFileNames: 'assets/[name].js',
                chunkFileNames: 'assets/[name].js',
                assetFileNames: 'assets/[name].[ext]'
            }
        }

    },
    server: {
        port: 3000,
        open: true
    }
});
