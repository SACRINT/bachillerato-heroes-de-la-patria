/**
 * 📊 AI PROGRESS DASHBOARD - FASE 5.3
 * Dashboard inteligente de progreso educativo para BGE Héroes de la Patria
 * Análisis visual del desempeño académico con IA
 */

class AIProgressDashboard {
    constructor() {
        this.userId = null;
        this.progressData = {};
        this.recommendations = [];
        this.aiInsights = {};
        this.charts = {};
        this.realTimeUpdates = true;

        this.config = {
            enableRealTimeUpdates: true,
            enablePredictiveAnalytics: true,
            enableComparisonMode: true,
            enableGoalSetting: true,
            enableAchievements: true,
            updateInterval: 30000 // 30 segundos
        };

        this.chartColors = {
            primary: '#1976D2',
            secondary: '#FFC107',
            success: '#4CAF50',
            danger: '#F44336',
            warning: '#FF9800',
            info: '#00BCD4',
            light: '#F8F9FA',
            dark: '#343A40'
        };

        this.init();
    }

    async init() {
        await this.loadDependencies();
        await this.initializeUser();
        this.createDashboardInterface();
        this.loadProgressData();
        this.startRealTimeUpdates();

        console.log('📊 AI Progress Dashboard inicializado');
    }

    async loadDependencies() {
        // Cargar Chart.js si no está disponible
        if (typeof Chart === 'undefined') {
            await this.loadScript('https://cdn.jsdelivr.net/npm/chart.js');
        }

        // Esperar a que los sistemas AI estén disponibles
        const maxAttempts = 10;
        let attempts = 0;

        while (attempts < maxAttempts) {
            if (window.aiEducationalSystem && window.aiRecommendationEngine) {
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
        }
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async initializeUser() {
        this.userId = this.getCurrentUserId();

        // Cargar datos del usuario desde diferentes fuentes
        await this.loadUserData();
        await this.loadAcademicData();
        await this.loadBehaviorData();
    }

    getCurrentUserId() {
        // Intentar obtener del sistema de autenticación
        if (window.currentUser && window.currentUser.id) {
            return window.currentUser.id;
        }

        // Intentar obtener del localStorage
        const userData = localStorage.getItem('userData');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                return user.id || user.google_id || user.email;
            } catch (error) {
                console.warn('Error parsing user data:', error);
            }
        }

        // Generar ID temporal
        let sessionId = localStorage.getItem('ai_dashboard_user_id');
        if (!sessionId) {
            sessionId = 'dashboard_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('ai_dashboard_user_id', sessionId);
        }

        return sessionId;
    }

    async loadUserData() {
        const savedData = localStorage.getItem(`ai_progress_${this.userId}`);
        if (savedData) {
            try {
                this.progressData = JSON.parse(savedData);
            } catch (error) {
                console.warn('Error loading saved progress data:', error);
                this.progressData = this.createDefaultProgressData();
            }
        } else {
            this.progressData = this.createDefaultProgressData();
        }
    }

    createDefaultProgressData() {
        return {
            userId: this.userId,
            createdAt: Date.now(),
            lastUpdated: Date.now(),
            academic: {
                subjects: {
                    matematicas: { score: 85, progress: 75, trend: 'up' },
                    ciencias: { score: 78, progress: 68, trend: 'stable' },
                    espanol: { score: 92, progress: 85, trend: 'up' },
                    historia: { score: 88, progress: 72, trend: 'up' },
                    ingles: { score: 76, progress: 60, trend: 'down' },
                    filosofia: { score: 80, progress: 65, trend: 'stable' }
                },
                overall: { gpa: 8.3, ranking: 15, totalStudents: 120 }
            },
            skills: {
                criticalThinking: 78,
                problemSolving: 82,
                creativity: 75,
                collaboration: 88,
                communication: 85,
                digitalLiteracy: 90
            },
            behavior: {
                studyTime: 180, // minutos por día
                engagement: 85,
                consistency: 72,
                participation: 90
            },
            goals: [
                { id: 1, title: 'Mejorar en Inglés', target: 85, current: 76, deadline: '2024-06-30' },
                { id: 2, title: 'Aumentar tiempo de estudio', target: 240, current: 180, deadline: '2024-03-30' }
            ],
            achievements: [
                { id: 1, title: 'Excelencia en Español', date: '2024-01-15', icon: '📚' },
                { id: 2, title: 'Participación Destacada', date: '2024-01-20', icon: '🎯' }
            ]
        };
    }

