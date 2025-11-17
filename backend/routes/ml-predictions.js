/**
 * 🤖 ML PREDICTIONS API
 * SEMANA 17 - Machine Learning & AI
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
 * @param {string} studentId - UUID del estudiante
 * @returns {Promise<object>} Features del estudiante
 */
async function extractStudentFeatures(studentId) {
  const query = `
    WITH student_data AS (
      SELECT
        u.uuid AS student_id,
        u.date_of_birth,
        u.gender,
        u.status,

        -- Asistencia
        COUNT(DISTINCT a.id) AS total_attendance_records,
        SUM(CASE WHEN a.estado = 'presente' THEN 1 ELSE 0 END) AS days_present,
        ROUND(
          SUM(CASE WHEN a.estado = 'presente' THEN 1 ELSE 0 END)::NUMERIC /
          NULLIF(COUNT(DISTINCT a.id), 0) * 100,
          2
        ) AS attendance_rate,

        -- Calificaciones
        AVG(c.calificacion) AS avg_grade,
        MIN(c.calificacion) AS min_grade,
        MAX(c.calificacion) AS max_grade,
        STDDEV(c.calificacion) AS grade_stddev,

        -- Engagement
        COUNT(DISTINCT al.id) FILTER (WHERE al.action = 'LOGIN') AS login_count,
        COUNT(DISTINCT te.id) AS assignments_submitted

      FROM usuarios u
      LEFT JOIN asistencia a ON u.uuid = a.estudiante_id
      LEFT JOIN calificaciones c ON u.uuid = c.estudiante_id
      LEFT JOIN audit_logs al ON u.uuid = al.user_id
      LEFT JOIN tareas_estudiantes te ON u.uuid = te.estudiante_id

      WHERE u.uuid = $1 AND u.role = 'estudiante'

      GROUP BY u.uuid, u.date_of_birth, u.gender, u.status
    )

    SELECT
      student_id,
      COALESCE(attendance_rate, 0) AS attendance_rate,
      COALESCE(avg_grade, 7.0) AS avg_grade,
      COALESCE(min_grade, 6.0) AS min_grade,
      COALESCE(max_grade, 8.0) AS max_grade,
      COALESCE(grade_stddev, 0) AS grade_stddev,
      COALESCE(login_count, 0) AS login_count,
      COALESCE(assignments_submitted, 0) AS assignments_submitted,
      EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) AS age,
      CASE WHEN gender = 'M' THEN 1 ELSE 0 END AS gender_male,
      CASE WHEN gender = 'F' THEN 1 ELSE 0 END AS gender_female

    FROM student_data
  `;

  const result = await pool.query(query, [studentId]);

  if (result.rows.length === 0) {
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

    console.log(`[ML-API] Prediction for student ${studentId || 'manual'}:`, prediction.risk_category);

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

    console.log(`[ML-API] Batch prediction for ${ids.length} students`);

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
    // Obtener todos los estudiantes activos
    const studentsResult = await pool.query(
      `SELECT uuid, nombre, apellido_paterno, email
       FROM usuarios
       WHERE role = 'estudiante' AND status = 'activo'
       LIMIT 100`
    );

    const students = studentsResult.rows;

    console.log(`[ML-API] Analyzing ${students.length} students for high risk...`);

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

    console.log(`[ML-API] Found ${highRiskStudents.length} high-risk students`);

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
