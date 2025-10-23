// api/index.cjs
// Este archivo es el punto de entrada para el entorno serverless de Vercel.
// Es un wrapper CommonJS que carga dinámicamente api/app.js (ES Module).

module.exports = async (req, res) => {
  try {
    // Importar dinámicamente api/app.js (que es un ES Module)
    const { default: handler } = await import('./app.js');
    // Ejecutar el handler de api/app.js
    return handler(req, res);
  } catch (error) {
    console.error('Error al cargar o ejecutar api/app.js:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor al cargar la API.' });
  }
};
