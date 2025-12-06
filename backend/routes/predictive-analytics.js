/**
 * 📊 PREDICTIVE ANALYTICS ROUTES
 * SEMANA 20 - Predictive Analytics & Forecasting
 * ✅ FASE 3 DAL - Refactorizado para usar DAO
 *
 * REST API para análisis predictivo y forecasting con ARIMA y Prophet
 *
 * Endpoints:
 * - POST /api/predictive/grades/:studentId - Predicción de calificaciones
 * - POST /api/predictive/enrollments - Predicción de inscripciones
 * - POST /api/predictive/dropout - Predicción de deserción
 * - POST /api/predictive/custom/arima - ARIMA custom
 * - POST /api/predictive/custom/prophet - Prophet custom
 * - GET /api/predictive/trends/:metric - Análisis de tendencias
 *
 * Fecha: 17 Noviembre 2025
 * Estado: ✅ PRODUCTION-READY
 */

const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const rateLimit = require('express-rate-limit');

// Middleware
const { authenticateJWT } = require('../middleware/auth');
const { requireRole } = require('../middleware/authorization');

// ✅ FASE 3: Using DAO layer
const AnalyticsDAO = require('../data/analytics.dao');
const devLogger = require('../utils/devLogger');

// ===========================================================================
// RATE LIMITING
// ===========================================================================

const predictiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 30, // 30 requests por hora (más conservador por ser computacionalmente costoso)
  message: {
    error: 'rate_limit_exceeded',
    message: 'Has excedido el límite de predicciones por hora. Intenta más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// ===========================================================================
// HELPERS
// ===========================================================================

/**
 * Ejecuta script Python de predictive analytics
 * @param {object} payload - Datos para predicción
 * @returns {Promise<object>} Resultado de predicción
 */
async function executePythonPrediction(payload) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '../ml/predictive-analytics.py');
    const python = spawn('python3', [pythonScript]);

    let stdout = '';
    let stderr = '';

    // Enviar datos vía stdin
    python.stdin.write(JSON.stringify(payload));
    python.stdin.end();

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        console.error('[PREDICTIVE] Python script failed:', stderr);
        return reject(new Error(`Python script exited with code ${code}`));
      }

      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (parseError) {
        console.error('[PREDICTIVE] JSON parse error:', stdout);
        reject(new Error('Failed to parse Python output'));
      }
    });

    python.on('error', (error) => {
      console.error('[PREDICTIVE] Spawn error:', error);
      reject(error);
    });
  });
}

/**
 * Obtiene calificaciones históricas de un estudiante
 * @param {string} studentId - UUID del estudiante
 * @returns {Promise<Array>} Array de {date, grade}
 */
async function getHistoricalGrades(studentId) {
  try {
    // ✅ FASE 3: Using AnalyticsDAO
    return await AnalyticsDAO.getHistoricalGrades(studentId);
  } catch (error) {
    console.error('[PREDICTIVE] Error fetching grades:', error);
    return [];
  }
}

/**
 * Obtiene inscripciones históricas
 * @returns {Promise<Array>} Array de {date, count}
 */
async function getHistoricalEnrollments() {
  try {
    // ✅ FASE 3: Using AnalyticsDAO
    return await AnalyticsDAO.getHistoricalEnrollments();
  } catch (error) {
    console.error('[PREDICTIVE] Error fetching enrollments:', error);
    return [];
  }
}

/**
 * Obtiene deserciones históricas
 * @returns {Promise<Array>} Array de {date, dropout_count}
 */
async function getHistoricalDropout() {
  try {
    // ✅ FASE 3: Using AnalyticsDAO
    return await AnalyticsDAO.getHistoricalDropout();
  } catch (error) {
    console.error('[PREDICTIVE] Error fetching dropout:', error);
    return [];
  }
}

// ===========================================================================
// ROUTES
// ===========================================================================

/**
 * POST /api/predictive/grades/:studentId
 * Predice calificaciones futuras de un estudiante
 */
router.post('/grades/:studentId', authenticateJWT, predictiveLimiter, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { forecast_months = 3 } = req.body;

    devLogger.log(`[PREDICTIVE] Forecasting grades for student ${studentId} (${forecast_months} months)`);

    // Obtener calificaciones históricas
    const historicalGrades = await getHistoricalGrades(studentId);

    if (historicalGrades.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'insufficient_data',
        message: 'Se requieren al menos 10 calificaciones históricas para predicción',
        available: historicalGrades.length
      });
    }

    // Ejecutar predicción
    const prediction = await executePythonPrediction({
      type: 'grades',
      data: historicalGrades,
      params: {
        student_id: studentId,
        forecast_months: parseInt(forecast_months)
      }
    });

    if (!prediction.success) {
      return res.status(500).json(prediction);
    }

    res.json({
      success: true,
      student_id: studentId,
      forecast_months,
      ...prediction
    });

  } catch (error) {
    console.error('[PREDICTIVE] Error in grades prediction:', error);
    res.status(500).json({
      success: false,
      error: 'prediction_failed',
      message: error.message
    });
  }
});

