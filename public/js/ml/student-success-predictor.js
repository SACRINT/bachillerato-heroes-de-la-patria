/**
 * 🤖 STUDENT SUCCESS PREDICTOR - FRONTEND CLIENT
 * SEMANA 17 - Machine Learning & AI
 *
 * Cliente JavaScript para predicciones de éxito estudiantil
 *
 * Uso:
 * const predictor = new StudentSuccessPredictor();
 * const prediction = await predictor.predictForStudent(studentId);
 *
 * Fecha: 17 Noviembre 2025
 * Estado: ✅ PRODUCTION-READY
 */

class StudentSuccessPredictor {
  constructor() {
    this.apiBaseUrl = '/api/ml';
    this.modelInfo = null;
  }

  // ===========================================================================
  // MODEL INFO
  // ===========================================================================

  /**
   * Obtiene información del modelo ML (metadata, métricas)
   * @returns {Promise<object>} Model metadata
   */
  async getModelInfo() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/model-info`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.modelInfo = data.model;

      return this.modelInfo;

    } catch (error) {
      console.error('[ML-Client] Error fetching model info:', error);
      throw error;
    }
  }

  // ===========================================================================
  // SINGLE PREDICTION
  // ===========================================================================

  /**
   * Predice riesgo de deserción para un estudiante
   * @param {string} studentId - UUID del estudiante
   * @returns {Promise<object>} Predicción con probabilidad y recomendación
   */
  async predictForStudent(studentId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ studentId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      void 0;

      return data.prediction;

    } catch (error) {
      console.error('[ML-Client] Prediction failed:', error);
      throw error;
    }
  }

  /**
   * Predice con features manuales (sin student ID)
   * @param {object} features - Features del estudiante
   * @returns {Promise<object>} Predicción
   */
  async predictWithFeatures(features) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ features })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      return data.prediction;

    } catch (error) {
      console.error('[ML-Client] Prediction with features failed:', error);
      throw error;
    }
  }

  // ===========================================================================
  // BATCH PREDICTION
  // ===========================================================================

  /**
   * Predicciones para múltiples estudiantes
   * @param {Array<string>} studentIds - Array de UUIDs
   * @returns {Promise<Array>} Array de predicciones
   */
  async batchPredict(studentIds) {
    try {
      if (studentIds.length > 50) {
        throw new Error('Maximum 50 students per batch request');
      }

      const response = await fetch(
        `${this.apiBaseUrl}/batch-predict?studentIds=${studentIds.join(',')}`,
        {
          headers: {
            'Authorization': `Bearer ${this.getAuthToken()}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      void 0;

