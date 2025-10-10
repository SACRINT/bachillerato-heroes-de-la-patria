// ========================================
// SISTEMA DE MÉTRICAS AVANZADAS 2025
// ========================================
console.log('📊 [STARTUP] advanced-metrics-system.js INICIANDO - VERSIÓN 2025-09-21');

class AdvancedMetricsSystem {
    constructor() {
        console.log('🏗️ [METRICS] Iniciando Sistema de Métricas Avanzadas...');
        this.metricsData = {};
        this.kpiWidgets = new Map();
        this.realTimeUpdates = true;
        this.updateInterval = null;
        this.chartInstances = new Map();

        this.init();
    }

    async init() {
        console.log('🔄 [METRICS] Inicializando métricas avanzadas...');
        await this.loadAdvancedMetrics();
        this.createExecutiveWidgets();
        this.startRealTimeUpdates();
        console.log('✅ [METRICS] Sistema de métricas avanzadas inicializado');
    }

    async loadAdvancedMetrics() {
        console.log('📈 [METRICS] Cargando métricas avanzadas...');

        // Simular datos en tiempo real (en producción sería desde API/DB)
        this.metricsData = {
            institutional: {
                efficiency: this.calculateEfficiency(),
                satisfaction: this.calculateSatisfaction(),
                retention: this.calculateRetention(),
                performance: this.calculatePerformance()
            },
            academic: {
                passRate: this.calculatePassRate(),
                averageGrowth: this.calculateAverageGrowth(),
                attendanceRate: this.calculateAttendanceRate(),
                homeworkCompletion: this.calculateHomeworkCompletion()
            },
            operational: {
                resourceUtilization: this.calculateResourceUtilization(),
                costPerStudent: this.calculateCostPerStudent(),
                staffProductivity: this.calculateStaffProductivity(),
                digitalAdoption: this.calculateDigitalAdoption()
            },
            realTime: {
                activeUsers: this.getCurrentActiveUsers(),
                systemLoad: this.getSystemLoad(),
                responseTime: this.getResponseTime(),
                errorRate: this.getErrorRate()
            }
        };

        console.log('📊 [METRICS] Métricas cargadas:', this.metricsData);
    }

    createExecutiveWidgets() {
        console.log('🎨 [WIDGETS] Creando widgets ejecutivos...');

        const widgetsContainer = document.getElementById('executive-widgets');
        if (!widgetsContainer) {
            console.warn('⚠️ [WIDGETS] Contenedor executive-widgets no encontrado');
            return;
        }

        // Limpiar contenedor
        widgetsContainer.innerHTML = '';

        const widgets = [
            this.createKPIWidget('institutional-efficiency', 'Eficiencia Institucional',
                this.metricsData.institutional.efficiency, '%', 'success', 'fa-chart-line'),

            this.createKPIWidget('student-satisfaction', 'Satisfacción Estudiantil',
                this.metricsData.institutional.satisfaction, '%', 'info', 'fa-smile'),

            this.createKPIWidget('academic-performance', 'Rendimiento Académico',
                this.metricsData.institutional.performance, '', 'warning', 'fa-graduation-cap'),

            this.createKPIWidget('retention-rate', 'Tasa de Retención',
                this.metricsData.institutional.retention, '%', 'primary', 'fa-users'),

            this.createRealtimeWidget('active-users', 'Usuarios Activos',
                this.metricsData.realTime.activeUsers, '', 'success', 'fa-user-clock'),

            this.createTrendWidget('academic-trend', 'Tendencia Académica',
                this.metricsData.academic, 'info', 'fa-trending-up'),

            this.createOperationalWidget('operational-metrics', 'Métricas Operacionales',
                this.metricsData.operational, 'secondary', 'fa-cogs'),

            this.createSystemHealthWidget('system-health', 'Estado del Sistema',
                this.metricsData.realTime, 'dark', 'fa-heartbeat')
        ];

        widgets.forEach(widget => {
            widgetsContainer.appendChild(widget);
        });

        // Crear gráficos avanzados
        setTimeout(() => {
            this.createAdvancedCharts();
        }, 500);
    }

