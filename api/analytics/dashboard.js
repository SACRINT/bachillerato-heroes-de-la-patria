module.exports = async (req, res) => {
  try {
    // Devolver un objeto estático para depuración
    const staticData = {
      success: true,
      message: 'Datos estáticos de analíticas (modo depuración).',
      data: {
        students: { total_estudiantes: 1 },
        teachers: { total_docentes: 1 },
        academic: { promedio_general: 10 },
        chatbot: { total_mensajes: 1 }
      }
    };
    res.status(200).json(staticData);
  } catch (error) {
    console.error('Error en /api/analytics/dashboard (modo depuración):', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor en modo depuración.',
      details: error.message
    });
  }
};