/**
 * POST /api/predictive/enrollments
 * Predice inscripciones futuras por período
 */
router.post('/enrollments', authenticateJWT, requireRole(['admin', 'directivo']), predictiveLimiter, async (req, res) => {
  try {
    const { forecast_months = 6 } = req.body;

    devLogger.log(`[PREDICTIVE] Forecasting enrollments (${forecast_months} months)`);

    // Obtener inscripciones históricas
    const historicalEnrollments = await getHistoricalEnrollments();

    if (historicalEnrollments.length < 12) {
      return res.status(400).json({
        success: false,
        error: 'insufficient_data',
        message: 'Se requieren al menos 12 meses de datos históricos',
        available: historicalEnrollments.length
      });
    }

    // Ejecutar predicción
    const prediction = await executePythonPrediction({
      type: 'enrollments',
      data: historicalEnrollments,
      params: {
        forecast_months: parseInt(forecast_months)
      }
    });

    if (!prediction.success) {
      return res.status(500).json(prediction);
    }

    res.json({
      success: true,
      forecast_months,
      ...prediction
    });

  } catch (error) {
    console.error('[PREDICTIVE] Error in enrollments prediction:', error);
    res.status(500).json({
      success: false,
      error: 'prediction_failed',
      message: error.message
    });
  }
});

/**
 * POST /api/predictive/dropout
 * Predice tendencia de deserción
 */
router.post('/dropout', authenticateJWT, requireRole(['admin', 'directivo']), predictiveLimiter, async (req, res) => {
  try {
    const { forecast_months = 6 } = req.body;

    devLogger.log(`[PREDICTIVE] Forecasting dropout trend (${forecast_months} months)`);

    // Obtener deserción histórica
    const historicalDropout = await getHistoricalDropout();

    if (historicalDropout.length < 12) {
      return res.status(400).json({
        success: false,
        error: 'insufficient_data',
        message: 'Se requieren al menos 12 meses de datos',
        available: historicalDropout.length
      });
    }

    // Ejecutar predicción
    const prediction = await executePythonPrediction({
      type: 'dropout',
      data: historicalDropout,
      params: {
        forecast_months: parseInt(forecast_months)
      }
    });

    if (!prediction.success) {
      return res.status(500).json(prediction);
    }

    res.json({
      success: true,
      forecast_months,
      ...prediction
    });

  } catch (error) {
    console.error('[PREDICTIVE] Error in dropout prediction:', error);
    res.status(500).json({
      success: false,
      error: 'prediction_failed',
      message: error.message
    });
  }
});

/**
 * POST /api/predictive/custom/arima
 * ARIMA forecasting con datos custom
 */
router.post('/custom/arima', authenticateJWT, requireRole(['admin', 'directivo']), predictiveLimiter, async (req, res) => {
  try {
    const { data, periods = 30, order = [1, 1, 1], value_column = 'value' } = req.body;

    if (!data || !Array.isArray(data) || data.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'invalid_data',
        message: 'Se requiere un array de al menos 10 registros con {date, value}'
      });
    }

    devLogger.log(`[PREDICTIVE] Custom ARIMA forecast (${periods} periods, order ${order})`);

    const prediction = await executePythonPrediction({
      type: 'custom_arima',
      data,
      params: {
        periods: parseInt(periods),
        order,
        value_column
      }
    });

    res.json(prediction);

  } catch (error) {
    console.error('[PREDICTIVE] Error in custom ARIMA:', error);
    res.status(500).json({
      success: false,
      error: 'prediction_failed',
      message: error.message
    });
  }
});

/**
 * POST /api/predictive/custom/prophet
 * Prophet forecasting con datos custom
 */
router.post('/custom/prophet', authenticateJWT, requireRole(['admin', 'directivo']), predictiveLimiter, async (req, res) => {
  try {
    const { data, periods = 30, seasonality_mode = 'additive' } = req.body;

    if (!data || !Array.isArray(data) || data.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'invalid_data',
        message: 'Se requiere un array de al menos 10 registros con {ds, y}'
      });
    }

    devLogger.log(`[PREDICTIVE] Custom Prophet forecast (${periods} periods, ${seasonality_mode})`);

    const prediction = await executePythonPrediction({
      type: 'custom_prophet',
      data,
      params: {
        periods: parseInt(periods),
        seasonality_mode
      }
    });

    res.json(prediction);

  } catch (error) {
    console.error('[PREDICTIVE] Error in custom Prophet:', error);
    res.status(500).json({
      success: false,
      error: 'prediction_failed',
      message: error.message
    });
  }
});

