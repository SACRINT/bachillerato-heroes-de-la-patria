/**
 * 🤖 ML PREDICTIONS API
 * SEMANA 17 - Machine Learning & AI
 * ✅ FASE 3 DAL - Refactorizado para usar DAO donde aplicable
 *
 * Endpoints para predicciones de éxito estudiantil
 *
 * Endpoints:
 * - POST /api/ml/predict - Predecir riesgo de deserción
 * - GET /api/ml/batch-predict - Predicciones para múltiples estudiantes
 * - GET /api/ml/model-info - Información del modelo
 * - GET /api/ml/high-risk-students - Estudiantes en alto riesgo
 *
 * Fecha: 17 Noviembre 2025
 * Estado: ✅ PRODUCTION-READY
 */

const express = require('express');
const router = express.Router();
const { authenticateJWT, requireRole } = require('../middleware/auth');
const pool = require('../config/database');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

// ✅ FASE 3: Using DAO layer
const AnalyticsDAO = require('../data/analytics.dao');
const devLogger = require('../utils/devLogger');

// =============================================================================
// HELPER: EXECUTE PYTHON ML MODEL
// =============================================================================

/**
 * Ejecuta script Python para predicción
 * @param {object} studentFeatures - Features del estudiante
 * @returns {Promise<object>} Predicción
 */
async function executePythonPrediction(studentFeatures) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '../ml/predict.py');

    const python = spawn('python3', [pythonScript]);

    let stdout = '';
    let stderr = '';

    // Enviar features como JSON a stdin
    python.stdin.write(JSON.stringify(studentFeatures));
    python.stdin.end();

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        console.error('[ML-API] Python script failed:', stderr);
        reject(new Error(`Python script failed with code ${code}`));
        return;
      }

      try {
        const prediction = JSON.parse(stdout);
        resolve(prediction);
      } catch (error) {
        reject(new Error('Failed to parse prediction output'));
      }
    });
  });
}

// =============================================================================
// HELPER: EXTRACT STUDENT FEATURES
// =============================================================================

/**
 * Extrae features de un estudiante desde la BD
 * ✅ FASE 3: Using AnalyticsDAO
 * @param {string} studentId - UUID del estudiante
 * @returns {Promise<object>} Features del estudiante
 */
async function extractStudentFeatures(studentId) {
  // ✅ FASE 3: Using AnalyticsDAO.getStudentFeatures
  const data = await AnalyticsDAO.getStudentFeatures(studentId);

  if (!data) {
    throw new Error(`Student not found: ${studentId}`);
  }

  const data = result.rows[0];

  // Calcular features derivadas
  const maxLogin = 100; // Normalización
  const maxAssignments = 50;

  const engagement_score = (
    (data.login_count / maxLogin) * 0.5 +
    (data.assignments_submitted / maxAssignments) * 0.5
  ) * 100;

  const grade_consistency = 100 - ((data.grade_stddev || 0) / 10 * 100);
  const preliminary_risk = (
    (100 - data.attendance_rate) * 0.3 +
    (100 - (data.avg_grade / 10 * 100)) * 0.4 +
    (100 - engagement_score) * 0.3
  );

  return {
    student_id: data.student_id,
    attendance_rate: parseFloat(data.attendance_rate),
    avg_grade: parseFloat(data.avg_grade),
    min_grade: parseFloat(data.min_grade),
    max_grade: parseFloat(data.max_grade),
    grade_stddev: parseFloat(data.grade_stddev),
    login_count: parseInt(data.login_count),
    assignments_submitted: parseInt(data.assignments_submitted),
    age: parseInt(data.age),
    engagement_score: Math.min(100, engagement_score),
    grade_consistency: Math.max(0, Math.min(100, grade_consistency)),
    preliminary_risk: Math.min(100, preliminary_risk),
    gender_male: parseInt(data.gender_male),
    gender_female: parseInt(data.gender_female)
  };
}

// =============================================================================
// ROUTES
// =============================================================================

/**
 * POST /api/ml/predict
 * Predecir riesgo de deserción para un estudiante
 *
 * Body:
 * {
 *   "studentId": "uuid"
 * }
 *
 * O con features manuales:
 * {
 *   "features": {
 *     "attendance_rate": 75.0,
 *     "avg_grade": 7.5,
 *     ...
 *   }
 * }
 */
