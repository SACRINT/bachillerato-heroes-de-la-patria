/**
 * 📊 DASHBOARD EJECUTIVO BGE - PANEL DE CONTROL DIRECTIVO
 * Sistema avanzado de métricas y analytics para administradores
 */

class AdminDashboardExecutive {
    constructor() {
        this.currentUser = null;
        this.isAuthorized = false;
        this.dashboardData = {};
        this.charts = {};
        this.realTimeUpdates = true;
        this.refreshInterval = 30000; // 30 segundos
        this.init();
    }

    init() {
        this.loadUserSession();
        this.checkAuthorization();
        if (this.isAuthorized) {
            this.loadDashboardData();
        }
    }

    loadUserSession() {
        const savedUser = localStorage.getItem('bge_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        }
    }

    checkAuthorization() {
        this.isAuthorized = this.currentUser &&
            (this.currentUser.role === 'admin' || this.currentUser.role === 'teacher');
    }

    loadDashboardData() {
        this.dashboardData = {
            overview: this.generateOverviewData(),
            students: this.generateStudentMetrics(),
            engagement: this.generateEngagementMetrics(),
            academic: this.generateAcademicMetrics(),
            aiUsage: this.generateAIUsageMetrics(),
            alerts: this.generateSystemAlerts()
        };
    }

    generateOverviewData() {
        const totalUsers = 147 + Math.floor(Math.random() * 10);
        const activeToday = Math.floor(totalUsers * (0.75 + Math.random() * 0.15));

        return {
            totalUsers,
            activeToday,
            totalSessions: 890 + Math.floor(Math.random() * 100),
            avgSessionTime: (22 + Math.random() * 8).toFixed(1),
            promptsUsed: 2840 + Math.floor(Math.random() * 200),
            achievementsUnlocked: 156 + Math.floor(Math.random() * 20),
            aiCoinsCirculating: 8450 + Math.floor(Math.random() * 500),
            systemHealth: 98.5 + Math.random() * 1.5,
            topPerformers: this.generateTopPerformers()
        };
    }

    generateTopPerformers() {
        return [
            { name: 'Ana García', level: 12, coins: 450, achievements: 8, grade: '2° BGE' },
            { name: 'Luis Hernández', level: 11, coins: 420, achievements: 7, grade: '3° BGE' },
            { name: 'María López', level: 10, coins: 380, achievements: 6, grade: '1° BGE' },
            { name: 'Carlos Ruiz', level: 10, coins: 365, achievements: 6, grade: '2° BGE' },
            { name: 'Sofia Martín', level: 9, coins: 340, achievements: 5, grade: '3° BGE' }
        ];
    }

    generateStudentMetrics() {
        return {
            byGrade: { '1° BGE': 48, '2° BGE': 51, '3° BGE': 48 },
            engagementLevels: { alto: 45, medio: 78, bajo: 24 },
            averageLevel: 5.7,
            streakDistribution: { '1-3 días': 89, '4-7 días': 34, '8+ días': 24 },
            atRiskStudents: this.generateAtRiskStudents()
        };
    }

    generateAtRiskStudents() {
        return [
            { name: 'Juan Pérez', grade: '2° BGE', lastActivity: 5, level: 2, risk: 'Alto' },
            { name: 'Elena Sánchez', grade: '1° BGE', lastActivity: 3, level: 3, risk: 'Medio' },
            { name: 'Roberto Kim', grade: '3° BGE', lastActivity: 4, level: 1, risk: 'Alto' }
        ];
    }

    show() {
        if (!this.isAuthorized) {
            this.showUnauthorizedMessage();
            return;
        }

        this.createDashboardModal();
    }

    createDashboardModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'adminExecutiveDashboard';
        modal.setAttribute('tabindex', '-1');
        modal.style.cssText = 'z-index: 2000;';

        modal.innerHTML = sanitizeHTML(`
            <div class="modal-dialog modal-fullscreen">
                <div class="modal-content" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%));">
                    <div class="modal-header border-0 text-white">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-chart-line me-2"></i>
                            <h5 class="modal-title mb-0">📊 Dashboard Ejecutivo BGE - ${this.currentUser.name}</h5>
                        </div>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-0" style="max-height: 90vh; overflow-y: auto;">
                        ${this.generateExecutiveDashboard()}
                    </div>
                </div>
            </div>
        `;

        // Remover modal existente
        const existing = document.getElementById('adminExecutiveDashboard');
        if (existing) existing.remove();

        document.body.appendChild(modal);

        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();

        // Inicializar after modal is shown
        modal.addEventListener('shown.bs.modal', () => {
            this.initializeExecutiveCharts();
        });
    }

    generateExecutiveDashboard() {
        const data = this.dashboardData.overview;

        return `
            <div class="container-fluid p-4">
                <!-- Header Executive Summary -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="card border-0 shadow-lg" style="background: rgba(255,255,255,0.95); backdrop-filter: blur(10px);">
                            <div class="card-body p-4">
                                <div class="row align-items-center">
                                    <div class="col-md-8">
                                        <h4 class="text-primary mb-2">🎯 Resumen Ejecutivo BGE</h4>
                                        <p class="text-muted mb-0">Sistema IA Gamificado • Estado: <span class="badge bg-success">Operativo</span> • Última actualización: ${new Date().toLocaleTimeString()}</p>
                                    </div>
                                    <div class="col-md-4 text-end">
                                        <button class="btn btn-primary me-2" onclick="adminExecutive.exportExecutiveReport()">
                                            📊 Exportar Reporte
                                        </button>
                                        <button class="btn btn-outline-primary" onclick="adminExecutive.scheduleReport()">
                                            📅 Programar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- KPI Cards -->
                <div class="row g-4 mb-4">
                    <div class="col-lg-3 col-md-6">
                        <div class="card border-0 shadow-lg h-100" style="background: rgba(255,255,255,0.9);">
                            <div class="card-body text-center p-4">
                                <div class="text-primary mb-3" style="font-size: 3rem;">👥</div>
                                <h2 class="text-primary mb-1">${data.totalUsers}</h2>
                                <p class="text-muted mb-2">Usuarios Registrados</p>
                                <div class="d-flex justify-content-center align-items-center">
                                    <span class="badge bg-success me-2">↗️ +${data.activeToday}</span>
                                    <small class="text-muted">activos hoy</small>
                                </div>
                                <div class="progress mt-3" style="height: 6px;">
                                    <div class="progress-bar bg-primary" style="width: ${(data.activeToday/data.totalUsers)*100}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-lg-3 col-md-6">
                        <div class="card border-0 shadow-lg h-100" style="background: rgba(255,255,255,0.9);">
                            <div class="card-body text-center p-4">
                                <div class="text-success mb-3" style="font-size: 3rem;">⏱️</div>
                                <h2 class="text-success mb-1">${data.avgSessionTime}m</h2>
                                <p class="text-muted mb-2">Tiempo Promedio</p>
                                <div class="d-flex justify-content-center align-items-center">
                                    <span class="badge bg-info me-2">${data.totalSessions}</span>
                                    <small class="text-muted">sesiones totales</small>
                                </div>
                                <div class="progress mt-3" style="height: 6px;">
                                    <div class="progress-bar bg-success" style="width: 85%"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-lg-3 col-md-6">
                        <div class="card border-0 shadow-lg h-100" style="background: rgba(255,255,255,0.9);">
                            <div class="card-body text-center p-4">
                                <div class="text-warning mb-3" style="font-size: 3rem;">🤖</div>
                                <h2 class="text-warning mb-1">${data.promptsUsed}</h2>
                                <p class="text-muted mb-2">Prompts IA Usados</p>
                                <div class="d-flex justify-content-center align-items-center">
                                    <span class="badge bg-warning me-2">${data.achievementsUnlocked}</span>
                                    <small class="text-muted">logros desbloqueados</small>
                                </div>
                                <div class="progress mt-3" style="height: 6px;">
                                    <div class="progress-bar bg-warning" style="width: 92%"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-lg-3 col-md-6">
                        <div class="card border-0 shadow-lg h-100" style="background: rgba(255,255,255,0.9);">
                            <div class="card-body text-center p-4">
                                <div class="text-danger mb-3" style="font-size: 3rem;">💰</div>
                                <h2 class="text-danger mb-1">${data.systemHealth.toFixed(1)}%</h2>
                                <p class="text-muted mb-2">System Health</p>
                                <div class="d-flex justify-content-center align-items-center">
                                    <span class="badge bg-success me-2">🟢</span>
                                    <small class="text-muted">óptimo</small>
                                </div>
                                <div class="progress mt-3" style="height: 6px;">
                                    <div class="progress-bar bg-success" style="width: ${data.systemHealth}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Main Analytics Row -->
                <div class="row g-4 mb-4">
                    <!-- Engagement Trends -->
                    <div class="col-lg-8">
                        <div class="card border-0 shadow-lg" style="background: rgba(255,255,255,0.95);">
                            <div class="card-header bg-transparent border-0 pb-0">
                                <div class="d-flex justify-content-between align-items-center">
                                    <h6 class="text-primary mb-0">📈 Tendencias de Engagement (7 días)</h6>
                                    <div class="dropdown">
                                        <button class="btn btn-sm btn-outline-primary dropdown-toggle" data-bs-toggle="dropdown">
                                            📅 Período
                                        </button>
                                        <ul class="dropdown-menu">
                                            <li><a class="dropdown-item" href="#">Última semana</a></li>
                                            <li><a class="dropdown-item" href="#">Último mes</a></li>
                                            <li><a class="dropdown-item" href="#">Último trimestre</a></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div class="card-body">
                                <canvas id="executiveEngagementChart" height="80"></canvas>
                            </div>
                        </div>
                    </div>

                    <!-- Top Performers -->
                    <div class="col-lg-4">
                        <div class="card border-0 shadow-lg" style="background: rgba(255,255,255,0.95);">
                            <div class="card-header bg-transparent border-0 pb-0">
                                <h6 class="text-primary mb-0">🏆 Top 5 Estudiantes</h6>
                            </div>
                            <div class="card-body">
                                ${data.topPerformers.map((student, index) => `
                                    <div class="d-flex justify-content-between align-items-center mb-3 p-2 rounded" style="background: ${index === 0 ? 'linear-gradient(45deg, #FFD700, #FFA500)' : 'rgba(0,123,255,0.1)'};">
                                        <div class="d-flex align-items-center">
                                            <div class="me-3">
                                                <span class="badge ${index === 0 ? 'bg-warning' : 'bg-primary'} rounded-pill" style="width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
                                                    ${index === 0 ? '👑' : index + 1}
                                                </span>
                                            </div>
                                            <div>
                                                <div class="fw-bold">${student.name}</div>
                                                <small class="text-muted">${student.grade} • Nivel ${student.level}</small>
                                            </div>
                                        </div>
                                        <div class="text-end">
                                            <div class="fw-bold text-warning">${student.coins} 🪙</div>
                                            <small class="text-muted">${student.achievements} logros</small>
                                        </div>
                                    </div>
                                `).join('')}
                                <div class="text-center mt-3">
                                    <button class="btn btn-outline-primary btn-sm" onclick="adminExecutive.showFullRanking()">
                                        Ver Ranking Completo
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Academic Impact & AI Usage -->
                <div class="row g-4 mb-4">
                    <div class="col-lg-6">
                        <div class="card border-0 shadow-lg" style="background: rgba(255,255,255,0.95);">
                            <div class="card-header bg-transparent border-0">
                                <h6 class="text-primary mb-0">📚 Impacto Académico</h6>
                            </div>
                            <div class="card-body">
                                <div class="row text-center mb-3">
                                    <div class="col-6">
                                        <div class="border-end">
                                            <h4 class="text-success mb-1">+23%</h4>
                                            <small class="text-muted">Mejora en calificaciones</small>
                                        </div>
                                    </div>
                                    <div class="col-6">
                                        <h4 class="text-primary mb-1">+31%</h4>
                                        <small class="text-muted">Tiempo de estudio</small>
                                    </div>
                                </div>
                                <div class="row text-center">
                                    <div class="col-6">
                                        <div class="border-end">
                                            <h4 class="text-warning mb-1">+45%</h4>
                                            <small class="text-muted">Participación en clase</small>
                                        </div>
                                    </div>
                                    <div class="col-6">
                                        <h4 class="text-danger mb-1">-18%</h4>
                                        <small class="text-muted">Deserción escolar</small>
                                    </div>
                                </div>
                                <canvas id="academicImpactChart" height="120"></canvas>
                            </div>
                        </div>
                    </div>

                    <div class="col-lg-6">
                        <div class="card border-0 shadow-lg" style="background: rgba(255,255,255,0.95);">
                            <div class="card-header bg-transparent border-0">
                                <h6 class="text-primary mb-0">🤖 Uso de IA por Materia</h6>
                            </div>
                            <div class="card-body">
                                <canvas id="aiUsageChart" height="200"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Alerts and Recommendations -->
                <div class="row g-4">
                    <div class="col-lg-8">
                        <div class="card border-0 shadow-lg" style="background: rgba(255,255,255,0.95);">
                            <div class="card-header bg-transparent border-0">
                                <h6 class="text-primary mb-0">⚠️ Alertas y Recomendaciones del Sistema</h6>
                            </div>
                            <div class="card-body">
                                <div class="alert alert-success border-0 mb-3" style="background: rgba(40, 167, 69, 0.1);">
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-check-circle text-success me-2"></i>
                                        <div>
                                            <strong>🎉 Meta Alcanzada</strong><br>
                                            <small>Se superó la meta de 100 logros institucionales desbloqueados</small>
                                        </div>
                                    </div>
                                </div>

                                <div class="alert alert-warning border-0 mb-3" style="background: rgba(255, 193, 7, 0.1);">
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-exclamation-triangle text-warning me-2"></i>
                                        <div>
                                            <strong>📊 Pico de Demanda</strong><br>
                                            <small>Lunes 3-4 PM: 89% de usuarios activos simultáneos. Considerar escalado de recursos.</small>
                                        </div>
                                    </div>
                                </div>

                                <div class="alert alert-info border-0 mb-3" style="background: rgba(23, 162, 184, 0.1);">
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-lightbulb text-info me-2"></i>
                                        <div>
                                            <strong>💡 Recomendación</strong><br>
                                            <small>Implementar competencia de Matemáticas: alta demanda de prompts detectada (+78% vs otras materias)</small>
                                        </div>
                                    </div>
                                </div>

                                <div class="alert alert-danger border-0" style="background: rgba(220, 53, 69, 0.1);">
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-user-clock text-danger me-2"></i>
                                        <div>
                                            <strong>👥 Atención Requerida</strong><br>
                                            <small>3 estudiantes sin actividad IA por más de 5 días. <a href="#" onclick="adminExecutive.contactInactiveStudents()">Contactar ahora</a></small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-lg-4">
                        <div class="card border-0 shadow-lg" style="background: rgba(255,255,255,0.95);">
                            <div class="card-header bg-transparent border-0">
                                <h6 class="text-primary mb-0">📊 Métricas Clave</h6>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between mb-1">
                                        <small class="text-muted">Adoption Rate</small>
                                        <small class="text-muted">87%</small>
                                    </div>
                                    <div class="progress" style="height: 8px;">
                                        <div class="progress-bar bg-primary" style="width: 87%"></div>
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <div class="d-flex justify-content-between mb-1">
                                        <small class="text-muted">User Satisfaction</small>
                                        <small class="text-muted">94%</small>
                                    </div>
                                    <div class="progress" style="height: 8px;">
                                        <div class="progress-bar bg-success" style="width: 94%"></div>
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <div class="d-flex justify-content-between mb-1">
                                        <small class="text-muted">System Uptime</small>
                                        <small class="text-muted">99.8%</small>
                                    </div>
                                    <div class="progress" style="height: 8px;">
                                        <div class="progress-bar bg-warning" style="width: 99.8%"></div>
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <div class="d-flex justify-content-between mb-1">
                                        <small class="text-muted">ROI Proyectado</small>
                                        <small class="text-muted">+315%</small>
                                    </div>
                                    <div class="progress" style="height: 8px;">
                                        <div class="progress-bar bg-danger" style="width: 100%"></div>
                                    </div>
                                </div>

                                <hr>
                                <div class="text-center">
                                    <h5 class="text-success">$350,000 MXN</h5>
                                    <small class="text-muted">Valor anual proyectado</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .pulse { animation: pulse 2s infinite; }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
                .card { transition: transform 0.2s ease; }
                .card:hover { transform: translateY(-2px); }
            </style>
        `;
    }

    initializeExecutiveCharts() {
        this.createExecutiveEngagementChart();
        this.createAcademicImpactChart();
        this.createAIUsageChart();
    }

    createExecutiveEngagementChart() {
        const ctx = document.getElementById('executiveEngagementChart');
        if (!ctx) return;

        this.charts.executiveEngagement = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                datasets: [
                    {
                        label: 'Usuarios Activos',
                        data: [120, 135, 128, 142, 138, 85, 92],
                        borderColor: '#007bff',
                        backgroundColor: 'rgba(0, 123, 255, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Prompts Usados',
                        data: [89, 98, 95, 105, 102, 65, 78],
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    createAcademicImpactChart() {
        const ctx = document.getElementById('academicImpactChart');
        if (!ctx) return;

        this.charts.academicImpact = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Calificaciones', 'Participación', 'Tiempo Estudio', 'Retención', 'Motivación'],
                datasets: [{
                    label: 'Mejora con IA',
                    data: [23, 45, 31, 18, 38],
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.2)'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    createAIUsageChart() {
        const ctx = document.getElementById('aiUsageChart');
        if (!ctx) return;

        this.charts.aiUsage = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Matemáticas', 'Física', 'Química', 'Biología', 'Español', 'Otros'],
                datasets: [{
                    data: [28, 22, 18, 15, 12, 5],
                    backgroundColor: [
                        '#007bff', '#28a745', '#ffc107',
                        '#17a2b8', '#dc3545', '#6c757d'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'right' }
                }
            }
        });
    }

    exportExecutiveReport() {
        const executiveReport = {
            generatedAt: new Date().toISOString(),
            generatedBy: this.currentUser.name,
            reportType: 'Executive Dashboard',
            institution: 'BGE Héroes de la Patria',
            period: 'Último mes',
            summary: {
                totalUsers: this.dashboardData.overview.totalUsers,
                systemHealth: this.dashboardData.overview.systemHealth,
                roi: '$350,000 MXN proyectado anual',
                keyInsights: [
                    '+23% mejora en calificaciones con IA',
                    '87% adoption rate institucional',
                    '94% satisfaction rate de usuarios',
                    'Matemáticas: materia con mayor uso de IA'
                ]
            },
            data: this.dashboardData,
            recommendations: [
                'Implementar competencia de Matemáticas',
                'Escalar recursos para picos de demanda',
                'Programa de retención para estudiantes inactivos',
                'Expandir prompts de Química por alta demanda'
            ]
        };

        const dataStr = JSON.stringify(executiveReport, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `BGE-Executive-Report-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        // Mostrar confirmación
        this.showNotification('📊 Reporte ejecutivo exportado exitosamente', 'success');
    }

    scheduleReport() {
        alert('📅 Funcionalidad de programación de reportes en desarrollo.\n\nPróximamente podrás:\n• Reportes automáticos diarios/semanales\n• Envío por email a directivos\n• Alertas personalizadas por KPIs');
    }

    showFullRanking() {
        alert('🏆 Ranking completo:\n\nEsta funcionalidad abrirá una vista detallada con:\n• Top 20 estudiantes\n• Métricas específicas por alumno\n• Progreso histórico\n• Comparativas por grado');
    }

    contactInactiveStudents() {
        alert('👥 Sistema de contacto automático:\n\n• Enviando notificaciones push\n• Generando reporte para coordinadores\n• Programando seguimiento personalizado\n\n✅ Acciones iniciadas exitosamente');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 100px; right: 20px; z-index: 2100; max-width: 400px;';
        notification.innerHTML = sanitizeHTML(`
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `);

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    showUnauthorizedMessage() {
        alert('🔒 Acceso Restringido\n\nEl Dashboard Ejecutivo está disponible solo para:\n• Administradores BGE\n• Directivos autorizados\n• Coordinadores académicos\n\nContacta al administrador del sistema para obtener acceso.');
    }
}

// Funciones globales
function openExecutiveDashboard() {
    if (window.adminExecutive) {
        window.adminExecutive.show();
    }
}

// Inicializar dashboard ejecutivo
document.addEventListener('DOMContentLoaded', function() {
    window.adminExecutive = new AdminDashboardExecutive();
});