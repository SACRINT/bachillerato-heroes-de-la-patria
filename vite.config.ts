import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        outDir: 'public/dist',
        rollupOptions: {
            input: {
                main: 'src/main.ts',
                // admin: 'src/admin.ts', // To be enabled later
            }
        }
    },
    server: {
        port: 3000,
        open: true
    }
});