    async loadAcademicData() {
        // Simular carga de datos académicos del sistema
        // En un sistema real, esto vendría de la API del sistema académico
        if (window.apiClient) {
            try {
                const academicData = await window.apiClient.getAcademicProgress(this.userId);
                if (academicData && academicData.success) {
                    this.mergeAcademicData(academicData.data);
                }
            } catch (error) {
                console.warn('Error loading academic data:', error);
            }
        }
    }

    async loadBehaviorData() {
        // Obtener datos de comportamiento del motor de recomendaciones AI
        if (window.aiRecommendationEngine) {
            try {
                const behaviorData = window.aiRecommendationEngine.getUserBehaviorAnalysis(this.userId);
                if (behaviorData) {
                    this.mergeBehaviorData(behaviorData);
                }
            } catch (error) {
                console.warn('Error loading behavior data:', error);
            }
        }
    }

    createDashboardInterface() {
        // Crear contenedor principal del dashboard
        const dashboardContainer = document.createElement('div');
        dashboardContainer.id = 'ai-progress-dashboard';
        dashboardContainer.className = 'ai-dashboard-container hidden';

        dashboardContainer.innerHTML = `
            <div class="dashboard-header">
                <div class="header-content">
                    <h2 class="dashboard-title">
                        <i class="fas fa-brain"></i>
                        Dashboard de Progreso IA
                    </h2>
                    <div class="dashboard-controls">
                        <button class="btn-control" id="refresh-dashboard" title="Actualizar datos">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                        <button class="btn-control" id="export-report" title="Exportar reporte">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn-control" id="settings-dashboard" title="Configuración">
                            <i class="fas fa-cog"></i>
                        </button>
                        <button class="btn-control close-btn" id="close-dashboard" title="Cerrar">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="dashboard-summary">
                    <div class="summary-card">
                        <div class="summary-value" id="overall-score">8.3</div>
                        <div class="summary-label">Promedio General</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value" id="ranking-position">#15</div>
                        <div class="summary-label">Posición en Grupo</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value" id="study-streak">12</div>
                        <div class="summary-label">Días Consecutivos</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value" id="ai-score">87%</div>
                        <div class="summary-label">Predicción IA</div>
                    </div>
                </div>
            </div>

            <div class="dashboard-content">
                <div class="dashboard-grid">
                    <!-- Panel de Rendimiento Académico -->
                    <div class="dashboard-panel academic-panel">
                        <div class="panel-header">
                            <h3><i class="fas fa-graduation-cap"></i> Rendimiento Académico</h3>
                            <select id="academic-period" class="period-selector">
                                <option value="current">Semestre Actual</option>
                                <option value="last">Semestre Anterior</option>
                                <option value="year">Año Escolar</option>
                            </select>
                        </div>
                        <div class="panel-content">
                            <canvas id="academic-chart" width="400" height="200"></canvas>
                        </div>
                    </div>

                    <!-- Panel de Habilidades -->
                    <div class="dashboard-panel skills-panel">
                        <div class="panel-header">
                            <h3><i class="fas fa-brain"></i> Habilidades del Siglo XXI</h3>
                        </div>
                        <div class="panel-content">
                            <canvas id="skills-chart" width="300" height="300"></canvas>
                        </div>
                    </div>

                    <!-- Panel de Metas y Objetivos -->
                    <div class="dashboard-panel goals-panel">
                        <div class="panel-header">
                            <h3><i class="fas fa-target"></i> Metas y Objetivos</h3>
                            <button class="add-goal-btn" id="add-goal">
                                <i class="fas fa-plus"></i> Nueva Meta
                            </button>
                        </div>
                        <div class="panel-content">
                            <div id="goals-list" class="goals-container">
                                <!-- Las metas se generarán dinámicamente -->
                            </div>
                        </div>
                    </div>

                    <!-- Panel de Recomendaciones IA -->
                    <div class="dashboard-panel recommendations-panel">
                        <div class="panel-header">
                            <h3><i class="fas fa-lightbulb"></i> Recomendaciones IA</h3>
                        </div>
                        <div class="panel-content">
                            <div id="ai-recommendations" class="recommendations-container">
                                <!-- Las recomendaciones se generarán dinámicamente -->
                            </div>
                        </div>
                    </div>

                    <!-- Panel de Actividad y Comportamiento -->
                    <div class="dashboard-panel activity-panel">
                        <div class="panel-header">
                            <h3><i class="fas fa-chart-line"></i> Actividad de Estudio</h3>
                        </div>
                        <div class="panel-content">
                            <canvas id="activity-chart" width="400" height="200"></canvas>
                        </div>
                    </div>

                    <!-- Panel de Logros -->
                    <div class="dashboard-panel achievements-panel">
                        <div class="panel-header">
                            <h3><i class="fas fa-trophy"></i> Logros Recientes</h3>
                        </div>
                        <div class="panel-content">
                            <div id="achievements-list" class="achievements-container">
                                <!-- Los logros se generarán dinámicamente -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Agregar al DOM
        document.body.appendChild(dashboardContainer);

        // Crear botón de activación
        this.createActivationButton();

        // Configurar event listeners
        this.setupEventListeners();
    }

    createActivationButton() {
        const activationBtn = document.createElement('div');
        activationBtn.id = 'ai-dashboard-activation';
        activationBtn.className = 'ai-dashboard-activation';
        activationBtn.innerHTML = `
            <div class="activation-content">
                <div class="dashboard-icon">📊</div>
                <div class="notification-dot" style="display: none;"></div>
            </div>
        `;

        activationBtn.addEventListener('click', () => this.toggleDashboard());
        document.body.appendChild(activationBtn);
    }

    setupEventListeners() {
        // Controles del dashboard
        document.getElementById('close-dashboard').addEventListener('click', () => this.closeDashboard());
        document.getElementById('refresh-dashboard').addEventListener('click', () => this.refreshData());
        document.getElementById('export-report').addEventListener('click', () => this.exportReport());
        document.getElementById('add-goal').addEventListener('click', () => this.showGoalModal());

        // Selectores de período
        document.getElementById('academic-period').addEventListener('change', (e) => this.updateAcademicChart(e.target.value));
    }

    async loadProgressData() {
        // Cargar y renderizar todos los datos
        await this.renderAcademicChart();
        await this.renderSkillsChart();
        await this.renderActivityChart();
        this.renderGoals();
        this.renderRecommendations();
        this.renderAchievements();
        this.updateSummary();
    }

    async renderAcademicChart() {
        const ctx = document.getElementById('academic-chart').getContext('2d');

        // Destruir chart existente si existe
        if (this.charts.academic) {
            this.charts.academic.destroy();
        }

        const subjects = Object.keys(this.progressData.academic.subjects);
        const scores = subjects.map(subject => this.progressData.academic.subjects[subject].score);
        const progress = subjects.map(subject => this.progressData.academic.subjects[subject].progress);

        // Destruir gráfico existente si existe
        if (this.charts.academic) {
            this.charts.academic.destroy();
        }

        this.charts.academic = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: subjects.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
                datasets: [
                    {
                        label: 'Calificación',
                        data: scores,
                        backgroundColor: this.chartColors.primary,
                        borderColor: this.chartColors.primary,
                        borderWidth: 1
                    },
                    {
                        label: 'Progreso',
                        data: progress,
                        backgroundColor: this.chartColors.secondary,
                        borderColor: this.chartColors.secondary,
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Rendimiento por Materia'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    async updateAcademicChart(period) {
        // Actualizar datos según el período seleccionado
        console.log('Actualizando chart para período:', period);

        // Aquí puedes cargar datos específicos del período
        // Por ahora simplemente re-renderizamos el chart
        await this.renderAcademicChart();
    }

    async renderSkillsChart() {
        const ctx = document.getElementById('skills-chart');
        if (!ctx) return;

        // DESTRUIR GRÁFICO EXISTENTE ANTES DE CREAR UNO NUEVO
        if (this.charts.skills) {
            this.charts.skills.destroy();
            this.charts.skills = null;
        }

        const skills = Object.keys(this.progressData.skills);
        const values = Object.values(this.progressData.skills);

        // Destruir gráfico existente si existe
        if (this.charts.skills) {
            this.charts.skills.destroy();
        }

        this.charts.skills = new Chart(ctx.getContext('2d'), {
            type: 'radar',
            data: {
                labels: skills.map(skill => this.formatSkillName(skill)),
                datasets: [{
                    label: 'Habilidades',
                    data: values,
                    fill: true,
                    backgroundColor: 'rgba(25, 118, 210, 0.2)',
                    borderColor: this.chartColors.primary,
                    pointBackgroundColor: this.chartColors.primary,
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: this.chartColors.primary
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    r: {
                        angleLines: {
                            display: true
                        },
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                }
            }
        });
    }

    async renderActivityChart() {
        const ctx = document.getElementById('activity-chart').getContext('2d');

        // Generar datos de actividad de los últimos 7 días
        const days = [];
        const studyTime = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date.toLocaleDateString('es-ES', { weekday: 'short' }));
            studyTime.push(Math.floor(Math.random() * 120) + 60); // 60-180 minutos
        }

        // Destruir gráfico existente si existe
        if (this.charts.activity) {
            this.charts.activity.destroy();
        }

        this.charts.activity = new Chart(ctx, {
            type: 'line',
            data: {
                labels: days,
                datasets: [{
                    label: 'Tiempo de Estudio (min)',
                    data: studyTime,
                    fill: true,
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    borderColor: this.chartColors.success,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Actividad de los Últimos 7 Días'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    renderGoals() {
        const container = document.getElementById('goals-list');
        container.innerHTML = '';

        this.progressData.goals.forEach(goal => {
            const goalElement = document.createElement('div');
            goalElement.className = 'goal-item';

            const progressPercentage = Math.round((goal.current / goal.target) * 100);
            const isCompleted = progressPercentage >= 100;

            goalElement.innerHTML = `
                <div class="goal-header">
                    <h4 class="goal-title">${goal.title}</h4>
                    <span class="goal-status ${isCompleted ? 'completed' : ''}">
                        ${progressPercentage}%
                    </span>
                </div>
                <div class="goal-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(progressPercentage, 100)}%"></div>
                    </div>
                </div>
                <div class="goal-details">
                    <span class="goal-current">${goal.current}</span>
                    <span class="goal-separator">/</span>
                    <span class="goal-target">${goal.target}</span>
                    <span class="goal-deadline">📅 ${new Date(goal.deadline).toLocaleDateString('es-ES')}</span>
                </div>
            `;

            container.appendChild(goalElement);
        });
    }

    async renderRecommendations() {
        const container = document.getElementById('ai-recommendations');

        // Obtener recomendaciones del motor de IA
        let recommendations = [];

        if (window.aiRecommendationEngine) {
            try {
                recommendations = await window.aiRecommendationEngine.generateRecommendations(this.userId);
            } catch (error) {
                console.warn('Error generating AI recommendations:', error);
            }
        }

        // Usar recomendaciones por defecto si no hay datos del motor IA
        if (recommendations.length === 0) {
            recommendations = [
                {
                    type: 'study',
                    title: 'Refuerza Inglés',
                    description: 'Tu rendimiento en inglés está por debajo del promedio. Te recomiendo 30 minutos diarios de práctica.',
                    priority: 'high',
                    action: 'Comenzar ahora'
                },
                {
                    type: 'time',
                    title: 'Aumenta tiempo de estudio',
                    description: 'Para alcanzar tu meta de 240 minutos diarios, incrementa gradualmente 15 minutos cada semana.',
                    priority: 'medium',
                    action: 'Ver plan'
                },
                {
                    type: 'skill',
                    title: 'Desarrolla pensamiento crítico',
                    description: 'Participa más en debates y análisis de casos para fortalecer esta habilidad clave.',
                    priority: 'medium',
                    action: 'Explorar recursos'
                }
            ];
        }

        container.innerHTML = '';

        // Ensure recommendations is an array
        const validRecommendations = Array.isArray(recommendations) ? recommendations : [];

        validRecommendations.slice(0, 5).forEach(rec => {
            const recElement = document.createElement('div');
            recElement.className = `recommendation-item priority-${rec.priority}`;

            recElement.innerHTML = `
                <div class="rec-icon">
                    ${this.getRecommendationIcon(rec.type)}
                </div>
                <div class="rec-content">
                    <h4 class="rec-title">${rec.title}</h4>
                    <p class="rec-description">${rec.description}</p>
                    <button class="rec-action" onclick="aiProgressDashboard.handleRecommendationAction('${rec.type}')">
                        ${rec.action || 'Ver más'}
                    </button>
                </div>
            `;

            container.appendChild(recElement);
        });
    }

    renderAchievements() {
        const container = document.getElementById('achievements-list');
        container.innerHTML = '';

        this.progressData.achievements.slice(0, 6).forEach(achievement => {
            const achElement = document.createElement('div');
            achElement.className = 'achievement-item';

            achElement.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-content">
                    <h4 class="achievement-title">${achievement.title}</h4>
                    <span class="achievement-date">${new Date(achievement.date).toLocaleDateString('es-ES')}</span>
                </div>
            `;

            container.appendChild(achElement);
        });
    }

    updateSummary() {
        document.getElementById('overall-score').textContent = this.progressData.academic.overall.gpa.toFixed(1);
        document.getElementById('ranking-position').textContent = `#${this.progressData.academic.overall.ranking}`;
        document.getElementById('study-streak').textContent = Math.floor(Math.random() * 30) + 1;
        document.getElementById('ai-score').textContent = `${Math.floor(Math.random() * 20) + 80}%`;
    }

    // Funciones auxiliares
    formatSkillName(skill) {
        const skillNames = {
            criticalThinking: 'Pensamiento Crítico',
            problemSolving: 'Resolución de Problemas',
            creativity: 'Creatividad',
            collaboration: 'Colaboración',
            communication: 'Comunicación',
            digitalLiteracy: 'Cultura Digital'
        };
        return skillNames[skill] || skill;
    }

    getRecommendationIcon(type) {
        const icons = {
            study: '📚',
            time: '⏰',
            skill: '🧠',
            social: '👥',
            health: '💪',
            career: '🎯'
        };
        return icons[type] || '💡';
    }

    // Funciones de interacción
    toggleDashboard() {
        const dashboard = document.getElementById('ai-progress-dashboard');
        const activation = document.getElementById('ai-dashboard-activation');

        if (dashboard.classList.contains('hidden')) {
            dashboard.classList.remove('hidden');
            activation.style.display = 'none';
            this.refreshData();
        } else {
            this.closeDashboard();
        }
    }

    closeDashboard() {
        const dashboard = document.getElementById('ai-progress-dashboard');
        const activation = document.getElementById('ai-dashboard-activation');

        dashboard.classList.add('hidden');
        activation.style.display = 'flex';
    }

    async refreshData() {
        // Mostrar indicador de carga
        this.showLoadingIndicator();

        try {
            // Recargar datos
            await this.loadUserData();
            await this.loadAcademicData();
            await this.loadBehaviorData();

            // Re-renderizar componentes
            await this.loadProgressData();

            this.showNotification('Dashboard actualizado correctamente', 'success');
        } catch (error) {
            console.error('Error refreshing dashboard:', error);
            this.showNotification('Error al actualizar el dashboard', 'error');
        } finally {
            this.hideLoadingIndicator();
        }
    }

    exportReport() {
        // Generar reporte en JSON
        const report = {
            userId: this.userId,
            generatedAt: new Date().toISOString(),
            summary: {
                overallGPA: this.progressData.academic.overall.gpa,
                ranking: this.progressData.academic.overall.ranking,
                totalSubjects: Object.keys(this.progressData.academic.subjects).length
            },
            academicData: this.progressData.academic,
            skillsData: this.progressData.skills,
            behaviorData: this.progressData.behavior,
            goalsData: this.progressData.goals,
            achievementsData: this.progressData.achievements
        };

        // Descargar como archivo JSON
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_progreso_${this.userId}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('Reporte exportado correctamente', 'success');
    }

    handleRecommendationAction(type) {
        // Manejar acciones de recomendaciones
        switch (type) {
            case 'study':
                this.showNotification('Abriendo recursos de estudio para Inglés...', 'info');
                break;
            case 'time':
                this.showNotification('Mostrando plan de incremento gradual...', 'info');
                break;
            case 'skill':
                this.showNotification('Explorando recursos de pensamiento crítico...', 'info');
                break;
            default:
                this.showNotification('Acción en desarrollo...', 'info');
        }
    }

    startRealTimeUpdates() {
        if (!this.config.enableRealTimeUpdates) return;

        setInterval(() => {
            if (!document.getElementById('ai-progress-dashboard').classList.contains('hidden')) {
                this.updateRealTimeData();
            }
        }, this.config.updateInterval);
    }

    updateRealTimeData() {
        // Simulación de actualizaciones en tiempo real
        const now = Date.now();

        // Actualizar tiempo de estudio del día actual
        if (this.charts.activity) {
            const data = this.charts.activity.data.datasets[0].data;
            data[data.length - 1] = Math.min(data[data.length - 1] + Math.floor(Math.random() * 5), 300);
            this.charts.activity.update('none');
        }

        // Guardar datos actualizados
        this.saveProgressData();
    }

    saveProgressData() {
        this.progressData.lastUpdated = Date.now();
        localStorage.setItem(`ai_progress_${this.userId}`, JSON.stringify(this.progressData));
    }

    // Funciones de utilidad
    showLoadingIndicator() {
        // Implementar indicador de carga
        console.log('🔄 Cargando datos del dashboard...');
    }

    hideLoadingIndicator() {
        console.log('✅ Datos del dashboard cargados');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `dashboard-notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    mergeAcademicData(newData) {
        // Fusionar nuevos datos académicos
        if (newData && newData.subjects) {
            Object.assign(this.progressData.academic.subjects, newData.subjects);
        }
        if (newData && newData.overall) {
            Object.assign(this.progressData.academic.overall, newData.overall);
        }
    }

    mergeBehaviorData(newData) {
        // Fusionar nuevos datos de comportamiento
        if (newData) {
            Object.assign(this.progressData.behavior, newData);
        }
    }
}

// CSS para el dashboard
const dashboardStyles = document.createElement('style');
dashboardStyles.textContent = `
    .ai-dashboard-activation {
        position: fixed;
        bottom: 30px;
        right: 230px;
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #00ff9f 0%, #00b8d4 50%, #0091ea 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(0, 255, 159, 0.5), 0 0 30px rgba(0, 184, 212, 0.3);
        transition: all 0.3s ease;
        z-index: 9997;
    }

    .ai-dashboard-activation:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 30px rgba(0, 255, 159, 0.7), 0 0 40px rgba(0, 184, 212, 0.5);
    }

    .dashboard-icon {
        font-size: 24px;
        color: white;
    }

    .notification-dot {
        position: absolute;
        top: -2px;
        right: -2px;
        width: 12px;
        height: 12px;
        background: #ff4757;
        border-radius: 50%;
        border: 2px solid white;
    }

    .ai-dashboard-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(5px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
        box-sizing: border-box;
    }

    .ai-dashboard-container.hidden {
        display: none;
    }

    .dashboard-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        border-radius: 12px 12px 0 0;
    }

    .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }

    .dashboard-title {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
    }

    .dashboard-controls {
        display: flex;
        gap: 8px;
    }

    .btn-control {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 36px;
        height: 36px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .btn-control:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-1px);
    }

    .dashboard-summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 16px;
    }

    .summary-card {
        background: rgba(255, 255, 255, 0.1);
        padding: 16px;
        border-radius: 8px;
        text-align: center;
    }

    .summary-value {
        font-size: 1.8rem;
        font-weight: 700;
        margin-bottom: 4px;
    }

    .summary-label {
        font-size: 0.8rem;
        opacity: 0.8;
    }

    .dashboard-content {
        background: white;
        border-radius: 0 0 12px 12px;
        padding: 20px;
        max-height: 70vh;
        overflow-y: auto;
        width: 95vw;
        max-width: 1200px;
    }

    .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
    }

    .dashboard-panel {
        background: #f8f9fa;
        border-radius: 8px;
        padding: 16px;
        border: 1px solid #e9ecef;
    }

    .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 8px;
        border-bottom: 1px solid #dee2e6;
    }

    .panel-header h3 {
        margin: 0;
        font-size: 1.1rem;
        color: #495057;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .period-selector, .add-goal-btn {
        padding: 4px 8px;
        border: 1px solid #ced4da;
        border-radius: 4px;
        background: white;
        font-size: 0.85rem;
        cursor: pointer;
    }

    .add-goal-btn {
        background: #007bff;
        color: white;
        border-color: #007bff;
        transition: all 0.2s;
    }

    .add-goal-btn:hover {
        background: #0056b3;
        transform: translateY(-1px);
    }

    .panel-content {
        min-height: 200px;
    }

    /* Estilos para metas */
    .goal-item {
        background: white;
        padding: 12px;
        border-radius: 6px;
        margin-bottom: 12px;
        border-left: 4px solid #007bff;
    }

    .goal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
    }

    .goal-title {
        margin: 0;
        font-size: 0.9rem;
        color: #495057;
    }

    .goal-status {
        font-weight: 600;
        color: #007bff;
        font-size: 0.85rem;
    }

    .goal-status.completed {
        color: #28a745;
    }

    .progress-bar {
        width: 100%;
        height: 6px;
        background: #e9ecef;
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: 8px;
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #007bff, #0056b3);
        transition: width 0.3s ease;
    }

    .goal-details {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 0.8rem;
        color: #6c757d;
    }

    /* Estilos para recomendaciones */
    .recommendation-item {
        display: flex;
        gap: 12px;
        padding: 12px;
        background: white;
        border-radius: 6px;
        margin-bottom: 12px;
        border-left: 4px solid #ffc107;
    }

    .recommendation-item.priority-high {
        border-left-color: #dc3545;
    }

    .recommendation-item.priority-medium {
        border-left-color: #ffc107;
    }

    .recommendation-item.priority-low {
        border-left-color: #28a745;
    }

    .rec-icon {
        font-size: 1.5rem;
        margin-top: 4px;
    }

    .rec-content {
        flex: 1;
    }

    .rec-title {
        margin: 0 0 4px 0;
        font-size: 0.9rem;
        color: #495057;
    }

    .rec-description {
        margin: 0 0 8px 0;
        font-size: 0.8rem;
        color: #6c757d;
        line-height: 1.4;
    }

    .rec-action {
        background: #007bff;
        color: white;
        border: none;
        padding: 4px 12px;
        border-radius: 4px;
        font-size: 0.75rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .rec-action:hover {
        background: #0056b3;
        transform: translateY(-1px);
    }

    /* Estilos para logros */
    .achievement-item {
        display: flex;
        gap: 12px;
        padding: 12px;
        background: white;
        border-radius: 6px;
        margin-bottom: 12px;
        border-left: 4px solid #28a745;
    }

    .achievement-icon {
        font-size: 1.5rem;
        margin-top: 2px;
    }

    .achievement-content {
        flex: 1;
    }

    .achievement-title {
        margin: 0 0 4px 0;
        font-size: 0.9rem;
        color: #495057;
    }

    .achievement-date {
        font-size: 0.75rem;
        color: #6c757d;
    }

    /* Notificaciones */
    .dashboard-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 10001;
        animation: slideInNotification 0.3s ease;
    }

    .dashboard-notification.success {
        background: #28a745;
    }

    .dashboard-notification.error {
        background: #dc3545;
    }

    .dashboard-notification.info {
        background: #17a2b8;
    }

    @keyframes slideInNotification {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    /* Responsive */
    @media (max-width: 768px) {
        .ai-dashboard-container {
            padding: 10px;
        }

        .dashboard-content {
            width: 100%;
            max-height: 80vh;
        }

        .dashboard-grid {
            grid-template-columns: 1fr;
            gap: 16px;
        }

        .dashboard-summary {
            grid-template-columns: repeat(2, 1fr);
        }

        .header-content {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
        }
    }
`;
document.head.appendChild(dashboardStyles);

// Inicialización automática
document.addEventListener('DOMContentLoaded', () => {
    window.aiProgressDashboard = new AIProgressDashboard();
});

// Exponer globalmente
window.AIProgressDashboard = AIProgressDashboard;