    createKPIWidget(id, title, value, unit, color, icon) {
        const widget = document.createElement('div');
        widget.className = 'col-xl-3 col-lg-4 col-md-6 mb-4';
        widget.innerHTML = `
            <div class="card border-0 shadow-sm h-100 kpi-widget" data-widget-id="${id}">
                <div class="card-body p-4">
                    <div class="d-flex align-items-center justify-content-between mb-3">
                        <div class="widget-icon bg-${color} bg-opacity-10 rounded-circle p-3">
                            <i class="fas ${icon} text-${color} fs-4"></i>
                        </div>
                        <div class="dropdown">
                            <button class="btn btn-sm btn-link text-muted" data-bs-toggle="dropdown">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li><a class="dropdown-item" href="#" onclick="advancedMetrics.refreshWidget('${id}')">
                                    <i class="fas fa-sync-alt me-2"></i>Actualizar
                                </a></li>
                                <li><a class="dropdown-item" href="#" onclick="advancedMetrics.exportWidget('${id}')">
                                    <i class="fas fa-download me-2"></i>Exportar
                                </a></li>
                            </ul>
                        </div>
                    </div>
                    <h3 class="text-${color} mb-1 widget-value" id="${id}-value">${value}${unit}</h3>
                    <p class="text-muted mb-2 small">${title}</p>
                    <div class="progress" style="height: 4px;">
                        <div class="progress-bar bg-${color}" style="width: ${Math.min(value, 100)}%"></div>
                    </div>
                    <small class="text-muted mt-2 d-block">
                        <i class="fas fa-clock me-1"></i>Actualizado: <span class="update-time">ahora</span>
                    </small>
                </div>
            </div>
        `;
        return widget;
    }

    createRealtimeWidget(id, title, value, unit, color, icon) {
        const widget = document.createElement('div');
        widget.className = 'col-xl-3 col-lg-4 col-md-6 mb-4';
        widget.innerHTML = `
            <div class="card border-0 shadow-sm h-100 realtime-widget" data-widget-id="${id}">
                <div class="card-body p-4">
                    <div class="d-flex align-items-center justify-content-between mb-3">
                        <div class="widget-icon bg-${color} bg-opacity-10 rounded-circle p-3 position-relative">
                            <i class="fas ${icon} text-${color} fs-4"></i>
                            <span class="position-absolute top-0 start-100 translate-middle p-1 bg-${color} border border-light rounded-circle pulse-animation">
                                <span class="visually-hidden">Live</span>
                            </span>
                        </div>
                        <span class="badge bg-${color} bg-opacity-10 text-${color} px-3 py-2">LIVE</span>
                    </div>
                    <h3 class="text-${color} mb-1 widget-value" id="${id}-value">${value}${unit}</h3>
                    <p class="text-muted mb-2 small">${title}</p>
                    <div class="d-flex align-items-center">
                        <div class="mini-chart flex-grow-1" id="${id}-chart" style="height: 30px;"></div>
                    </div>
                    <small class="text-muted mt-2 d-block">
                        <i class="fas fa-circle text-${color} me-1 blink"></i>En vivo
                    </small>
                </div>
            </div>
        `;
        return widget;
    }