router.post('/predict', authenticateJWT, async (req, res) => {
  try {
    const { studentId, features } = req.body;

    let studentFeatures;

    if (studentId) {
      // Extraer features desde BD
      studentFeatures = await extractStudentFeatures(studentId);
    } else if (features) {
      // Usar features proporcionadas
      studentFeatures = features;
    } else {
      return res.status(400).json({
        error: 'Missing required field: studentId or features'
      });
    }

    // Ejecutar predicción
    const prediction = await executePythonPrediction(studentFeatures);

    devLogger.log(`[ML-API] Prediction for student ${studentId || 'manual'}:`, prediction.risk_category);

    res.status(200).json({
      success: true,
      student_id: studentId,
      prediction
    });

  } catch (error) {
    console.error('[ML-API] Error in prediction:', error);

    res.status(500).json({
      error: 'Failed to generate prediction',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/ml/batch-predict?studentIds=uuid1,uuid2,uuid3
 * Predicciones para múltiples estudiantes
 */
router.get('/batch-predict', authenticateJWT, requireRole(['admin', 'administrativo', 'docente']), async (req, res) => {
  try {
    const { studentIds } = req.query;

    if (!studentIds) {
      return res.status(400).json({
        error: 'Missing required query parameter: studentIds'
      });
    }

    const ids = studentIds.split(',');

    if (ids.length > 50) {
      return res.status(400).json({
        error: 'Maximum 50 students per batch request'
      });
    }

    devLogger.log(`[ML-API] Batch prediction for ${ids.length} students`);

    const predictions = [];

    for (const studentId of ids) {
      try {
        const features = await extractStudentFeatures(studentId.trim());
        const prediction = await executePythonPrediction(features);

        predictions.push({
          student_id: studentId.trim(),
          ...prediction
        });

      } catch (error) {
        console.warn(`[ML-API] Failed to predict for student ${studentId}:`, error.message);
        predictions.push({
          student_id: studentId.trim(),
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      total: predictions.length,
      predictions
    });

  } catch (error) {
    console.error('[ML-API] Error in batch prediction:', error);

    res.status(500).json({
      error: 'Failed to generate batch predictions',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/ml/model-info
 * Información del modelo ML (metadata, métricas)
 */
router.get('/model-info', async (req, res) => {
  try {
    const metadataPath = path.join(__dirname, '../ml/models/model_metadata.json');

    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));

    res.status(200).json({
      success: true,
      model: metadata
    });

  } catch (error) {
    console.error('[ML-API] Error reading model metadata:', error);

    res.status(500).json({
      error: 'Failed to read model metadata',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/ml/high-risk-students
 * Lista de estudiantes en alto riesgo (admin/docente)
 */
router.get('/high-risk-students', authenticateJWT, requireRole(['admin', 'administrativo', 'docente']), async (req, res) => {
  try {
    // ✅ FASE 3: Using AnalyticsDAO
    const students = await AnalyticsDAO.getActiveStudents(100);

    devLogger.log(`[ML-API] Analyzing ${students.length} students for high risk...`);

    const highRiskStudents = [];

    for (const student of students) {
      try {
        const features = await extractStudentFeatures(student.uuid);
        const prediction = await executePythonPrediction(features);

        if (prediction.risk_category === 'high' || prediction.dropout_probability >= 0.7) {
          highRiskStudents.push({
            student_id: student.uuid,
            nombre: student.nombre,
            apellido_paterno: student.apellido_paterno,
            email: student.email,
            dropout_probability: prediction.dropout_probability,
            risk_label: prediction.risk_label,
            recommendation: prediction.recommendation
          });
        }

      } catch (error) {
        console.warn(`[ML-API] Failed to analyze student ${student.uuid}:`, error.message);
      }
    }

    // Ordenar por probabilidad de deserción (mayor a menor)
    highRiskStudents.sort((a, b) => b.dropout_probability - a.dropout_probability);

    devLogger.log(`[ML-API] Found ${highRiskStudents.length} high-risk students`);

    res.status(200).json({
      success: true,
      total_students_analyzed: students.length,
      high_risk_count: highRiskStudents.length,
      high_risk_students: highRiskStudents
    });

  } catch (error) {
    console.error('[ML-API] Error analyzing high-risk students:', error);

    res.status(500).json({
      error: 'Failed to analyze high-risk students',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = router;
