// api/index.cjs
// Este archivo es el punto de entrada para el entorno serverless de Vercel.
// Carga la aplicación consolidada de la API desde api/app.js (que usa ES Modules).

require('dotenv').config(); // Cargar variables de entorno al inicio

// Exportar una función asíncrona que cargará dinámicamente api/app.js
// y luego ejecutará su handler.
module.exports = async (req, res) => {
    try {
        // Importar dinámicamente api/app.js (que es un módulo ES)
        // y obtener su exportación por defecto (el handler).
        const { default: handler } = await import('./app.js');
        // Ejecutar el handler importado
        return handler(req, res);
    } catch (error) {
        console.error('Error al cargar o ejecutar api/app.js:', error);
        // Asegurarse de que la respuesta se envíe incluso en caso de error
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: 'Error interno del servidor al iniciar la API.' });
        }
    }
};