    createTrendWidget(id, title, data, color, icon) {
        const widget = document.createElement('div');
        widget.className = 'col-xl-6 col-lg-8 col-md-12 mb-4';

        const trendValue = this.calculateTrend(data);
        const trendIcon = trendValue > 0 ? 'fa-arrow-up text-success' : 'fa-arrow-down text-danger';

        widget.innerHTML = `
            <div class="card border-0 shadow-sm h-100 trend-widget" data-widget-id="${id}">
                <div class="card-header bg-transparent border-0 pb-0">
                    <div class="d-flex align-items-center justify-content-between">
                        <h6 class="mb-0 text-${color}">
                            <i class="fas ${icon} me-2"></i>${title}
                        </h6>
                        <div class="d-flex align-items-center">
                            <span class="me-2 small text-muted">Tendencia:</span>
                            <i class="fas ${trendIcon} me-1"></i>
                            <span class="small fw-bold">${Math.abs(trendValue).toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
                <div class="card-body pt-2">
                    <canvas id="${id}-chart" height="120"></canvas>
                    <div class="row mt-3">
                        <div class="col-3 text-center">
                            <small class="text-muted d-block">Aprobación</small>
                            <strong class="text-success">${data.passRate}%</strong>
                        </div>
                        <div class="col-3 text-center">
                            <small class="text-muted d-block">Crecimiento</small>
                            <strong class="text-info">${data.averageGrowth}%</strong>
                        </div>
                        <div class="col-3 text-center">
                            <small class="text-muted d-block">Asistencia</small>
                            <strong class="text-warning">${data.attendanceRate}%</strong>
                        </div>
                        <div class="col-3 text-center">
                            <small class="text-muted d-block">Tareas</small>
                            <strong class="text-primary">${data.homeworkCompletion}%</strong>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return widget;
    }

    createOperationalWidget(id, title, data, color, icon) {
        const widget = document.createElement('div');
        widget.className = 'col-xl-6 col-lg-8 col-md-12 mb-4';
        widget.innerHTML = `
            <div class="card border-0 shadow-sm h-100 operational-widget" data-widget-id="${id}">
                <div class="card-header bg-transparent border-0 pb-0">
                    <h6 class="mb-0 text-${color}">
                        <i class="fas ${icon} me-2"></i>${title}
                    </h6>
                </div>
                <div class="card-body pt-2">
                    <div class="row g-3">
                        <div class="col-6">
                            <div class="p-3 bg-light rounded">
                                <div class="d-flex align-items-center justify-content-between mb-2">
                                    <small class="text-muted">Utilización Recursos</small>
                                    <i class="fas fa-chart-pie text-primary"></i>
                                </div>
                                <h5 class="mb-0 text-primary">${data.resourceUtilization}%</h5>
                                <div class="progress mt-2" style="height: 3px;">
                                    <div class="progress-bar bg-primary" style="width: ${data.resourceUtilization}%"></div>
                                </div>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="p-3 bg-light rounded">
                                <div class="d-flex align-items-center justify-content-between mb-2">
                                    <small class="text-muted">Costo por Estudiante</small>
                                    <i class="fas fa-dollar-sign text-success"></i>
                                </div>
                                <h5 class="mb-0 text-success">$${data.costPerStudent}</h5>
                                <small class="text-muted">mensual</small>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="p-3 bg-light rounded">
                                <div class="d-flex align-items-center justify-content-between mb-2">
                                    <small class="text-muted">Productividad Staff</small>
                                    <i class="fas fa-users-cog text-info"></i>
                                </div>
                                <h5 class="mb-0 text-info">${data.staffProductivity}%</h5>
                                <div class="progress mt-2" style="height: 3px;">
                                    <div class="progress-bar bg-info" style="width: ${data.staffProductivity}%"></div>
                                </div>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="p-3 bg-light rounded">
                                <div class="d-flex align-items-center justify-content-between mb-2">
                                    <small class="text-muted">Adopción Digital</small>
                                    <i class="fas fa-laptop text-warning"></i>
                                </div>
                                <h5 class="mb-0 text-warning">${data.digitalAdoption}%</h5>
                                <div class="progress mt-2" style="height: 3px;">
                                    <div class="progress-bar bg-warning" style="width: ${data.digitalAdoption}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return widget;
    }

