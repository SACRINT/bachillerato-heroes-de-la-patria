module.exports = (req, res) => {
  try {
    const analyticsData = {
      students: {
        total_estudiantes: 1247,
        estudiantes_activos: 1180,
        egresados: 67,
        suspendidos: 0,
        especialidades_activas: 3,
      },
      teachers: {
        total_docentes: 68,
        docentes_base: 45,
        docentes_contrato: 18,
        docentes_honorarios: 5,
        promedio_experiencia: 8.5,
      },
      academic: {
        materias_activas: 42,
        cursos_disponibles: 18,
        inscripciones_totales: 8546,
        promedio_general: 8.4,
      },
      chatbot: {
        total_mensajes: 3245,
        conversaciones_unicas: 876,
        satisfaccion_promedio: 4.3,
        mensajes_semana: 245,
      },
    };

    res.status(200).json({
      success: true,
      message: "Datos de analíticas obtenidos correctamente.",
      data: analyticsData,
    });
  } catch (error) {
    console.error("Error en /api/analytics/dashboard:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor al obtener los datos de analíticas.",
      details: error.message,
    });
  }
};