      return data.predictions;

    } catch (error) {
      console.error('[ML-Client] Batch prediction failed:', error);
      throw error;
    }
  }

  // ===========================================================================
  // HIGH-RISK STUDENTS
  // ===========================================================================

  /**
   * Obtiene lista de estudiantes en alto riesgo
   * @returns {Promise<Array>} Estudiantes en alto riesgo
   */
  async getHighRiskStudents() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/high-risk-students`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      void 0;

      return data.high_risk_students;

    } catch (error) {
      console.error('[ML-Client] Failed to fetch high-risk students:', error);
      throw error;
    }
  }

  // ===========================================================================
  // UI RENDERING
  // ===========================================================================

  /**
   * Renderiza widget de predicción en el DOM
   * @param {object} prediction - Resultado de la predicción
   * @param {HTMLElement} container - Contenedor DOM
   */
  renderPredictionWidget(prediction, container) {
    const {
      dropout_probability,
      success_probability,
      risk_category,
      risk_label,
      risk_color,
      recommendation,
      confidence
    } = prediction;

    const html = `
      <div class="ml-prediction-widget" style="border-left: 4px solid ${risk_color};">
        <div class="prediction-header">
          <h4>
            <i class="bi bi-robot"></i>
            Predicción de Éxito Estudiantil
          </h4>
          <span class="badge" style="background-color: ${risk_color};">
            ${risk_label}
          </span>
        </div>

        <div class="prediction-body">
          <!-- Probabilidades -->
          <div class="row mb-3">
            <div class="col-6">
              <div class="metric-card">
                <div class="metric-label">Probabilidad de Éxito</div>
                <div class="metric-value text-success">
                  ${(success_probability * 100).toFixed(1)}%
                </div>
              </div>
            </div>
            <div class="col-6">
              <div class="metric-card">
                <div class="metric-label">Riesgo de Deserción</div>
                <div class="metric-value" style="color: ${risk_color};">
                  ${(dropout_probability * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          <!-- Barra de progreso -->
          <div class="mb-3">
            <label class="form-label">Nivel de Riesgo</label>
            <div class="progress" style="height: 25px;">
              <div
                class="progress-bar"
                role="progressbar"
                style="width: ${dropout_probability * 100}%; background-color: ${risk_color};"
                aria-valuenow="${dropout_probability * 100}"
                aria-valuemin="0"
                aria-valuemax="100">
                ${(dropout_probability * 100).toFixed(1)}%
              </div>
            </div>
            <small class="text-muted">
              Confianza del modelo: ${this.getConfidenceBadge(confidence)}
            </small>
          </div>

          <!-- Recomendación -->
          <div class="alert alert-${risk_category === 'high' ? 'danger' : risk_category === 'medium' ? 'warning' : 'success'}" role="alert">
            <strong><i class="bi bi-lightbulb"></i> Recomendación:</strong><br>
            ${recommendation}
          </div>

          <!-- Acción rápida (si es alto riesgo) -->
          ${risk_category === 'high' ? `
            <div class="d-grid gap-2">
              <button class="btn btn-danger" onclick="window.contactTutor('${prediction.student_id || ''}')">
                <i class="bi bi-person-video3"></i>
                Contactar con Tutor Académico
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    container.innerHTML = (typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(html) : (typeof sanitizeHTML === 'function' ? sanitizeHTML(html) : html));
  }

  /**
   * Renderiza tabla de estudiantes de alto riesgo
   * @param {Array} highRiskStudents - Lista de estudiantes
   * @param {HTMLElement} container - Contenedor DOM
   */
  renderHighRiskTable(highRiskStudents, container) {
    if (highRiskStudents.length === 0) {
      container.innerHTML = `
        <div class="alert alert-success">
          <i class="bi bi-check-circle"></i>
          ¡Excelente! No hay estudiantes en alto riesgo en este momento.
        </div>
      `;
      return;
    }

    const tableRows = highRiskStudents.map((student, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>
          ${student.nombre} ${student.apellido_paterno}
          <br>
          <small class="text-muted">${student.email}</small>
        </td>
        <td>
          <span class="badge bg-danger">
            ${(student.dropout_probability * 100).toFixed(1)}% riesgo
          </span>
        </td>
        <td>
          <small>${student.recommendation}</small>
        </td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="window.viewStudentDetails('${student.student_id}')">
            <i class="bi bi-eye"></i>
            Ver Detalles
          </button>
          <button class="btn btn-sm btn-warning" onclick="window.contactTutor('${student.student_id}')">
            <i class="bi bi-person-video3"></i>
            Contactar Tutor
          </button>
        </td>
      </tr>
    `).join('');

    const html = `
      <div class="table-responsive">
        <table class="table table-hover">
          <thead class="table-danger">
            <tr>
              <th>#</th>
              <th>Estudiante</th>
              <th>Riesgo</th>
              <th>Recomendación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>

      <div class="alert alert-warning mt-3">
        <strong><i class="bi bi-exclamation-triangle"></i> Acción Requerida:</strong>
        Se han identificado ${highRiskStudents.length} estudiantes en alto riesgo.
        Recomendamos contactar con sus tutores académicos lo antes posible.
      </div>
    `;

    container.innerHTML = (typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(html) : (typeof sanitizeHTML === 'function' ? sanitizeHTML(html) : html));
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  /**
   * Obtiene token de autenticación desde sessionStorage
   * @returns {string} JWT token
   */
  getAuthToken() {
    return sessionStorage.getItem('token') || localStorage.getItem('token') || '';
  }

  /**
   * Badge de confianza del modelo
   * @param {string} confidence - 'high', 'medium', 'low'
   * @returns {string} HTML badge
   */
  getConfidenceBadge(confidence) {
    const badges = {
      high: '<span class="badge bg-success">Alta</span>',
      medium: '<span class="badge bg-warning">Media</span>',
      low: '<span class="badge bg-secondary">Baja</span>'
    };

    return badges[confidence] || badges.low;
  }

  /**
   * Formatea probabilidad como porcentaje
   * @param {number} probability - Probabilidad (0-1)
   * @returns {string} Porcentaje formateado
   */
  formatProbability(probability) {
    return `${(probability * 100).toFixed(1)}%`;
  }
}

// =============================================================================
// EXPORT
// =============================================================================

// Exponer globalmente
window.StudentSuccessPredictor = StudentSuccessPredictor;

// Crear instancia global
window.mlPredictor = new StudentSuccessPredictor();

void 0;