    createSystemHealthWidget(id, title, data, color, icon) {
        const widget = document.createElement('div');
        widget.className = 'col-xl-12 col-lg-12 col-md-12 mb-4';

        const healthStatus = this.calculateSystemHealth(data);
        const statusColor = healthStatus > 90 ? 'success' : healthStatus > 70 ? 'warning' : 'danger';

        widget.innerHTML = `
            <div class="card border-0 shadow-sm h-100 system-health-widget" data-widget-id="${id}">
                <div class="card-header bg-transparent border-0 pb-0">
                    <div class="d-flex align-items-center justify-content-between">
                        <h6 class="mb-0 text-${color}">
                            <i class="fas ${icon} me-2"></i>${title}
                        </h6>
                        <div class="d-flex align-items-center">
                            <span class="badge bg-${statusColor} me-2">
                                <i class="fas fa-circle me-1"></i>
                                ${healthStatus > 90 ? 'EXCELENTE' : healthStatus > 70 ? 'BUENO' : 'CRÍTICO'}
                            </span>
                            <span class="h5 mb-0 text-${statusColor}">${healthStatus}%</span>
                        </div>
                    </div>
                </div>
                <div class="card-body pt-2">
                    <div class="row g-3">
                        <div class="col-md-3 col-6">
                            <div class="text-center p-3 border rounded">
                                <h4 class="text-success mb-1">${data.activeUsers}</h4>
                                <small class="text-muted">Usuarios Activos</small>
                                <div class="mt-2">
                                    <i class="fas fa-circle text-success blink"></i>
                                    <small class="text-success ms-1">Online</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 col-6">
                            <div class="text-center p-3 border rounded">
                                <h4 class="text-info mb-1">${data.systemLoad}%</h4>
                                <small class="text-muted">Carga del Sistema</small>
                                <div class="progress mt-2" style="height: 4px;">
                                    <div class="progress-bar bg-info" style="width: ${data.systemLoad}%"></div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 col-6">
                            <div class="text-center p-3 border rounded">
                                <h4 class="text-warning mb-1">${data.responseTime}ms</h4>
                                <small class="text-muted">Tiempo Respuesta</small>
                                <div class="mt-2">
                                    <small class="text-${data.responseTime < 200 ? 'success' : 'warning'}">
                                        ${data.responseTime < 200 ? 'Rápido' : 'Normal'}
                                    </small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 col-6">
                            <div class="text-center p-3 border rounded">
                                <h4 class="text-${data.errorRate < 1 ? 'success' : 'danger'} mb-1">${data.errorRate}%</h4>
                                <small class="text-muted">Tasa de Error</small>
                                <div class="mt-2">
                                    <small class="text-${data.errorRate < 1 ? 'success' : 'danger'}">
                                        ${data.errorRate < 1 ? 'Excelente' : 'Revisar'}
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return widget;
    }

    // Métodos de cálculo de métricas
    calculateEfficiency() {
        const base = 85;
        return Math.round(base + (Math.random() * 10 - 5));
    }

    calculateSatisfaction() {
        const base = 92;
        return Math.round(base + (Math.random() * 6 - 3));
    }

    calculateRetention() {
        const base = 96;
        return Math.round(base + (Math.random() * 4 - 2));
    }

    calculatePerformance() {
        const base = 8.4;
        return (base + (Math.random() * 0.6 - 0.3)).toFixed(1);
    }

    calculatePassRate() {
        return Math.round(87 + (Math.random() * 8 - 4));
    }

    calculateAverageGrowth() {
        return (2.5 + (Math.random() * 2 - 1)).toFixed(1);
    }

    calculateAttendanceRate() {
        return Math.round(94 + (Math.random() * 4 - 2));
    }

    calculateHomeworkCompletion() {
        return Math.round(89 + (Math.random() * 6 - 3));
    }

    calculateResourceUtilization() {
        return Math.round(78 + (Math.random() * 15 - 7));
    }

    calculateCostPerStudent() {
        return Math.round(2850 + (Math.random() * 200 - 100));
    }

    calculateStaffProductivity() {
        return Math.round(91 + (Math.random() * 6 - 3));
    }

    calculateDigitalAdoption() {
        return Math.round(83 + (Math.random() * 10 - 5));
    }

    getCurrentActiveUsers() {
        return Math.round(156 + (Math.random() * 20 - 10));
    }

    getSystemLoad() {
        return Math.round(35 + (Math.random() * 20 - 10));
    }

    getResponseTime() {
        return Math.round(120 + (Math.random() * 80 - 40));
    }

    getErrorRate() {
        return (0.2 + (Math.random() * 0.3)).toFixed(1);
    }

    calculateTrend(data) {
        const values = Object.values(data).filter(v => typeof v === 'number');
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        return (avg - 85) / 85 * 100; // Comparar con baseline del 85%
    }

    calculateSystemHealth(data) {
        const loadScore = 100 - data.systemLoad;
        const responseScore = data.responseTime < 200 ? 100 : Math.max(50, 100 - (data.responseTime - 200) / 10);
        const errorScore = 100 - (data.errorRate * 20);

        return Math.round((loadScore + responseScore + errorScore) / 3);
    }

    // Métodos de gestión
    startRealTimeUpdates() {
        console.log('⏰ [METRICS] Iniciando actualizaciones en tiempo real...');

        this.updateInterval = setInterval(() => {
            this.updateRealTimeMetrics();
        }, 30000); // Actualizar cada 30 segundos
    }

    async updateRealTimeMetrics() {
        if (!this.realTimeUpdates) return;

        console.log('🔄 [METRICS] Actualizando métricas en tiempo real...');

        // Actualizar datos
        await this.loadAdvancedMetrics();

        // Actualizar widgets existentes
        this.updateWidgetValues();

        // Actualizar timestamps
        this.updateTimestamps();
    }

    updateWidgetValues() {
        // Actualizar valores en los widgets existentes
        const widgets = document.querySelectorAll('[data-widget-id]');

        widgets.forEach(widget => {
            const widgetId = widget.dataset.widgetId;
            const valueElement = widget.querySelector('.widget-value');

            if (valueElement && this.getMetricValue(widgetId)) {
                valueElement.textContent = this.getMetricValue(widgetId);

                // Añadir efecto de actualización
                valueElement.classList.add('updating');
                setTimeout(() => {
                    valueElement.classList.remove('updating');
                }, 500);
            }
        });
    }

    updateTimestamps() {
        const timeElements = document.querySelectorAll('.update-time');
        const now = new Date().toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });

        timeElements.forEach(el => {
            el.textContent = now;
        });
    }

    getMetricValue(widgetId) {
        const metrics = {
            'institutional-efficiency': `${this.metricsData.institutional.efficiency}%`,
            'student-satisfaction': `${this.metricsData.institutional.satisfaction}%`,
            'academic-performance': this.metricsData.institutional.performance,
            'retention-rate': `${this.metricsData.institutional.retention}%`,
            'active-users': this.metricsData.realTime.activeUsers
        };

        return metrics[widgetId];
    }

    // Métodos de acción de widgets
    refreshWidget(widgetId) {
        console.log(`🔄 [WIDGET] Actualizando widget: ${widgetId}`);
        this.updateRealTimeMetrics();
    }

    exportWidget(widgetId) {
        console.log(`📊 [EXPORT] Exportando widget: ${widgetId}`);

        const widgetData = {
            id: widgetId,
            timestamp: new Date().toISOString(),
            data: this.metricsData
        };

        const blob = new Blob([JSON.stringify(widgetData, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `metrics-${widgetId}-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('Datos exportados exitosamente', 'success');
    }

