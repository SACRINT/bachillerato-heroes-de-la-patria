/**
 * 🤖 PREDICTIVE ANALYTICS SERVICE - v1.0.0
 * Servicio de análisis predictivo y ML para BGE
 *
 * SEMANA 21-22 - Plan 24 Semanas
 * Fecha: 19 Noviembre 2025
 *
 * Features:
 * - Predicción de riesgo académico
 * - Análisis de tendencias
 * - Recomendaciones personalizadas
 * - Detección de anomalías
 * - Forecasting de métricas
 */

const { pool } = require('../config/database');
const devLogger = require('../utils/devLogger');

/**
 * Clase de error personalizada
 */
class ServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'ServiceError';
    this.statusCode = statusCode;
  }
}

class PredictiveAnalyticsService {
  /**
   * Predecir riesgo académico de estudiantes
   * @param {Object} options - Opciones de predicción
   * @returns {Promise<Object>} Predicciones de riesgo
   */
  async predictAcademicRisk(options = {}) {
    const { threshold = 7.0, includeFactors = true } = options;

    devLogger.log('[PredictiveAnalytics] Calculando riesgo académico');

    try {
      // Obtener estudiantes con sus métricas
      const studentsQuery = `
        SELECT
          e.id,
          e.matricula,
          e.nombre,
          e.apellido_paterno,
          e.semestre,
          e.promedio,
          e.status_academico,
          COUNT(DISTINCT c.id) as total_calificaciones,
          AVG(c.calificacion) as promedio_calculado,
          COUNT(CASE WHEN c.calificacion < 6 THEN 1 END) as materias_reprobadas,
          COUNT(DISTINCT a.id) as total_asistencias,
          SUM(CASE WHEN a.status = 'presente' THEN 1 ELSE 0 END) as asistencias_presentes
        FROM estudiantes e
        LEFT JOIN calificaciones c ON e.id = c.estudiante_id
        LEFT JOIN asistencia a ON e.id = a.estudiante_id
        WHERE e.status_academico = 'activo'
        GROUP BY e.id
      `;

      const result = await pool.query(studentsQuery);
      const predictions = [];

      for (const student of result.rows) {
        const riskScore = this._calculateRiskScore(student);
        const riskLevel = this._getRiskLevel(riskScore);
        const factors = includeFactors ? this._getRiskFactors(student) : [];

        if (riskScore >= (100 - threshold * 10)) {
          predictions.push({
            estudiante: {
              id: student.id,
              matricula: student.matricula,
              nombre: `${student.nombre} ${student.apellido_paterno}`,
              semestre: student.semestre
            },
            riesgo: {
              score: riskScore,
              nivel: riskLevel,
              probabilidadDesercion: (riskScore / 100).toFixed(2)
            },
            factores: factors,
            recomendaciones: this._getRecommendations(factors)
          });
        }
      }

      // Ordenar por score de riesgo descendente
      predictions.sort((a, b) => b.riesgo.score - a.riesgo.score);

      return {
        success: true,
        data: {
          predicciones: predictions,
          resumen: {
            total: predictions.length,
            altoRiesgo: predictions.filter(p => p.riesgo.nivel === 'alto').length,
            medioRiesgo: predictions.filter(p => p.riesgo.nivel === 'medio').length,
            bajoRiesgo: predictions.filter(p => p.riesgo.nivel === 'bajo').length
          }
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      devLogger.error('[PredictiveAnalytics] Error en predicción:', error.message);
      throw new ServiceError('Error al calcular predicciones de riesgo', 500);
    }
  }

  /**
   * Analizar tendencias académicas
   * @param {Object} options - Opciones de análisis
   * @returns {Promise<Object>} Análisis de tendencias
   */
  async analyzeTrends(options = {}) {
    const { periodo = 6, granularidad = 'mes' } = options;

    devLogger.log('[PredictiveAnalytics] Analizando tendencias');

    try {
      // Tendencia de promedios
      const promediosQuery = `
        SELECT
          DATE_TRUNC($1, c.fecha_registro) as periodo,
          AVG(c.calificacion) as promedio,
          COUNT(*) as total_calificaciones
        FROM calificaciones c
        WHERE c.fecha_registro >= NOW() - INTERVAL '${periodo} months'
        GROUP BY DATE_TRUNC($1, c.fecha_registro)
        ORDER BY periodo
      `;

      const promedios = await pool.query(promediosQuery, [granularidad]);

      // Tendencia de asistencia
      const asistenciaQuery = `
        SELECT
          DATE_TRUNC($1, a.fecha) as periodo,
          COUNT(*) as total,
          SUM(CASE WHEN a.status = 'presente' THEN 1 ELSE 0 END) as presentes,
          ROUND(SUM(CASE WHEN a.status = 'presente' THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 2) as porcentaje
        FROM asistencia a
        WHERE a.fecha >= NOW() - INTERVAL '${periodo} months'
        GROUP BY DATE_TRUNC($1, a.fecha)
        ORDER BY periodo
      `;

      const asistencia = await pool.query(asistenciaQuery, [granularidad]);

      // Calcular proyección
      const proyeccion = this._calculateProjection(promedios.rows);

      return {
        success: true,
        data: {
          promedios: promedios.rows.map(r => ({
            periodo: r.periodo,
            promedio: parseFloat(r.promedio || 0).toFixed(2),
            totalCalificaciones: parseInt(r.total_calificaciones)
          })),
          asistencia: asistencia.rows.map(r => ({
            periodo: r.periodo,
            total: parseInt(r.total),
            presentes: parseInt(r.presentes),
            porcentaje: parseFloat(r.porcentaje || 0)
          })),
          proyeccion,
          insights: this._generateInsights(promedios.rows, asistencia.rows)
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      devLogger.error('[PredictiveAnalytics] Error en tendencias:', error.message);
      throw new ServiceError('Error al analizar tendencias', 500);
    }
  }

  /**
   * Generar recomendaciones personalizadas
   * @param {number} estudianteId - ID del estudiante
   * @returns {Promise<Object>} Recomendaciones
   */
  async getPersonalizedRecommendations(estudianteId) {
    devLogger.log(`[PredictiveAnalytics] Generando recomendaciones para estudiante ${estudianteId}`);

    try {
      // Obtener datos del estudiante
      const studentQuery = `
        SELECT
          e.*,
          AVG(c.calificacion) as promedio_actual,
          COUNT(CASE WHEN c.calificacion < 6 THEN 1 END) as materias_bajas
        FROM estudiantes e
        LEFT JOIN calificaciones c ON e.id = c.estudiante_id
        WHERE e.id = $1
        GROUP BY e.id
      `;

      const studentResult = await pool.query(studentQuery, [estudianteId]);

      if (studentResult.rows.length === 0) {
        throw new ServiceError('Estudiante no encontrado', 404);
      }

      const student = studentResult.rows[0];

      // Obtener materias con bajo rendimiento
      const weakSubjectsQuery = `
        SELECT
          m.nombre as materia,
          AVG(c.calificacion) as promedio
        FROM calificaciones c
        JOIN materias m ON c.materia_id = m.id
        WHERE c.estudiante_id = $1
        GROUP BY m.id, m.nombre
        HAVING AVG(c.calificacion) < 7
        ORDER BY promedio ASC
        LIMIT 5
      `;

      const weakSubjects = await pool.query(weakSubjectsQuery, [estudianteId]);

      // Generar recomendaciones
      const recommendations = [];

      // Recomendaciones académicas
      if (parseFloat(student.promedio_actual) < 7) {
        recommendations.push({
          tipo: 'academica',
          prioridad: 'alta',
          titulo: 'Mejora tu promedio general',
          descripcion: 'Tu promedio está por debajo del mínimo requerido. Considera sesiones de estudio adicionales.',
          acciones: [
            'Asistir a asesorías académicas',
            'Formar grupos de estudio',
            'Revisar material de apoyo en biblioteca digital'
          ]
        });
      }

      // Recomendaciones por materias débiles
      for (const subject of weakSubjects.rows) {
        recommendations.push({
          tipo: 'materia',
          prioridad: parseFloat(subject.promedio) < 6 ? 'alta' : 'media',
          titulo: `Refuerzo en ${subject.materia}`,
          descripcion: `Tu promedio en ${subject.materia} es ${parseFloat(subject.promedio).toFixed(1)}`,
          acciones: [
            `Agendar asesoría de ${subject.materia}`,
            'Revisar ejercicios prácticos',
            'Consultar videos educativos'
          ]
        });
      }

      // Recomendación de bienestar
      recommendations.push({
        tipo: 'bienestar',
        prioridad: 'media',
        titulo: 'Mantén un balance saludable',
        descripcion: 'El éxito académico requiere bienestar físico y mental',
        acciones: [
          'Dormir 7-8 horas diarias',
          'Hacer ejercicio regularmente',
          'Participar en actividades extracurriculares'
        ]
      });

      return {
        success: true,
        data: {
          estudiante: {
            id: student.id,
            nombre: `${student.nombre} ${student.apellido_paterno}`,
            promedioActual: parseFloat(student.promedio_actual || 0).toFixed(2)
          },
          materiasDebiles: weakSubjects.rows.map(s => ({
            materia: s.materia,
            promedio: parseFloat(s.promedio).toFixed(2)
          })),
          recomendaciones: recommendations,
          metasSugeridas: this._generateGoals(student)
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      devLogger.error('[PredictiveAnalytics] Error en recomendaciones:', error.message);
      throw new ServiceError('Error al generar recomendaciones', 500);
    }
  }

  /**
   * Detectar anomalías en datos
   * @param {string} tipo - Tipo de anomalía a detectar
   * @returns {Promise<Object>} Anomalías detectadas
   */
  async detectAnomalies(tipo = 'all') {
    devLogger.log(`[PredictiveAnalytics] Detectando anomalías: ${tipo}`);

    try {
      const anomalies = [];

      // Anomalías en calificaciones
      if (tipo === 'all' || tipo === 'calificaciones') {
        const gradeAnomalies = await pool.query(`
          SELECT
            e.id,
            e.matricula,
            e.nombre,
            c.calificacion,
            c.materia_id,
            m.nombre as materia,
            c.fecha_registro
          FROM calificaciones c
          JOIN estudiantes e ON c.estudiante_id = e.id
          JOIN materias m ON c.materia_id = m.id
          WHERE c.calificacion = 10 OR c.calificacion < 3
          ORDER BY c.fecha_registro DESC
          LIMIT 20
        `);

        for (const row of gradeAnomalies.rows) {
          anomalies.push({
            tipo: 'calificacion_extrema',
            severidad: row.calificacion < 3 ? 'alta' : 'baja',
            descripcion: row.calificacion < 3
              ? `Calificación muy baja (${row.calificacion}) en ${row.materia}`
              : `Calificación perfecta (10) en ${row.materia}`,
            estudiante: {
              id: row.id,
              matricula: row.matricula,
              nombre: row.nombre
            },
            fecha: row.fecha_registro
          });
        }
      }

      // Anomalías en asistencia
      if (tipo === 'all' || tipo === 'asistencia') {
        const attendanceAnomalies = await pool.query(`
          SELECT
            e.id,
            e.matricula,
            e.nombre,
            COUNT(*) as faltas_consecutivas
          FROM asistencia a
          JOIN estudiantes e ON a.estudiante_id = e.id
          WHERE a.status = 'falta'
            AND a.fecha >= NOW() - INTERVAL '7 days'
          GROUP BY e.id
          HAVING COUNT(*) >= 3
          ORDER BY faltas_consecutivas DESC
        `);

        for (const row of attendanceAnomalies.rows) {
          anomalies.push({
            tipo: 'faltas_consecutivas',
            severidad: row.faltas_consecutivas >= 5 ? 'alta' : 'media',
            descripcion: `${row.faltas_consecutivas} faltas en los últimos 7 días`,
            estudiante: {
              id: row.id,
              matricula: row.matricula,
              nombre: row.nombre
            }
          });
        }
      }

      return {
        success: true,
        data: {
          anomalias: anomalies,
          resumen: {
            total: anomalies.length,
            alta: anomalies.filter(a => a.severidad === 'alta').length,
            media: anomalies.filter(a => a.severidad === 'media').length,
            baja: anomalies.filter(a => a.severidad === 'baja').length
          }
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      devLogger.error('[PredictiveAnalytics] Error en detección:', error.message);
      throw new ServiceError('Error al detectar anomalías', 500);
    }
  }

  /**
   * Forecast de métricas
   * @param {string} metrica - Métrica a proyectar
   * @param {number} periodos - Número de periodos a proyectar
   * @returns {Promise<Object>} Proyección
   */
  async forecast(metrica = 'promedio', periodos = 3) {
    devLogger.log(`[PredictiveAnalytics] Forecasting ${metrica} para ${periodos} periodos`);

    try {
      let query;
      let data;

      switch (metrica) {
        case 'promedio':
          query = `
            SELECT
              DATE_TRUNC('month', fecha_registro) as periodo,
              AVG(calificacion) as valor
            FROM calificaciones
            WHERE fecha_registro >= NOW() - INTERVAL '12 months'
            GROUP BY DATE_TRUNC('month', fecha_registro)
            ORDER BY periodo
          `;
          break;
        case 'inscripciones':
          query = `
            SELECT
              DATE_TRUNC('month', created_at) as periodo,
              COUNT(*) as valor
            FROM estudiantes
            WHERE created_at >= NOW() - INTERVAL '12 months'
            GROUP BY DATE_TRUNC('month', created_at)
            ORDER BY periodo
          `;
          break;
        default:
          throw new ServiceError('Métrica no soportada', 400);
      }

      const result = await pool.query(query);
      data = result.rows;

      // Calcular proyección usando regresión lineal simple
      const forecast = this._linearRegression(data, periodos);

      return {
        success: true,
        data: {
          metrica,
          historico: data.map(d => ({
            periodo: d.periodo,
            valor: parseFloat(d.valor).toFixed(2)
          })),
          proyeccion: forecast,
          confianza: this._calculateConfidence(data)
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      devLogger.error('[PredictiveAnalytics] Error en forecast:', error.message);
      throw new ServiceError('Error al generar forecast', 500);
    }
  }

  // ==================== MÉTODOS PRIVADOS ====================

  /**
   * Calcular score de riesgo
   * @private
   */
  _calculateRiskScore(student) {
    let score = 0;

    // Factor: Promedio bajo (40% del score)
    const promedio = parseFloat(student.promedio || student.promedio_calculado || 0);
    if (promedio < 6) score += 40;
    else if (promedio < 7) score += 25;
    else if (promedio < 8) score += 10;

    // Factor: Materias reprobadas (30% del score)
    const reprobadas = parseInt(student.materias_reprobadas || 0);
    if (reprobadas >= 3) score += 30;
    else if (reprobadas >= 2) score += 20;
    else if (reprobadas >= 1) score += 10;

    // Factor: Asistencia baja (30% del score)
    const presentes = parseInt(student.asistencias_presentes || 0);
    const total = parseInt(student.total_asistencias || 1);
    const porcentajeAsistencia = (presentes / total) * 100;
    if (porcentajeAsistencia < 70) score += 30;
    else if (porcentajeAsistencia < 80) score += 20;
    else if (porcentajeAsistencia < 90) score += 10;

    return Math.min(score, 100);
  }

  /**
   * Obtener nivel de riesgo
   * @private
   */
  _getRiskLevel(score) {
    if (score >= 70) return 'alto';
    if (score >= 40) return 'medio';
    return 'bajo';
  }

  /**
   * Obtener factores de riesgo
   * @private
   */
  _getRiskFactors(student) {
    const factors = [];
    const promedio = parseFloat(student.promedio || student.promedio_calculado || 0);
    const reprobadas = parseInt(student.materias_reprobadas || 0);
    const presentes = parseInt(student.asistencias_presentes || 0);
    const total = parseInt(student.total_asistencias || 1);

    if (promedio < 7) {
      factors.push({
        factor: 'Promedio bajo',
        valor: promedio.toFixed(2),
        impacto: 'alto'
      });
    }

    if (reprobadas > 0) {
      factors.push({
        factor: 'Materias reprobadas',
        valor: reprobadas,
        impacto: reprobadas >= 2 ? 'alto' : 'medio'
      });
    }

    const porcentaje = (presentes / total) * 100;
    if (porcentaje < 80) {
      factors.push({
        factor: 'Asistencia baja',
        valor: `${porcentaje.toFixed(1)}%`,
        impacto: porcentaje < 70 ? 'alto' : 'medio'
      });
    }

    return factors;
  }

  /**
   * Obtener recomendaciones basadas en factores
   * @private
   */
  _getRecommendations(factors) {
    const recommendations = [];

    for (const factor of factors) {
      switch (factor.factor) {
        case 'Promedio bajo':
          recommendations.push('Agendar tutorías académicas');
          recommendations.push('Revisar técnicas de estudio');
          break;
        case 'Materias reprobadas':
          recommendations.push('Inscribir en curso de regularización');
          recommendations.push('Asignar tutor par');
          break;
        case 'Asistencia baja':
          recommendations.push('Contactar a padre/tutor');
          recommendations.push('Evaluar situación personal');
          break;
      }
    }

    return [...new Set(recommendations)]; // Eliminar duplicados
  }

  /**
   * Calcular proyección
   * @private
   */
  _calculateProjection(data) {
    if (data.length < 2) return null;

    const values = data.map(d => parseFloat(d.promedio || 0));
    const trend = (values[values.length - 1] - values[0]) / values.length;

    return {
      tendencia: trend > 0 ? 'ascendente' : trend < 0 ? 'descendente' : 'estable',
      cambioEstimado: trend.toFixed(2),
      proximoValor: (values[values.length - 1] + trend).toFixed(2)
    };
  }

  /**
   * Generar insights
   * @private
   */
  _generateInsights(promedios, asistencia) {
    const insights = [];

    // Insight de promedios
    if (promedios.length >= 2) {
      const first = parseFloat(promedios[0]?.promedio || 0);
      const last = parseFloat(promedios[promedios.length - 1]?.promedio || 0);
      const change = ((last - first) / first * 100).toFixed(1);

      insights.push({
        tipo: 'promedio',
        mensaje: change > 0
          ? `El promedio general ha mejorado ${change}% en el periodo`
          : `El promedio general ha disminuido ${Math.abs(change)}% en el periodo`
      });
    }

    // Insight de asistencia
    if (asistencia.length >= 2) {
      const avgAttendance = asistencia.reduce((acc, a) => acc + parseFloat(a.porcentaje || 0), 0) / asistencia.length;
      insights.push({
        tipo: 'asistencia',
        mensaje: avgAttendance >= 90
          ? `Excelente asistencia promedio: ${avgAttendance.toFixed(1)}%`
          : `La asistencia promedio de ${avgAttendance.toFixed(1)}% necesita atención`
      });
    }

    return insights;
  }

  /**
   * Generar metas sugeridas
   * @private
   */
  _generateGoals(student) {
    const goals = [];
    const promedio = parseFloat(student.promedio_actual || 0);

    if (promedio < 7) {
      goals.push({
        meta: 'Alcanzar promedio de 7.0',
        plazo: '1 mes',
        indicador: 'Promedio mensual'
      });
    }

    if (promedio >= 7 && promedio < 8.5) {
      goals.push({
        meta: 'Mejorar promedio a 8.5',
        plazo: '2 meses',
        indicador: 'Promedio bimestral'
      });
    }

    goals.push({
      meta: 'Mantener asistencia >95%',
      plazo: 'Continuo',
      indicador: 'Asistencia semanal'
    });

    return goals;
  }

  /**
   * Regresión lineal simple para forecast
   * @private
   */
  _linearRegression(data, periodos) {
    if (data.length < 2) return [];

    const n = data.length;
    const values = data.map(d => parseFloat(d.valor));

    // Calcular pendiente y ordenada al origen
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generar proyecciones
    const projections = [];
    const lastDate = new Date(data[n - 1].periodo);

    for (let i = 1; i <= periodos; i++) {
      const nextDate = new Date(lastDate);
      nextDate.setMonth(nextDate.getMonth() + i);

      projections.push({
        periodo: nextDate.toISOString(),
        valor: (intercept + slope * (n + i - 1)).toFixed(2)
      });
    }

    return projections;
  }

  /**
   * Calcular confianza de la proyección
   * @private
   */
  _calculateConfidence(data) {
    if (data.length < 3) return 0.5;

    const values = data.map(d => parseFloat(d.valor));
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / mean; // Coeficiente de variación

    // Menor variación = mayor confianza
    return Math.max(0.3, Math.min(0.95, 1 - cv)).toFixed(2);
  }
}

module.exports = new PredictiveAnalyticsService();
module.exports.ServiceError = ServiceError;
