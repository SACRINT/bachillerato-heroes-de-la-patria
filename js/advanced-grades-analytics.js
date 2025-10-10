/**
 * 📊 ANÁLISIS AVANZADO DE CALIFICACIONES - Frontend
 * Sistema completo de visualización y análisis de rendimiento académico
 */

class AdvancedGradesAnalytics {
    constructor() {
        console.log('📊 [GRADES ANALYTICS] Inicializando sistema avanzado...');
        this.apiBase = 'http://localhost:3004/api/grades-analytics/';
        this.studentApiBase = 'http://localhost:3004/api/students/';
        this.authToken = localStorage.getItem('student_auth_token');
        this.currentStudent = JSON.parse(localStorage.getItem('current_student') || 'null');

        this.charts = {};
        this.data = {};

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadAnalyticsData();
    }

    setupEventListeners() {
        // Event listeners para filtros y controles
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeInterface();
        });

        // Listener para cambios de filtros
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('analytics-filter')) {
                this.applyFilters();
            }
        });

        // Listener para botones de acción
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-analytics-action')) {
                this.handleAnalyticsAction(e.target.dataset.action);
            }
        });
    }

    async loadAnalyticsData() {
        try {
            if (!this.currentStudent) {
                console.log('📊 No hay estudiante autenticado');
                return;
            }

            console.log('📊 Cargando datos de análisis para estudiante:', this.currentStudent.id);

            // Cargar análisis individual del estudiante
            const response = await this.apiCall(`student/${this.currentStudent.id}`);
            if (response.success) {
                this.data.studentAnalytics = response.data;
                this.renderStudentAnalytics();
            }

            // Cargar datos de progreso para gráficas
            const progressResponse = await this.apiCall(`student/${this.currentStudent.id}/progress`);
            if (progressResponse.success) {
                this.data.progressData = progressResponse.data;
                this.renderProgressCharts();
            }

        } catch (error) {
            console.error('❌ Error cargando datos de análisis:', error);
            this.showError('Error al cargar los datos de análisis académico');
        }
    }

    async apiCall(endpoint, options = {}) {
        try {
            const url = this.apiBase + endpoint;
            const config = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            };

            if (this.authToken) {
                config.headers['Authorization'] = `Bearer ${this.authToken}`;
            }

            const response = await fetch(url, config);
            return await response.json();

        } catch (error) {
            console.error('❌ Error en llamada API:', error);
            throw error;
        }
    }

    initializeInterface() {
        // Crear la interfaz si no existe
        if (!document.getElementById('advanced-grades-analytics')) {
            this.createAnalyticsInterface();
        }
    }

    createAnalyticsInterface() {
        const analyticsHTML = `
            <div id="advanced-grades-analytics" class="analytics-dashboard">
                <!-- Header del Dashboard -->
                <div class="analytics-header mb-4">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <h2 class="h3 mb-1">📊 Análisis Académico Avanzado</h2>
                            <p class="text-muted mb-0">Visualización completa de tu rendimiento académico</p>
                        </div>
                        <div class="col-md-4 text-end">
                            <button class="btn btn-primary btn-analytics-action" data-action="export">
                                <i class="fas fa-download"></i> Exportar Reporte
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Alertas y Notificaciones -->
                <div id="analytics-alerts" class="alerts-container mb-4"></div>

                <!-- Resumen General -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="card-title mb-0">📈 Resumen de Rendimiento</h5>
                            </div>
                            <div class="card-body">
                                <div class="row" id="performance-summary">
                                    <!-- Contenido dinámico -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Gráficas de Progreso -->
                <div class="row mb-4">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="card-title mb-0">📊 Progreso por Materia</h5>
                            </div>
                            <div class="card-body">
                                <canvas id="subjectProgressChart" width="400" height="300"></canvas>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="card-title mb-0">📈 Tendencia General</h5>
                            </div>
                            <div class="card-body">
                                <canvas id="overallTrendChart" width="400" height="300"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Análisis Detallado por Materia -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="card-title mb-0">🎯 Análisis por Materia</h5>
                            </div>
                            <div class="card-body">
                                <div id="subject-analysis-container">
                                    <!-- Contenido dinámico -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Recomendaciones -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="card-title mb-0">💡 Recomendaciones Personalizadas</h5>
                            </div>
                            <div class="card-body">
                                <div id="recommendations-container">
                                    <!-- Contenido dinámico -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Buscar contenedor existente o crear uno nuevo
        let container = document.querySelector('.student-dashboard-content');
        if (!container) {
            container = document.querySelector('.main-content');
        }
        if (!container) {
            container = document.body;
        }

        // Insertar la interfaz
        container.insertAdjacentHTML('beforeend', analyticsHTML);
    }

    renderStudentAnalytics() {
        if (!this.data.studentAnalytics) return;

        const analytics = this.data.studentAnalytics;

        // Renderizar resumen de rendimiento
        this.renderPerformanceSummary(analytics);

        // Renderizar alertas
        this.renderAlerts(analytics.alerts);

        // Renderizar análisis por materia
        this.renderSubjectAnalysis(analytics.subject_analysis);

        // Renderizar recomendaciones
        this.renderRecommendations(analytics.recommendations);
    }

    renderPerformanceSummary(analytics) {
        const container = document.getElementById('performance-summary');
        if (!container) return;

        const letterGrade = analytics.letter_grade;
        const trendIcon = this.getTrendIcon(analytics.performance_trend);
        const trendColor = this.getTrendColor(analytics.performance_trend);

        container.innerHTML = `
            <div class="col-md-3">
                <div class="stat-card text-center">
                    <div class="stat-icon bg-primary text-white rounded-circle mx-auto mb-2">
                        <i class="fas fa-graduation-cap"></i>
                    </div>
                    <h3 class="stat-value">${analytics.overall_average.toFixed(1)}</h3>
                    <p class="stat-label text-muted">Promedio General</p>
                    <span class="badge bg-primary">${letterGrade.letter} - ${letterGrade.label}</span>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card text-center">
                    <div class="stat-icon bg-info text-white rounded-circle mx-auto mb-2">
                        <i class="fas fa-book"></i>
                    </div>
                    <h3 class="stat-value">${analytics.total_subjects}</h3>
                    <p class="stat-label text-muted">Materias Cursando</p>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card text-center">
                    <div class="stat-icon ${trendColor} text-white rounded-circle mx-auto mb-2">
                        <i class="fas ${trendIcon}"></i>
                    </div>
                    <h3 class="stat-value">${this.getTrendLabel(analytics.performance_trend)}</h3>
                    <p class="stat-label text-muted">Tendencia</p>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card text-center">
                    <div class="stat-icon bg-warning text-white rounded-circle mx-auto mb-2">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3 class="stat-value">${analytics.alerts.length}</h3>
                    <p class="stat-label text-muted">Alertas Activas</p>
                </div>
            </div>
        `;
    }

    renderAlerts(alerts) {
        const container = document.getElementById('analytics-alerts');
        if (!container || !alerts.length) return;

        const alertsHTML = alerts.map(alert => {
            const alertClass = this.getAlertClass(alert.level);
            const icon = this.getAlertIcon(alert.level);

            return `
                <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
                    <i class="fas ${icon} me-2"></i>
                    <strong>${alert.type.replace('_', ' ').toUpperCase()}:</strong> ${alert.message}
                    ${alert.suggested_actions ? `
                        <ul class="mt-2 mb-0">
                            ${alert.suggested_actions.map(action => `<li>${action}</li>`).join('')}
                        </ul>
                    ` : ''}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;
        }).join('');

        container.innerHTML = alertsHTML;
    }

    renderSubjectAnalysis(subjects) {
        const container = document.getElementById('subject-analysis-container');
        if (!container || !subjects.length) return;

        const subjectsHTML = subjects.map(subject => {
            const statusColor = this.getPerformanceStatusColor(subject.performance_status);
            const trendIcon = this.getTrendIcon(subject.trend);

            return `
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="card subject-card">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <h6 class="card-title">${subject.subject}</h6>
                                <span class="badge ${statusColor}">${subject.performance_status}</span>
                            </div>

                            <div class="grade-display mb-3">
                                <div class="current-grade">
                                    <span class="grade-value">${subject.current_grade.toFixed(1)}</span>
                                    <span class="grade-letter">${subject.letter_grade.letter}</span>
                                </div>
                                <div class="grade-trend">
                                    <i class="fas ${trendIcon} text-${this.getTrendColorName(subject.trend)}"></i>
                                    <span class="trend-label">${this.getTrendLabel(subject.trend)}</span>
                                </div>
                            </div>

                            <div class="units-breakdown">
                                <h6 class="small text-muted mb-2">Calificaciones por Unidad</h6>
                                <div class="units-grid">
                                    ${subject.units.map(unit => `
                                        <div class="unit-item">
                                            <span class="unit-label">U${unit.unit}</span>
                                            <span class="unit-grade">${unit.grade.toFixed(1)}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>

                            <div class="subject-meta">
                                <small class="text-muted">
                                    <i class="fas fa-user-tie"></i> ${subject.teacher}<br>
                                    <i class="fas fa-layer-group"></i> ${subject.category}<br>
                                    <i class="fas fa-signal"></i> Dificultad: ${subject.difficulty_level}/5
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `<div class="row">${subjectsHTML}</div>`;
    }

    renderRecommendations(recommendations) {
        const container = document.getElementById('recommendations-container');
        if (!container || !recommendations.length) return;

        const recommendationsHTML = recommendations.map(rec => {
            const iconClass = this.getRecommendationIcon(rec.type);
            const cardClass = this.getRecommendationCardClass(rec.type);

            return `
                <div class="recommendation-card ${cardClass} mb-3">
                    <div class="card-body">
                        <div class="d-flex align-items-start">
                            <div class="recommendation-icon me-3">
                                <i class="fas ${iconClass}"></i>
                            </div>
                            <div class="recommendation-content">
                                <h6 class="recommendation-title">${rec.title}</h6>
                                <p class="recommendation-message mb-2">${rec.message}</p>
                                ${rec.action && rec.action !== 'maintain_level' ? `
                                    <button class="btn btn-sm btn-outline-primary btn-analytics-action"
                                            data-action="${rec.action}">
                                        Tomar Acción
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = recommendationsHTML;
    }

    renderProgressCharts() {
        if (!this.data.progressData) return;

        this.renderSubjectProgressChart();
        this.renderOverallTrendChart();
    }

    renderSubjectProgressChart() {
        const canvas = document.getElementById('subjectProgressChart');
        if (!canvas || !this.data.progressData.progress_chart_data) return;

        const ctx = canvas.getContext('2d');
        const progressData = this.data.progressData.progress_chart_data;

        // Preparar datos para Chart.js
        const datasets = progressData.map((subject, index) => {
            const colors = [
                'rgb(255, 99, 132)',
                'rgb(54, 162, 235)',
                'rgb(255, 205, 86)',
                'rgb(75, 192, 192)',
                'rgb(153, 102, 255)'
            ];

            return {
                label: subject.subject,
                data: subject.data.map(d => d.grade),
                borderColor: colors[index % colors.length],
                backgroundColor: colors[index % colors.length] + '20',
                tension: 0.1
            };
        });

        const labels = progressData[0]?.data.map(d => d.period) || [];

        this.charts.progressChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Progreso por Materia'
                    },
                    legend: {
                        display: true,
                        position: 'bottom'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10,
                        title: {
                            display: true,
                            text: 'Calificación'
                        }
                    }
                }
            }
        });
    }

    renderOverallTrendChart() {
        const canvas = document.getElementById('overallTrendChart');
        if (!canvas || !this.data.studentAnalytics) return;

        const ctx = canvas.getContext('2d');

        // Crear datos para la tendencia general
        const trendData = this.generateTrendData();

        this.charts.trendChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Unidad 1', 'Unidad 2', 'Unidad 3', 'Promedio'],
                datasets: [{
                    label: 'Promedio General',
                    data: trendData,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.2)',
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(255, 205, 86, 0.2)',
                        'rgba(75, 192, 192, 0.2)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 205, 86, 1)',
                        'rgba(75, 192, 192, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Tendencia General de Calificaciones'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10,
                        title: {
                            display: true,
                            text: 'Calificación'
                        }
                    }
                }
            }
        });
    }

    generateTrendData() {
        if (!this.data.studentAnalytics.subject_analysis) return [0, 0, 0, 0];

        const subjects = this.data.studentAnalytics.subject_analysis;

        const unit1Avg = subjects.reduce((sum, s) => sum + (s.units[0]?.grade || 0), 0) / subjects.length;
        const unit2Avg = subjects.reduce((sum, s) => sum + (s.units[1]?.grade || 0), 0) / subjects.length;
        const unit3Avg = subjects.reduce((sum, s) => sum + (s.units[2]?.grade || 0), 0) / subjects.length;
        const overallAvg = this.data.studentAnalytics.overall_average;

        return [unit1Avg, unit2Avg, unit3Avg, overallAvg];
    }

    // Métodos utilitarios para UI
    getTrendIcon(trend) {
        const icons = {
            'improving': 'fa-arrow-up',
            'declining': 'fa-arrow-down',
            'stable': 'fa-arrow-right'
        };
        return icons[trend] || 'fa-minus';
    }

    getTrendColor(trend) {
        const colors = {
            'improving': 'bg-success',
            'declining': 'bg-danger',
            'stable': 'bg-warning'
        };
        return colors[trend] || 'bg-secondary';
    }

    getTrendColorName(trend) {
        const colors = {
            'improving': 'success',
            'declining': 'danger',
            'stable': 'warning'
        };
        return colors[trend] || 'secondary';
    }

    getTrendLabel(trend) {
        const labels = {
            'improving': 'Mejorando',
            'declining': 'Descendente',
            'stable': 'Estable'
        };
        return labels[trend] || 'Sin datos';
    }

    getAlertClass(level) {
        const classes = {
            'critical': 'alert-danger',
            'warning': 'alert-warning',
            'info': 'alert-info'
        };
        return classes[level] || 'alert-secondary';
    }

    getAlertIcon(level) {
        const icons = {
            'critical': 'fa-exclamation-circle',
            'warning': 'fa-exclamation-triangle',
            'info': 'fa-info-circle'
        };
        return icons[level] || 'fa-bell';
    }

    getPerformanceStatusColor(status) {
        const colors = {
            'excellent': 'bg-success',
            'good': 'bg-primary',
            'warning': 'bg-warning',
            'critical': 'bg-danger'
        };
        return colors[status] || 'bg-secondary';
    }

    getRecommendationIcon(type) {
        const icons = {
            'critical': 'fa-exclamation-circle',
            'warning': 'fa-exclamation-triangle',
            'action': 'fa-tasks',
            'congratulations': 'fa-trophy'
        };
        return icons[type] || 'fa-lightbulb';
    }

    getRecommendationCardClass(type) {
        const classes = {
            'critical': 'border-danger',
            'warning': 'border-warning',
            'action': 'border-info',
            'congratulations': 'border-success'
        };
        return classes[type] || 'border-secondary';
    }

    handleAnalyticsAction(action) {
        console.log('📊 Ejecutando acción:', action);

        const actions = {
            'export': () => this.exportReport(),
            'schedule_meeting': () => this.scheduleMeeting(),
            'study_plan': () => this.createStudyPlan(),
            'subject_support': () => this.requestSubjectSupport()
        };

        if (actions[action]) {
            actions[action]();
        } else {
            console.log('📊 Acción no implementada:', action);
            this.showInfo('Esta funcionalidad estará disponible próximamente');
        }
    }

    exportReport() {
        console.log('📊 Exportando reporte académico...');
        this.showSuccess('Reporte académico generado exitosamente');

        // Simular descarga de reporte
        const reportData = {
            student: this.currentStudent,
            analytics: this.data.studentAnalytics,
            generated_at: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_academico_${this.currentStudent.matricula}_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    scheduleMeeting() {
        this.showInfo('Redirigiendo al sistema de citas académicas...');
        // Aquí se integraría con el sistema de citas
    }

    createStudyPlan() {
        this.showInfo('Generando plan de estudio personalizado...');
        // Aquí se integraría con el generador de planes de estudio
    }

    requestSubjectSupport() {
        this.showInfo('Conectando con el sistema de tutorías...');
        // Aquí se integraría con el sistema de tutorías
    }

    // Métodos de notificación
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'danger');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(notification);

        // Auto-dismiss después de 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Solo inicializar si estamos en la página de estudiantes
    if (window.location.pathname.includes('estudiantes') || document.querySelector('.student-dashboard')) {
        window.gradesAnalytics = new AdvancedGradesAnalytics();
    }
});

// Exportar para uso global
window.AdvancedGradesAnalytics = AdvancedGradesAnalytics;