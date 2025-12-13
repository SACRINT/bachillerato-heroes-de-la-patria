import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Importar la instacia de Express del backend local
// Esto asegura paridad 1:1 entre dev y prod.
const app = require('../backend/server.js');

// Exportar para Vercel Serverless Function
export default app;