/**
 * GET /api/predictive/trends/:metric
 * Análisis de tendencias de una métrica específica
 */
router.get('/trends/:metric', authenticateJWT, predictiveLimiter, async (req, res) => {
  try {
    const { metric } = req.params;
    const { start_date, end_date } = req.query;

    devLogger.log(`[PREDICTIVE] Trend analysis for ${metric}`);

    let data = [];

    switch (metric) {
      case 'grades':
        // ✅ FASE 3: Using AnalyticsDAO.getGradesTrend
        data = await AnalyticsDAO.getGradesTrend(
          start_date || '2024-01-01',
          end_date || '2025-12-31'
        );
        break;

      case 'enrollments':
        data = await getHistoricalEnrollments();
        break;

      case 'dropout':
        data = await getHistoricalDropout();
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'invalid_metric',
          message: `Métrica desconocida: ${metric}. Opciones: grades, enrollments, dropout`
        });
    }

    if (data.length < 5) {
      return res.status(400).json({
        success: false,
        error: 'insufficient_data',
        message: 'Datos insuficientes para análisis de tendencia'
      });
    }

    // Ejecutar análisis de tendencia (usando ARIMA con forecast_months=0 para solo analizar)
    const analysis = await executePythonPrediction({
      type: 'custom_arima',
      data,
      params: {
        periods: 7, // Mínimo para obtener tendencia
        value_column: 'value'
      }
    });

    res.json({
      success: true,
      metric,
      data_points: data.length,
      trend_analysis: analysis.success ? analysis : null
    });

  } catch (error) {
    console.error('[PREDICTIVE] Error in trend analysis:', error);
    res.status(500).json({
      success: false,
      error: 'analysis_failed',
      message: error.message
    });
  }
});

// ===========================================================================
// ANALYTICS SUMMARY (Admin Dashboard)
// ===========================================================================

/**
 * GET /api/predictive/summary
 * Resumen de todas las predicciones disponibles
 */
router.get('/summary', authenticateJWT, requireRole(['admin', 'directivo']), async (req, res) => {
  try {
    devLogger.log('[PREDICTIVE] Generating analytics summary');

    // ✅ FASE 3: Using AnalyticsDAO
    const [enrollments, dropout, gradesData] = await Promise.all([
      getHistoricalEnrollments(),
      getHistoricalDropout(),
      AnalyticsDAO.getPredictiveSummary()
    ]);

    const gradesCount = gradesData.total_students_with_grades;

    const summary = {
      success: true,
      available_predictions: {
        enrollments: {
          available: enrollments.length >= 12,
          data_points: enrollments.length,
          required: 12,
          status: enrollments.length >= 12 ? 'ready' : 'insufficient_data'
        },
        dropout: {
          available: dropout.length >= 12,
          data_points: dropout.length,
          required: 12,
          status: dropout.length >= 12 ? 'ready' : 'insufficient_data'
        },
        grades: {
          available: gradesCount > 0,
          students_with_grades: gradesCount,
          status: gradesCount > 0 ? 'ready' : 'no_data'
        }
      },
      latest_metrics: {
        latest_enrollment_month: enrollments.length > 0 ? enrollments[enrollments.length - 1].date : null,
        latest_enrollment_count: enrollments.length > 0 ? enrollments[enrollments.length - 1].count : 0,
        latest_dropout_month: dropout.length > 0 ? dropout[dropout.length - 1].date : null,
        latest_dropout_count: dropout.length > 0 ? dropout[dropout.length - 1].dropout_count : 0
      },
      endpoints: {
        grades: 'POST /api/predictive/grades/:studentId',
        enrollments: 'POST /api/predictive/enrollments',
        dropout: 'POST /api/predictive/dropout',
        custom_arima: 'POST /api/predictive/custom/arima',
        custom_prophet: 'POST /api/predictive/custom/prophet',
        trends: 'GET /api/predictive/trends/:metric'
      }
    };

    res.json(summary);

  } catch (error) {
    console.error('[PREDICTIVE] Error generating summary:', error);
    res.status(500).json({
      success: false,
      error: 'summary_failed',
      message: error.message
    });
  }
});

// ===========================================================================
// EXPORT
// ===========================================================================

module.exports = router;