    createAdvancedCharts() {
        // Crear gráfico de tendencia académica
        this.createTrendChart();
    }

    createTrendChart() {
        const canvas = document.getElementById('academic-trend-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Destruir gráfico existente si existe
        if (this.chartInstances.has('academic-trend')) {
            this.chartInstances.get('academic-trend').destroy();
        }

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep'],
                datasets: [{
                    label: 'Aprobación %',
                    data: [85, 87, 89, 88, 91, 89, 92, 90, 87],
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Asistencia %',
                    data: [92, 94, 93, 95, 94, 96, 95, 94, 94],
                    borderColor: '#ffc107',
                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 80,
                        max: 100,
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });

        this.chartInstances.set('academic-trend', chart);
    }

    showNotification(message, type = 'info') {
        // Crear notificación toast
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        // Agregar al contenedor de toasts
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            toastContainer.style.zIndex = '9999';
            document.body.appendChild(toastContainer);
        }

        toastContainer.appendChild(toast);

        // Mostrar toast
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();

        // Remover del DOM después de que se oculte
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    // Métodos de destrucción
    destroy() {
        console.log('🗑️ [METRICS] Destruyendo sistema de métricas...');

        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        // Destruir gráficos
        this.chartInstances.forEach(chart => chart.destroy());
        this.chartInstances.clear();

        this.realTimeUpdates = false;

        console.log('✅ [METRICS] Sistema de métricas destruido');
    }
}

// CSS adicional para animaciones
const additionalCSS = `
<style>
.pulse-animation {
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% {
        box-shadow: 0 0 0 0 rgba(var(--bs-success-rgb), 0.7);
    }
    70% {
        box-shadow: 0 0 0 10px rgba(var(--bs-success-rgb), 0);
    }
    100% {
        box-shadow: 0 0 0 0 rgba(var(--bs-success-rgb), 0);
    }
}

.blink {
    animation: blink 1.5s infinite;
}

@keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0.3; }
}

.updating {
    animation: highlight 0.5s ease;
}

@keyframes highlight {
    0% { background-color: rgba(var(--bs-primary-rgb), 0.1); }
    100% { background-color: transparent; }
}

.kpi-widget:hover, .realtime-widget:hover, .trend-widget:hover,
.operational-widget:hover, .system-health-widget:hover {
    transform: translateY(-2px);
    transition: transform 0.2s ease;
}

.widget-icon {
    transition: transform 0.2s ease;
}

.kpi-widget:hover .widget-icon {
    transform: scale(1.1);
}
</style>
`;

// Inyectar CSS
document.head.insertAdjacentHTML('beforeend', additionalCSS);

// Instancia global
let advancedMetrics = null;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si estamos en el dashboard de administración
    if (document.getElementById('executive-widgets') || window.location.pathname.includes('admin-dashboard')) {
        console.log('📊 [INIT] Inicializando sistema de métricas avanzadas...');
        advancedMetrics = new AdvancedMetricsSystem();
    }
});

// Exportar para uso global
window.AdvancedMetricsSystem = AdvancedMetricsSystem;
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedMetricsSystem;
}

console.log('✅ [STARTUP] advanced-metrics-system.js CARGADO COMPLETAMENTE');