/**
 * 📊 PREDICTIVE ANALYTICS DASHBOARD
 * SEMANA 20 - Predictive Analytics & Forecasting
 *
 * Dashboard interactivo para visualizar predicciones de:
 * - Calificaciones de estudiantes (ARIMA + Prophet)
 * - Inscripciones futuras (seasonal forecasting)
 * - Tendencia de deserción (alert system)
 * - Métricas custom con análisis de tendencias
 *
 * Integración con Chart.js para gráficas interactivas
 *
 * Fecha: 17 Noviembre 2025
 * Estado: ✅ PRODUCTION-READY
 */

class PredictiveDashboard {
  constructor(options = {}) {
    this.apiBaseUrl = options.apiBaseUrl || '/api/predictive';
    this.chartsInstances = {};

    // Configuración de colores
    this.colors = {
      arima: '#3498db',
      prophet: '#9b59b6',
      historical: '#95a5a6',
      forecast: '#e74c3c',
      trend: '#2ecc71',
      confidence: 'rgba(52, 152, 219, 0.2)'
    };
  }

  // ===========================================================================
  // PREDICCIÓN DE CALIFICACIONES
  // ===========================================================================

  /**
   * Carga y muestra predicción de calificaciones para un estudiante
   * @param {string} studentId - UUID del estudiante
   * @param {HTMLElement} container - Contenedor DOM
   * @param {number} forecastMonths - Meses a pronosticar (default: 3)
   */
  async renderGradesForecast(studentId, container, forecastMonths = 3) {
    try {
      // Mostrar loading
      container.innerHTML = this.getLoadingHTML('Generando predicción de calificaciones...');

      // Llamar API
      const response = await fetch(`${this.apiBaseUrl}/grades/${studentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ forecast_months: forecastMonths })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        container.innerHTML = this.getErrorHTML(data.message || 'Error en predicción');
        return;
      }

      // Renderizar dashboard
      this.displayGradesForecast(data, container);

    } catch (error) {
      console.error('[PREDICTIVE-DASHBOARD] Error loading grades forecast:', error);
      container.innerHTML = this.getErrorHTML(error.message);
    }
  }

  /**
   * Muestra predicción de calificaciones con gráficas
   */
  displayGradesForecast(data, container) {
    const { historical_stats, arima, prophet, trend, recommendation } = data;

    const html = `
      <div class="predictive-grades-dashboard card">
        <div class="card-header bg-primary text-white">
          <h4><i class="bi bi-graph-up"></i> Predicción de Calificaciones</h4>
        </div>

        <div class="card-body">
          <!-- Estadísticas Históricas -->
          <div class="row mb-4">
            <div class="col-md-3">
              <div class="metric-card text-center">
                <h6 class="text-muted">Promedio Actual</h6>
                <h2 class="text-primary">${historical_stats.mean.toFixed(2)}</h2>
              </div>
            </div>
            <div class="col-md-3">
              <div class="metric-card text-center">
                <h6 class="text-muted">Última Calificación</h6>
                <h2>${historical_stats.latest.toFixed(2)}</h2>
              </div>
            </div>
            <div class="col-md-3">
              <div class="metric-card text-center">
                <h6 class="text-muted">Tendencia</h6>
                <h2 class="${this.getTrendColorClass(trend.direction)}">
                  ${this.getTrendIcon(trend.direction)} ${trend.direction}
                </h2>
              </div>
            </div>
            <div class="col-md-3">
              <div class="metric-card text-center">
                <h6 class="text-muted">Datos Históricos</h6>
                <h2>${historical_stats.count}</h2>
              </div>
            </div>
          </div>

          <!-- Gráfica de Predicción -->
          <div class="mb-4">
            <canvas id="grades-forecast-chart-${Date.now()}"></canvas>
          </div>

          <!-- Comparación ARIMA vs Prophet -->
          <div class="row mb-4">
            <div class="col-md-6">
              <div class="card border-primary">
                <div class="card-body">
                  <h5 class="card-title">
                    <span style="color: ${this.colors.arima};">■</span> ARIMA
                  </h5>
                  <p><strong>Pronóstico Promedio:</strong> ${arima.summary.mean_forecast.toFixed(2)}</p>
                  <p><strong>Rango:</strong> ${arima.summary.min_forecast.toFixed(2)} - ${arima.summary.max_forecast.toFixed(2)}</p>
                  <p class="small text-muted">AIC: ${arima.aic.toFixed(2)} | BIC: ${arima.bic.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="card border-secondary">
                <div class="card-body">
                  <h5 class="card-title">
                    <span style="color: ${this.colors.prophet};">■</span> Prophet
                  </h5>
                  <p><strong>Pronóstico Promedio:</strong> ${prophet.summary.mean_forecast.toFixed(2)}</p>
                  <p><strong>Rango:</strong> ${prophet.summary.min_forecast.toFixed(2)} - ${prophet.summary.max_forecast.toFixed(2)}</p>
                  <p class="small text-muted">Incluye componentes estacionales y de tendencia</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Recomendación -->
          <div class="alert ${this.getRecommendationAlertClass(recommendation)}" role="alert">
            <strong><i class="bi bi-lightbulb"></i> Recomendación:</strong><br>
            ${recommendation}
          </div>

          <!-- Tabla de Pronósticos Detallados -->
          <div class="mt-4">
            <h5>Pronósticos Detallados (ARIMA)</h5>
            <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
              <table class="table table-sm table-hover">
                <thead class="table-light sticky-top">
                  <tr>
                    <th>Fecha</th>
                    <th>Pronóstico</th>
                    <th>Intervalo de Confianza (95%)</th>
                  </tr>
                </thead>
                <tbody>
                  ${arima.forecasts.slice(0, 10).map(f => `
                    <tr>
                      <td>${f.date}</td>
                      <td><strong>${f.value.toFixed(2)}</strong></td>
                      <td class="small text-muted">${f.lower_bound.toFixed(2)} - ${f.upper_bound.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                  ${arima.forecasts.length > 10 ? `
                    <tr>
                      <td colspan="3" class="text-center text-muted small">
                        <i>...y ${arima.forecasts.length - 10} más</i>
                      </td>
                    </tr>
                  ` : ''}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Crear gráfica con Chart.js
    const canvasId = container.querySelector('canvas').id;
    this.createForecastChart(canvasId, arima, prophet, 'Predicción de Calificaciones');
  }

  // ===========================================================================
  // PREDICCIÓN DE INSCRIPCIONES
  // ===========================================================================

  /**
   * Carga y muestra predicción de inscripciones
   */
  async renderEnrollmentsForecast(container, forecastMonths = 6) {
    try {
      container.innerHTML = this.getLoadingHTML('Generando predicción de inscripciones...');

      const response = await fetch(`${this.apiBaseUrl}/enrollments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ forecast_months: forecastMonths })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        container.innerHTML = this.getErrorHTML(data.message || 'Error en predicción');
        return;
      }

      this.displayEnrollmentsForecast(data, container);

    } catch (error) {
      console.error('[PREDICTIVE-DASHBOARD] Error loading enrollments forecast:', error);
      container.innerHTML = this.getErrorHTML(error.message);
    }
  }

  /**
   * Muestra predicción de inscripciones
   */
  displayEnrollmentsForecast(data, container) {
    const { historical_stats, arima, prophet, trend, insights } = data;

    const html = `
      <div class="predictive-enrollments-dashboard card">
        <div class="card-header bg-success text-white">
          <h4><i class="bi bi-people-fill"></i> Predicción de Inscripciones</h4>
        </div>

        <div class="card-body">
          <!-- Estadísticas -->
          <div class="row mb-4">
            <div class="col-md-4">
              <div class="metric-card text-center">
                <h6 class="text-muted">Promedio Mensual</h6>
                <h2 class="text-success">${Math.round(historical_stats.mean)}</h2>
              </div>
            </div>
            <div class="col-md-4">
              <div class="metric-card text-center">
                <h6 class="text-muted">Pico Histórico</h6>
                <h2>${historical_stats.peak}</h2>
              </div>
            </div>
            <div class="col-md-4">
              <div class="metric-card text-center">
                <h6 class="text-muted">Tendencia</h6>
                <h2 class="${this.getTrendColorClass(trend.direction)}">
                  ${this.getTrendIcon(trend.direction)} ${trend.percent_change.toFixed(1)}%
                </h2>
              </div>
            </div>
          </div>

          <!-- Gráfica -->
          <div class="mb-4">
            <canvas id="enrollments-forecast-chart-${Date.now()}"></canvas>
          </div>

          <!-- Insights -->
          ${insights && insights.length > 0 ? `
            <div class="alert alert-info">
              <strong><i class="bi bi-info-circle"></i> Insights Clave:</strong>
              <ul class="mb-0 mt-2">
                ${insights.map(insight => `<li>${insight}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <!-- Resumen de Modelos -->
          <div class="row">
            <div class="col-md-6">
              <h6>ARIMA: ${arima.summary.mean_forecast.toFixed(0)} inscripciones/mes (promedio)</h6>
              <small class="text-muted">Rango: ${arima.summary.min_forecast.toFixed(0)} - ${arima.summary.max_forecast.toFixed(0)}</small>
            </div>
            <div class="col-md-6">
              <h6>Prophet: ${prophet.summary.mean_forecast.toFixed(0)} inscripciones/mes (promedio)</h6>
              <small class="text-muted">Considera estacionalidad anual</small>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;

    const canvasId = container.querySelector('canvas').id;
    this.createForecastChart(canvasId, arima, prophet, 'Predicción de Inscripciones');
  }

  // ===========================================================================
  // PREDICCIÓN DE DESERCIÓN
  // ===========================================================================

  /**
   * Carga y muestra predicción de deserción
   */
  async renderDropoutForecast(container, forecastMonths = 6) {
    try {
      container.innerHTML = this.getLoadingHTML('Analizando tendencia de deserción...');

      const response = await fetch(`${this.apiBaseUrl}/dropout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ forecast_months: forecastMonths })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        container.innerHTML = this.getErrorHTML(data.message || 'Error en predicción');
        return;
      }

      this.displayDropoutForecast(data, container);

    } catch (error) {
      console.error('[PREDICTIVE-DASHBOARD] Error loading dropout forecast:', error);
      container.innerHTML = this.getErrorHTML(error.message);
    }
  }

  /**
   * Muestra predicción de deserción
   */
  displayDropoutForecast(data, container) {
    const { arima, prophet, trend, alert_level } = data;

    const html = `
      <div class="predictive-dropout-dashboard card border-${this.getAlertBorderColor(alert_level.level)}">
        <div class="card-header text-white" style="background-color: ${alert_level.color};">
          <h4><i class="bi bi-exclamation-triangle"></i> Análisis de Deserción</h4>
        </div>

        <div class="card-body">
          <!-- Alerta Principal -->
          <div class="alert" style="background-color: ${alert_level.color}20; border-color: ${alert_level.color};">
            <h5 style="color: ${alert_level.color};">
              Nivel de Alerta: ${alert_level.level}
            </h5>
            <p class="mb-0">${alert_level.message}</p>
          </div>

          <!-- Tendencia -->
          <div class="row mb-4">
            <div class="col-md-6">
              <div class="metric-card text-center">
                <h6 class="text-muted">Dirección de Tendencia</h6>
                <h2 class="${this.getTrendColorClass(trend.direction)}">
                  ${this.getTrendIcon(trend.direction)} ${trend.direction}
                </h2>
              </div>
            </div>
            <div class="col-md-6">
              <div class="metric-card text-center">
                <h6 class="text-muted">Cambio Porcentual</h6>
                <h2 class="${trend.percent_change > 0 ? 'text-danger' : 'text-success'}">
                  ${trend.percent_change > 0 ? '+' : ''}${trend.percent_change.toFixed(1)}%
                </h2>
              </div>
            </div>
          </div>

          <!-- Gráfica -->
          <div class="mb-4">
            <canvas id="dropout-forecast-chart-${Date.now()}"></canvas>
          </div>

          <!-- Recomendaciones de Acción -->
          ${this.getDropoutActionPlan(alert_level.level)}
        </div>
      </div>
    `;

    container.innerHTML = html;

    const canvasId = container.querySelector('canvas').id;
    this.createForecastChart(canvasId, arima, prophet, 'Tendencia de Deserción');
  }

  /**
   * Plan de acción según nivel de alerta
   */
  getDropoutActionPlan(level) {
    const actionPlans = {
      'CRÍTICO': `
        <div class="alert alert-danger">
          <strong>🚨 Plan de Acción CRÍTICO:</strong>
          <ol class="mb-0 mt-2">
            <li>Reunión de emergencia con equipo directivo</li>
            <li>Identificar estudiantes en riesgo inmediato</li>
            <li>Implementar programa de tutorías intensivas</li>
            <li>Contacto directo con padres de familia</li>
            <li>Revisar políticas de retención estudiantil</li>
          </ol>
        </div>
      `,
      'ALTO': `
        <div class="alert alert-warning">
          <strong>⚠️ Plan de Acción ALTO:</strong>
          <ol class="mb-0 mt-2">
            <li>Activar programa de mentorías peer-to-peer</li>
            <li>Implementar sesiones de orientación vocacional</li>
            <li>Revisar carga académica y dificultad de cursos</li>
            <li>Fortalecer apoyo psicopedagógico</li>
          </ol>
        </div>
      `,
      'MODERADO': `
        <div class="alert alert-info">
          <strong>📊 Plan de Acción MODERADO:</strong>
          <ol class="mb-0 mt-2">
            <li>Monitorear de cerca indicadores de deserción</li>
            <li>Mantener comunicación regular con estudiantes</li>
            <li>Continuar programas de apoyo académico</li>
          </ol>
        </div>
      `,
      'BAJO': `
        <div class="alert alert-success">
          <strong>✅ Estrategia Actual Efectiva:</strong>
          <p class="mb-0 mt-2">
            Las estrategias de retención están funcionando correctamente.
            Continuar monitoreando y mantener las mejores prácticas actuales.
          </p>
        </div>
      `
    };

    return actionPlans[level] || '';
  }

  // ===========================================================================
  // CHART.JS INTEGRATION
  // ===========================================================================

  /**
   * Crea gráfica de forecast con Chart.js
   */
  createForecastChart(canvasId, arima, prophet, title) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Preparar datos
    const arimaData = arima.forecasts.map(f => ({ x: f.date, y: f.value }));
    const prophetData = prophet.forecasts.map(f => ({ x: f.date, y: f.value }));
    const arimaConfidenceLower = arima.forecasts.map(f => ({ x: f.date, y: f.lower_bound }));
    const arimaConfidenceUpper = arima.forecasts.map(f => ({ x: f.date, y: f.upper_bound }));

    this.chartsInstances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'ARIMA Forecast',
            data: arimaData,
            borderColor: this.colors.arima,
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 3,
            tension: 0.1
          },
          {
            label: 'Prophet Forecast',
            data: prophetData,
            borderColor: this.colors.prophet,
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 3,
            tension: 0.1
          },
          {
            label: 'Intervalo de Confianza (95%)',
            data: arimaConfidenceUpper,
            borderColor: this.colors.confidence,
            backgroundColor: this.colors.confidence,
            fill: '+1',
            pointRadius: 0,
            borderWidth: 0
          },
          {
            label: '',
            data: arimaConfidenceLower,
            borderColor: this.colors.confidence,
            backgroundColor: this.colors.confidence,
            fill: false,
            pointRadius: 0,
            borderWidth: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2,
        plugins: {
          title: {
            display: true,
            text: title,
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              filter: (item) => item.text !== '' // Ocultar labels vacíos
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += context.parsed.y.toFixed(2);
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day',
              displayFormats: {
                day: 'MMM D'
              }
            },
            title: {
              display: true,
              text: 'Fecha'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Valor'
            },
            beginAtZero: false
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    });
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  getTrendIcon(direction) {
    const icons = {
      'creciente': '📈',
      'decreciente': '📉',
      'estable': '➡️'
    };
    return icons[direction] || '❓';
  }

  getTrendColorClass(direction) {
    const colors = {
      'creciente': 'text-success',
      'decreciente': 'text-danger',
      'estable': 'text-warning'
    };
    return colors[direction] || 'text-secondary';
  }

  getRecommendationAlertClass(recommendation) {
    if (recommendation.includes('ALERTA')) return 'alert-danger';
    if (recommendation.includes('Excelente')) return 'alert-success';
    if (recommendation.includes('Buen')) return 'alert-info';
    return 'alert-warning';
  }

  getAlertBorderColor(level) {
    const colors = {
      'CRÍTICO': 'danger',
      'ALTO': 'warning',
      'MODERADO': 'info',
      'BAJO': 'success'
    };
    return colors[level] || 'secondary';
  }

  getLoadingHTML(message = 'Cargando predicciones...') {
    return `
      <div class="text-center py-5">
        <div class="spinner-border text-primary mb-3" role="status" style="width: 3rem; height: 3rem;">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <p class="text-muted">${message}</p>
      </div>
    `;
  }

  getErrorHTML(message) {
    return `
      <div class="alert alert-danger" role="alert">
        <h5 class="alert-heading"><i class="bi bi-exclamation-triangle"></i> Error</h5>
        <p>${message}</p>
        <hr>
        <p class="mb-0 small">Por favor, intenta de nuevo o contacta al administrador.</p>
      </div>
    `;
  }

  getAuthToken() {
    return sessionStorage.getItem('token') || localStorage.getItem('token') || '';
  }

  /**
   * Destruye todas las instancias de Chart.js
   */
  destroyAllCharts() {
    Object.values(this.chartsInstances).forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
      }
    });
    this.chartsInstances = {};
  }
}

// =============================================================================
// EXPORT
// =============================================================================

// Exponer globalmente
window.PredictiveDashboard = PredictiveDashboard;

// Crear instancia global
window.predictiveDashboard = new PredictiveDashboard();

console.log('[PREDICTIVE-DASHBOARD] Dashboard loaded successfully');
