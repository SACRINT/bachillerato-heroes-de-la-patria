import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@metaverse': path.resolve(__dirname, './src/metaverse')
        }
    },
    build: {
        outDir: 'public/dist',
        rollupOptions: {
            input: {
                // Mantener punto de entrada existente si existe
                main: 'src/main.ts',
                // Nuevo punto de entrada para el Metaverso
                metaverse: 'metaverse.html'
            },
            output: {
                entryFileNames: 'assets/[name].js',
                chunkFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name].[ext]'
            }
        }
    },
    server: {
        port: 3000,
        // Proxy para redirigir llamadas API al backend Express (asumiendo puerto 5000 o configurable)
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true
            }
        }
    }
});
