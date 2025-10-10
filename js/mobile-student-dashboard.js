/**
 * 📱 BGE Mobile Student Dashboard
 * Dashboard Móvil Optimizado para Estudiantes
 *
 * Implementa una interfaz nativa optimizada para estudiantes:
 * - Dashboard personalizado con widgets configurables
 * - Vista unificada de tareas, evaluaciones y progreso
 * - Integración con calendario académico
 * - Acceso rápido a recursos educativos
 * - Sistema de gamificación y logros
 * - Chat integrado con compañeros y profesores
 * - Modo offline completo con sincronización
 * - Interfaz adaptativa según dispositivo
 *
 * @version 1.0.0
 * @since Phase E - Mobile Native Implementation
 */

class BGEMobileStudentDashboard {
    constructor(mobileArchitecture) {
        this.mobileArch = mobileArchitecture;

        this.dashboardConfig = {
            widgets: {
                QUICK_STATS: {
                    id: 'quick_stats',
                    name: 'Estadísticas Rápidas',
                    type: 'stats',
                    size: 'medium',
                    refreshInterval: 5 * 60 * 1000, // 5 minutos
                    data: ['pending_assignments', 'upcoming_evaluations', 'overall_grade', 'attendance']
                },
                ASSIGNMENTS: {
                    id: 'assignments',
                    name: 'Tareas Pendientes',
                    type: 'list',
                    size: 'large',
                    refreshInterval: 2 * 60 * 1000, // 2 minutos
                    maxItems: 5
                },
                CALENDAR: {
                    id: 'calendar',
                    name: 'Próximos Eventos',
                    type: 'calendar',
                    size: 'medium',
                    refreshInterval: 10 * 60 * 1000, // 10 minutos
                    showDays: 7
                },
                PROGRESS: {
                    id: 'progress',
                    name: 'Progreso Académico',
                    type: 'chart',
                    size: 'large',
                    refreshInterval: 30 * 60 * 1000, // 30 minutos
                    chartType: 'line'
                },
                ACHIEVEMENTS: {
                    id: 'achievements',
                    name: 'Logros Recientes',
                    type: 'badges',
                    size: 'medium',
                    refreshInterval: 60 * 60 * 1000, // 1 hora
                    showRecent: 3
                },
                QUICK_ACTIONS: {
                    id: 'quick_actions',
                    name: 'Acciones Rápidas',
                    type: 'actions',
                    size: 'small',
                    refreshInterval: 0, // No requiere refresh
                    actions: ['submit_assignment', 'join_class', 'view_grades', 'chat_teacher']
                },
                ANNOUNCEMENTS: {
                    id: 'announcements',
                    name: 'Avisos Importantes',
                    type: 'feed',
                    size: 'medium',
                    refreshInterval: 15 * 60 * 1000, // 15 minutos
                    maxItems: 3
                },
                STUDY_STREAK: {
                    id: 'study_streak',
                    name: 'Racha de Estudio',
                    type: 'gamification',
                    size: 'small',
                    refreshInterval: 24 * 60 * 60 * 1000, // 24 horas
                    showStreak: true
                }
            },
            layout: {
                mobile: {
                    columns: 1,
                    defaultOrder: ['quick_stats', 'assignments', 'calendar', 'announcements', 'progress', 'achievements']
                },
                tablet: {
                    columns: 2,
                    defaultOrder: ['quick_stats', 'quick_actions', 'assignments', 'calendar', 'progress', 'achievements']
                },
                desktop: {
                    columns: 3,
                    defaultOrder: ['quick_stats', 'assignments', 'quick_actions', 'calendar', 'progress', 'announcements']
                }
            },
            themes: {
                light: {
                    primaryColor: '#3498db',
                    backgroundColor: '#ffffff',
                    cardColor: '#f8f9fa',
                    textColor: '#2c3e50',
                    accentColor: '#e74c3c'
                },
                dark: {
                    primaryColor: '#3498db',
                    backgroundColor: '#1a1a1a',
                    cardColor: '#2c2c2c',
                    textColor: '#ffffff',
                    accentColor: '#e74c3c'
                },
                school: {
                    primaryColor: '#1e3a8a',
                    backgroundColor: '#f1f5f9',
                    cardColor: '#ffffff',
                    textColor: '#1e293b',
                    accentColor: '#dc2626'
                }
            }
        };

        this.studentData = {
            profile: null,
            assignments: [],
            evaluations: [],
            grades: [],
            attendance: {},
            achievements: [],
            studyStreak: 0,
            preferences: {},
            calendar: []
        };

        this.dashboardState = {
            currentTheme: 'light',
            widgetLayout: [],
            refreshTimers: new Map(),
            isLoading: false,
            lastSync: null
        };

        this.widgetComponents = new Map();
        this.actionHandlers = new Map();

        this.logger = window.BGELogger || console;
        this.initializeStudentDashboard();
    }

    async initializeStudentDashboard() {
        try {
            this.logger.info('StudentDashboard', 'Inicializando dashboard móvil de estudiante');

            // Cargar datos del estudiante
            await this.loadStudentData();

            // Configurar layout según dispositivo
            this.setupResponsiveLayout();

            // Inicializar widgets
            await this.initializeWidgets();

            // Configurar sistema de refresh automático
            this.setupAutoRefresh();

            // Configurar handlers de acciones
            this.setupActionHandlers();

            // Cargar preferencias personalizadas
            await this.loadUserPreferences();

            // Configurar gamificación
            this.initializeGamification();

            // Renderizar dashboard inicial
            await this.renderDashboard();

            this.logger.info('StudentDashboard', 'Dashboard de estudiante inicializado correctamente');

        } catch (error) {
            this.logger.error('StudentDashboard', 'Error al inicializar dashboard', error);
            throw error;
        }
    }

    async loadStudentData() {
        try {
            // Obtener perfil del estudiante
            this.studentData.profile = await this.mobileArch.getData('student_profile', 'user_data');

            // Cargar datos académicos en paralelo
            const [assignments, evaluations, grades, attendance, achievements, calendar] = await Promise.allSettled([
                this.loadAssignments(),
                this.loadEvaluations(),
                this.loadGrades(),
                this.loadAttendance(),
                this.loadAchievements(),
                this.loadCalendarEvents()
            ]);

            // Procesar resultados
            if (assignments.status === 'fulfilled') this.studentData.assignments = assignments.value;
            if (evaluations.status === 'fulfilled') this.studentData.evaluations = evaluations.value;
            if (grades.status === 'fulfilled') this.studentData.grades = grades.value;
            if (attendance.status === 'fulfilled') this.studentData.attendance = attendance.value;
            if (achievements.status === 'fulfilled') this.studentData.achievements = achievements.value;
            if (calendar.status === 'fulfilled') this.studentData.calendar = calendar.value;

            // Calcular racha de estudio
            this.studentData.studyStreak = this.calculateStudyStreak();

            this.logger.info('StudentDashboard', 'Datos del estudiante cargados');

        } catch (error) {
            this.logger.error('StudentDashboard', 'Error al cargar datos del estudiante', error);
            // Usar datos de ejemplo en caso de error
            this.loadSampleData();
        }
    }

    async loadAssignments() {
        // Cargar tareas pendientes y recientes
        const assignments = await this.mobileArch.getData('assignments', 'assignments') || [];

        // Filtrar y ordenar tareas
        return assignments
            .filter(assignment => !assignment.completed || this.isRecentlyCompleted(assignment))
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .slice(0, 10); // Últimas 10 tareas
    }

    async loadEvaluations() {
        // Cargar evaluaciones próximas
        const evaluations = await this.mobileArch.getData('evaluations', 'evaluations') || [];

        const now = new Date();
        const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        return evaluations
            .filter(evaluation => {
                const evalDate = new Date(evaluation.date);
                return evalDate >= now && evalDate <= oneMonthFromNow;
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    async loadGrades() {
        // Cargar calificaciones del período actual
        const grades = await this.mobileArch.getData('grades', 'evaluations') || [];

        return grades
            .filter(grade => this.isCurrentPeriod(grade.period))
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    async loadAttendance() {
        // Cargar datos de asistencia del mes actual
        const attendance = await this.mobileArch.getData('attendance', 'academic_records') || {};

        return {
            currentMonth: attendance.currentMonth || {},
            stats: this.calculateAttendanceStats(attendance),
            streak: attendance.streak || 0
        };
    }

    async loadAchievements() {
        // Cargar logros y badges
        const achievements = await this.mobileArch.getData('achievements', 'user_data') || [];

        return achievements
            .sort((a, b) => new Date(b.earnedDate) - new Date(a.earnedDate))
            .slice(0, 20); // Últimos 20 logros
    }

    async loadCalendarEvents() {
        // Cargar eventos del calendario académico
        const events = await this.mobileArch.getData('calendar', 'calendar_events') || [];

        const now = new Date();
        const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        return events
            .filter(event => {
                const eventDate = new Date(event.date);
                return eventDate >= now && eventDate <= oneWeekFromNow;
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    setupResponsiveLayout() {
        // Configurar layout según el tamaño de pantalla
        const screenWidth = window.innerWidth;
        let deviceType = 'mobile';

        if (screenWidth >= 1024) {
            deviceType = 'desktop';
        } else if (screenWidth >= 768) {
            deviceType = 'tablet';
        }

        this.dashboardState.deviceType = deviceType;
        this.dashboardState.widgetLayout = this.dashboardConfig.layout[deviceType].defaultOrder;

        // Configurar listener para cambios de orientación
        window.addEventListener('resize', () => {
            this.handleScreenResize();
        });

        this.logger.info('StudentDashboard', `Layout configurado para: ${deviceType}`);
    }

    async initializeWidgets() {
        // Inicializar componentes de widgets
        for (const [widgetId, config] of Object.entries(this.dashboardConfig.widgets)) {
            const widget = await this.createWidget(widgetId, config);
            this.widgetComponents.set(widgetId, widget);
        }

        this.logger.info('StudentDashboard', `${this.widgetComponents.size} widgets inicializados`);
    }

    async createWidget(widgetId, config) {
        const widget = {
            id: widgetId,
            config: config,
            data: null,
            element: null,
            isLoading: false,
            lastUpdate: null,

            // Métodos del widget
            render: async () => {
                return await this.renderWidget(widget);
            },

            refresh: async () => {
                return await this.refreshWidget(widget);
            },

            update: (newData) => {
                widget.data = newData;
                widget.lastUpdate = new Date();
                return widget.render();
            },

            resize: () => {
                this.resizeWidget(widget);
            },

            show: () => {
                if (widget.element) {
                    widget.element.style.display = 'block';
                }
            },

            hide: () => {
                if (widget.element) {
                    widget.element.style.display = 'none';
                }
            }
        };

        // Cargar datos iniciales del widget
        await widget.refresh();

        return widget;
    }

    setupAutoRefresh() {
        // Configurar refresh automático para cada widget
        for (const [widgetId, widget] of this.widgetComponents) {
            const config = widget.config;

            if (config.refreshInterval > 0) {
                const timer = setInterval(async () => {
                    if (!document.hidden) { // Solo refresh si la app está visible
                        await widget.refresh();
                    }
                }, config.refreshInterval);

                this.dashboardState.refreshTimers.set(widgetId, timer);
            }
        }

        // Configurar refresh al volver de background
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.refreshAllWidgets();
            }
        });

        this.logger.info('StudentDashboard', 'Auto-refresh configurado para widgets');
    }

    setupActionHandlers() {
        // Configurar handlers para acciones rápidas
        this.actionHandlers.set('submit_assignment', async (data) => {
            await this.mobileArch.navigateTo('assignments/submit', data);
        });

        this.actionHandlers.set('join_class', async (data) => {
            await this.mobileArch.navigateTo('classes/join', data);
        });

        this.actionHandlers.set('view_grades', async (data) => {
            await this.mobileArch.navigateTo('grades', data);
        });

        this.actionHandlers.set('chat_teacher', async (data) => {
            await this.mobileArch.navigateTo('chat/teacher', data);
        });

        this.actionHandlers.set('view_assignment', async (assignmentId) => {
            await this.mobileArch.navigateTo('assignments/view', { id: assignmentId });
        });

        this.actionHandlers.set('view_evaluation', async (evaluationId) => {
            await this.mobileArch.navigateTo('evaluations/view', { id: evaluationId });
        });

        this.actionHandlers.set('view_calendar', async (eventId) => {
            await this.mobileArch.navigateTo('calendar', { event: eventId });
        });

        this.logger.info('StudentDashboard', 'Action handlers configurados');
    }

    async loadUserPreferences() {
        try {
            const preferences = await this.mobileArch.getData('dashboard_preferences', 'user_data');

            if (preferences) {
                this.studentData.preferences = preferences;

                // Aplicar tema personalizado
                if (preferences.theme) {
                    this.dashboardState.currentTheme = preferences.theme;
                }

                // Aplicar layout personalizado
                if (preferences.widgetLayout) {
                    this.dashboardState.widgetLayout = preferences.widgetLayout;
                }
            }

            this.logger.info('StudentDashboard', 'Preferencias de usuario cargadas');

        } catch (error) {
            this.logger.error('StudentDashboard', 'Error al cargar preferencias', error);
        }
    }

    initializeGamification() {
        // Sistema de gamificación para el dashboard
        this.gamification = {
            levels: {
                1: { name: 'Novato', xpRequired: 0, color: '#95a5a6' },
                2: { name: 'Estudiante', xpRequired: 100, color: '#3498db' },
                3: { name: 'Aplicado', xpRequired: 300, color: '#2ecc71' },
                4: { name: 'Destacado', xpRequired: 600, color: '#f39c12' },
                5: { name: 'Excelente', xpRequired: 1000, color: '#e74c3c' },
                6: { name: 'Maestro', xpRequired: 1500, color: '#9b59b6' }
            },

            achievements: {
                'first_assignment': { name: 'Primera Tarea', description: 'Completa tu primera tarea', xp: 10 },
                'perfect_week': { name: 'Semana Perfecta', description: 'Una semana sin faltas', xp: 50 },
                'early_bird': { name: 'Madrugador', description: 'Entrega 5 tareas antes de tiempo', xp: 30 },
                'study_streak_7': { name: 'Racha de 7', description: '7 días seguidos estudiando', xp: 40 },
                'perfect_grade': { name: 'Calificación Perfecta', description: 'Obtén 100 en una evaluación', xp: 75 }
            },

            calculateLevel: (xp) => {
                const levels = Object.entries(this.gamification.levels);
                for (let i = levels.length - 1; i >= 0; i--) {
                    const [level, data] = levels[i];
                    if (xp >= data.xpRequired) {
                        return {
                            level: parseInt(level),
                            name: data.name,
                            color: data.color,
                            progress: i < levels.length - 1 ?
                                (xp - data.xpRequired) / (levels[i + 1][1].xpRequired - data.xpRequired) :
                                1.0
                        };
                    }
                }
                return levels[0];
            }
        };

        this.logger.info('StudentDashboard', 'Sistema de gamificación inicializado');
    }

    async renderDashboard() {
        try {
            this.dashboardState.isLoading = true;

            // Crear contenedor principal del dashboard
            const dashboardContainer = this.createDashboardContainer();

            // Aplicar tema actual
            this.applyTheme(this.dashboardState.currentTheme);

            // Renderizar widgets según el layout
            await this.renderWidgets(dashboardContainer);

            // Configurar interacciones
            this.setupDashboardInteractions(dashboardContainer);

            this.dashboardState.isLoading = false;
            this.dashboardState.lastSync = new Date();

            this.logger.info('StudentDashboard', 'Dashboard renderizado correctamente');

        } catch (error) {
            this.logger.error('StudentDashboard', 'Error al renderizar dashboard', error);
            this.dashboardState.isLoading = false;
        }
    }

    createDashboardContainer() {
        // Crear estructura base del dashboard
        const container = document.createElement('div');
        container.className = 'bge-student-dashboard';
        container.innerHTML = `
            <div class="dashboard-header">
                <div class="student-info">
                    <div class="avatar">
                        <img src="${this.studentData.profile?.avatar || '/images/default-avatar.png'}" alt="Avatar" />
                    </div>
                    <div class="greeting">
                        <h2>¡Hola, ${this.studentData.profile?.firstName || 'Estudiante'}!</h2>
                        <p class="current-time">${this.getCurrentGreeting()}</p>
                    </div>
                    <div class="level-indicator">
                        ${this.renderLevelIndicator()}
                    </div>
                </div>
                <div class="dashboard-controls">
                    <button class="refresh-btn" onclick="this.refreshAllWidgets()">
                        <i class="fas fa-refresh"></i>
                    </button>
                    <button class="settings-btn" onclick="this.openDashboardSettings()">
                        <i class="fas fa-cog"></i>
                    </button>
                </div>
            </div>
            <div class="dashboard-content">
                <div class="widgets-container" id="widgets-container">
                    <!-- Widgets se renderizan aquí -->
                </div>
            </div>
        `;

        // Agregar al DOM
        const targetElement = document.getElementById('dashboard-root') || document.body;
        targetElement.appendChild(container);

        return container;
    }

    async renderWidgets(container) {
        const widgetsContainer = container.querySelector('#widgets-container');
        widgetsContainer.className = `widgets-grid columns-${this.dashboardConfig.layout[this.dashboardState.deviceType].columns}`;

        // Renderizar widgets en el orden especificado
        for (const widgetId of this.dashboardState.widgetLayout) {
            const widget = this.widgetComponents.get(widgetId);
            if (widget) {
                const widgetElement = await widget.render();
                widgetsContainer.appendChild(widgetElement);
            }
        }
    }

    async renderWidget(widget) {
        try {
            // Crear elemento del widget si no existe
            if (!widget.element) {
                widget.element = document.createElement('div');
                widget.element.className = `widget widget-${widget.id} size-${widget.config.size}`;
                widget.element.setAttribute('data-widget-id', widget.id);
            }

            // Mostrar loading si está cargando
            if (widget.isLoading) {
                widget.element.innerHTML = this.renderWidgetLoading(widget);
                return widget.element;
            }

            // Renderizar contenido según el tipo de widget
            const content = await this.renderWidgetContent(widget);
            widget.element.innerHTML = content;

            // Agregar event listeners específicos del widget
            this.setupWidgetEventListeners(widget);

            return widget.element;

        } catch (error) {
            this.logger.error('StudentDashboard', `Error al renderizar widget ${widget.id}`, error);
            widget.element.innerHTML = this.renderWidgetError(widget, error);
            return widget.element;
        }
    }

    async renderWidgetContent(widget) {
        const config = widget.config;

        switch (config.type) {
            case 'stats':
                return this.renderStatsWidget(widget);

            case 'list':
                return this.renderListWidget(widget);

            case 'calendar':
                return this.renderCalendarWidget(widget);

            case 'chart':
                return this.renderChartWidget(widget);

            case 'badges':
                return this.renderBadgesWidget(widget);

            case 'actions':
                return this.renderActionsWidget(widget);

            case 'feed':
                return this.renderFeedWidget(widget);

            case 'gamification':
                return this.renderGamificationWidget(widget);

            default:
                return this.renderDefaultWidget(widget);
        }
    }

    renderStatsWidget(widget) {
        const stats = this.calculateQuickStats();

        return `
            <div class="widget-header">
                <h3>${widget.config.name}</h3>
                <div class="widget-actions">
                    <button class="refresh-widget" data-widget="${widget.id}">
                        <i class="fas fa-refresh"></i>
                    </button>
                </div>
            </div>
            <div class="widget-content stats-grid">
                <div class="stat-item">
                    <div class="stat-value">${stats.pendingAssignments}</div>
                    <div class="stat-label">Tareas Pendientes</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.upcomingEvaluations}</div>
                    <div class="stat-label">Evaluaciones Próximas</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.overallGrade.toFixed(1)}</div>
                    <div class="stat-label">Promedio General</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.attendanceRate}%</div>
                    <div class="stat-label">Asistencia</div>
                </div>
            </div>
        `;
    }

    renderListWidget(widget) {
        const assignments = this.studentData.assignments.slice(0, widget.config.maxItems);

        return `
            <div class="widget-header">
                <h3>${widget.config.name}</h3>
                <div class="widget-actions">
                    <button class="view-all" onclick="this.handleAction('view_all_assignments')">
                        Ver todas
                    </button>
                </div>
            </div>
            <div class="widget-content">
                <div class="assignment-list">
                    ${assignments.map(assignment => `
                        <div class="assignment-item ${this.getAssignmentPriority(assignment)}"
                             onclick="this.handleAction('view_assignment', '${assignment.id}')">
                            <div class="assignment-info">
                                <h4>${assignment.title}</h4>
                                <p class="subject">${assignment.subject}</p>
                                <p class="due-date">Vence: ${this.formatDueDate(assignment.dueDate)}</p>
                            </div>
                            <div class="assignment-status">
                                ${this.renderAssignmentStatus(assignment)}
                            </div>
                        </div>
                    `).join('')}
                </div>
                ${assignments.length === 0 ? '<p class="empty-state">¡No tienes tareas pendientes!</p>' : ''}
            </div>
        `;
    }

    renderCalendarWidget(widget) {
        const events = this.studentData.calendar.slice(0, widget.config.showDays);

        return `
            <div class="widget-header">
                <h3>${widget.config.name}</h3>
                <div class="widget-actions">
                    <button class="view-calendar" onclick="this.handleAction('view_calendar')">
                        Ver calendario
                    </button>
                </div>
            </div>
            <div class="widget-content">
                <div class="calendar-events">
                    ${events.map(event => `
                        <div class="calendar-event ${event.type}"
                             onclick="this.handleAction('view_calendar', '${event.id}')">
                            <div class="event-time">
                                <span class="date">${this.formatEventDate(event.date)}</span>
                                <span class="time">${this.formatEventTime(event.time)}</span>
                            </div>
                            <div class="event-info">
                                <h4>${event.title}</h4>
                                <p class="location">${event.location || 'Sin ubicación'}</p>
                            </div>
                            <div class="event-indicator">
                                <i class="fas ${this.getEventIcon(event.type)}"></i>
                            </div>
                        </div>
                    `).join('')}
                </div>
                ${events.length === 0 ? '<p class="empty-state">No hay eventos próximos</p>' : ''}
            </div>
        `;
    }

    renderChartWidget(widget) {
        const chartData = this.prepareProgressChartData();

        return `
            <div class="widget-header">
                <h3>${widget.config.name}</h3>
                <div class="widget-actions">
                    <select class="chart-period" onchange="this.changeChartPeriod(this.value)">
                        <option value="week">Esta semana</option>
                        <option value="month" selected>Este mes</option>
                        <option value="semester">Este semestre</option>
                    </select>
                </div>
            </div>
            <div class="widget-content">
                <div class="chart-container">
                    <canvas id="progress-chart-${widget.id}" width="400" height="200"></canvas>
                </div>
                <div class="chart-legend">
                    ${chartData.subjects.map(subject => `
                        <div class="legend-item">
                            <span class="color-indicator" style="background-color: ${subject.color}"></span>
                            <span class="subject-name">${subject.name}</span>
                            <span class="current-grade">${subject.currentGrade}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderBadgesWidget(widget) {
        const recentAchievements = this.studentData.achievements.slice(0, widget.config.showRecent);

        return `
            <div class="widget-header">
                <h3>${widget.config.name}</h3>
                <div class="widget-actions">
                    <button class="view-all" onclick="this.handleAction('view_achievements')">
                        Ver todos
                    </button>
                </div>
            </div>
            <div class="widget-content">
                <div class="achievements-grid">
                    ${recentAchievements.map(achievement => `
                        <div class="achievement-badge ${achievement.rarity}" title="${achievement.description}">
                            <div class="badge-icon">
                                <i class="fas ${achievement.icon}"></i>
                            </div>
                            <div class="badge-name">${achievement.name}</div>
                            <div class="badge-date">${this.formatAchievementDate(achievement.earnedDate)}</div>
                        </div>
                    `).join('')}
                </div>
                ${recentAchievements.length === 0 ? '<p class="empty-state">¡Sigue estudiando para ganar logros!</p>' : ''}
            </div>
        `;
    }

    renderActionsWidget(widget) {
        const actions = widget.config.actions;

        const actionButtons = {
            submit_assignment: { icon: 'fas fa-upload', label: 'Enviar Tarea', color: 'primary' },
            join_class: { icon: 'fas fa-video', label: 'Unirse a Clase', color: 'success' },
            view_grades: { icon: 'fas fa-chart-line', label: 'Ver Notas', color: 'info' },
            chat_teacher: { icon: 'fas fa-comments', label: 'Chat Profesor', color: 'warning' }
        };

        return `
            <div class="widget-header">
                <h3>${widget.config.name}</h3>
            </div>
            <div class="widget-content">
                <div class="quick-actions-grid">
                    ${actions.map(actionId => {
                        const action = actionButtons[actionId];
                        return `
                            <button class="quick-action-btn ${action.color}"
                                    onclick="this.handleAction('${actionId}')">
                                <i class="${action.icon}"></i>
                                <span>${action.label}</span>
                            </button>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    renderFeedWidget(widget) {
        const announcements = this.getRecentAnnouncements(widget.config.maxItems);

        return `
            <div class="widget-header">
                <h3>${widget.config.name}</h3>
                <div class="widget-actions">
                    <button class="view-all" onclick="this.handleAction('view_announcements')">
                        Ver todos
                    </button>
                </div>
            </div>
            <div class="widget-content">
                <div class="announcements-feed">
                    ${announcements.map(announcement => `
                        <div class="announcement-item ${announcement.priority}"
                             onclick="this.handleAction('view_announcement', '${announcement.id}')">
                            <div class="announcement-header">
                                <h4>${announcement.title}</h4>
                                <span class="announcement-date">${this.formatAnnouncementDate(announcement.date)}</span>
                            </div>
                            <p class="announcement-excerpt">${announcement.excerpt}</p>
                            <div class="announcement-footer">
                                <span class="author">Por ${announcement.author}</span>
                                ${announcement.isNew ? '<span class="new-badge">Nuevo</span>' : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
                ${announcements.length === 0 ? '<p class="empty-state">No hay avisos recientes</p>' : ''}
            </div>
        `;
    }

    renderGamificationWidget(widget) {
        const level = this.gamification.calculateLevel(this.studentData.profile?.xp || 0);
        const streak = this.studentData.studyStreak;

        return `
            <div class="widget-header">
                <h3>${widget.config.name}</h3>
            </div>
            <div class="widget-content">
                <div class="gamification-content">
                    <div class="level-section">
                        <div class="level-badge" style="background-color: ${level.color}">
                            <span class="level-number">${level.level}</span>
                        </div>
                        <div class="level-info">
                            <h4>${level.name}</h4>
                            <div class="xp-bar">
                                <div class="xp-progress" style="width: ${level.progress * 100}%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="streak-section">
                        <div class="streak-icon">
                            <i class="fas fa-fire"></i>
                        </div>
                        <div class="streak-info">
                            <div class="streak-number">${streak}</div>
                            <div class="streak-label">días seguidos</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderWidgetLoading(widget) {
        return `
            <div class="widget-header">
                <h3>${widget.config.name}</h3>
            </div>
            <div class="widget-content loading">
                <div class="loading-spinner"></div>
                <p>Cargando...</p>
            </div>
        `;
    }

    renderWidgetError(widget, error) {
        return `
            <div class="widget-header">
                <h3>${widget.config.name}</h3>
                <div class="widget-actions">
                    <button class="retry-widget" onclick="this.retryWidget('${widget.id}')">
                        <i class="fas fa-retry"></i>
                    </button>
                </div>
            </div>
            <div class="widget-content error">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <p>Error al cargar datos</p>
                <button class="retry-btn" onclick="this.retryWidget('${widget.id}')">
                    Reintentar
                </button>
            </div>
        `;
    }

    /**
     * Métodos de datos y cálculos
     */

    calculateQuickStats() {
        const pendingAssignments = this.studentData.assignments.filter(a => !a.completed).length;
        const upcomingEvaluations = this.studentData.evaluations.length;

        const grades = this.studentData.grades.filter(g => this.isCurrentPeriod(g.period));
        const overallGrade = grades.length > 0 ?
            grades.reduce((sum, g) => sum + g.value, 0) / grades.length :
            0;

        const attendanceRate = this.studentData.attendance.stats?.rate || 100;

        return {
            pendingAssignments,
            upcomingEvaluations,
            overallGrade,
            attendanceRate
        };
    }

    calculateStudyStreak() {
        // Calcular racha de días estudiando basado en actividad
        const activities = this.getStudentActivities();
        let streak = 0;
        const currentDate = new Date();

        for (let i = 0; i < 30; i++) { // Máximo 30 días
            const dateStr = currentDate.toISOString().split('T')[0];
            const hasActivity = activities.some(activity =>
                activity.date.startsWith(dateStr) && activity.type === 'study'
            );

            if (hasActivity) {
                streak++;
            } else {
                break;
            }

            currentDate.setDate(currentDate.getDate() - 1);
        }

        return streak;
    }

    calculateAttendanceStats(attendance) {
        const currentMonth = attendance.currentMonth || {};
        const totalDays = Object.keys(currentMonth).length;
        const presentDays = Object.values(currentMonth).filter(status => status === 'present').length;

        return {
            rate: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100,
            totalDays,
            presentDays,
            absentDays: totalDays - presentDays
        };
    }

    prepareProgressChartData() {
        // Preparar datos para el gráfico de progreso
        const subjects = ['Matemáticas', 'Español', 'Historia', 'Ciencias', 'Inglés'];

        return {
            subjects: subjects.map((subject, index) => ({
                name: subject,
                currentGrade: this.getSubjectGrade(subject),
                color: this.getSubjectColor(index),
                data: this.getSubjectProgressData(subject)
            })),
            labels: this.getProgressLabels()
        };
    }

    getSubjectGrade(subject) {
        const grades = this.studentData.grades.filter(g =>
            g.subject === subject && this.isCurrentPeriod(g.period)
        );

        if (grades.length === 0) return 'N/A';

        const average = grades.reduce((sum, g) => sum + g.value, 0) / grades.length;
        return average.toFixed(1);
    }

    getSubjectColor(index) {
        const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'];
        return colors[index % colors.length];
    }

    getSubjectProgressData(subject) {
        // Datos de progreso del último mes para el subject
        const grades = this.studentData.grades
            .filter(g => g.subject === subject)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(-5); // Últimas 5 calificaciones

        return grades.map(g => g.value);
    }

    getProgressLabels() {
        // Etiquetas para el gráfico (últimas 5 semanas)
        const labels = [];
        const now = new Date();

        for (let i = 4; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - (i * 7));
            labels.push(this.formatWeekLabel(date));
        }

        return labels;
    }

    /**
     * Métodos de utilidad y formateo
     */

    getCurrentGreeting() {
        const hour = new Date().getHours();

        if (hour < 12) {
            return 'Buenos días';
        } else if (hour < 18) {
            return 'Buenas tardes';
        } else {
            return 'Buenas noches';
        }
    }

    renderLevelIndicator() {
        const level = this.gamification.calculateLevel(this.studentData.profile?.xp || 0);

        return `
            <div class="level-indicator">
                <div class="level-badge" style="background-color: ${level.color}">
                    ${level.level}
                </div>
                <div class="level-name">${level.name}</div>
            </div>
        `;
    }

    getAssignmentPriority(assignment) {
        const now = new Date();
        const dueDate = new Date(assignment.dueDate);
        const daysDiff = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

        if (daysDiff < 0) return 'overdue';
        if (daysDiff <= 1) return 'urgent';
        if (daysDiff <= 3) return 'important';
        return 'normal';
    }

    formatDueDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'Vencida';
        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Mañana';
        if (diffDays <= 7) return `En ${diffDays} días`;

        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short'
        });
    }

    renderAssignmentStatus(assignment) {
        if (assignment.completed) {
            return '<span class="status completed"><i class="fas fa-check"></i> Completada</span>';
        }

        const priority = this.getAssignmentPriority(assignment);
        const icons = {
            overdue: 'fas fa-exclamation-triangle',
            urgent: 'fas fa-clock',
            important: 'fas fa-hourglass-half',
            normal: 'fas fa-circle'
        };

        return `<span class="status ${priority}"><i class="${icons[priority]}"></i></span>`;
    }

    formatEventDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Mañana';

        return date.toLocaleDateString('es-ES', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
    }

    formatEventTime(timeString) {
        if (!timeString) return '';

        const time = new Date(`2000-01-01 ${timeString}`);
        return time.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getEventIcon(eventType) {
        const icons = {
            class: 'fa-chalkboard-teacher',
            evaluation: 'fa-clipboard-check',
            assignment: 'fa-tasks',
            meeting: 'fa-users',
            event: 'fa-calendar-day'
        };

        return icons[eventType] || 'fa-calendar';
    }

    /**
     * Métodos de interacción y eventos
     */

    async handleAction(actionId, data = null) {
        try {
            const handler = this.actionHandlers.get(actionId);

            if (handler) {
                await handler(data);
            } else {
                this.logger.warn('StudentDashboard', `Handler no encontrado para acción: ${actionId}`);
            }

        } catch (error) {
            this.logger.error('StudentDashboard', `Error al ejecutar acción ${actionId}`, error);
        }
    }

    async refreshWidget(widget) {
        try {
            widget.isLoading = true;
            await widget.render();

            // Simular carga de datos
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Recargar datos específicos del widget
            await this.loadWidgetData(widget);

            widget.isLoading = false;
            widget.lastUpdate = new Date();

            await widget.render();

            this.logger.debug('StudentDashboard', `Widget ${widget.id} actualizado`);

        } catch (error) {
            widget.isLoading = false;
            this.logger.error('StudentDashboard', `Error al actualizar widget ${widget.id}`, error);
        }
    }

    async loadWidgetData(widget) {
        // Cargar datos específicos según el tipo de widget
        switch (widget.id) {
            case 'assignments':
                this.studentData.assignments = await this.loadAssignments();
                break;

            case 'calendar':
                this.studentData.calendar = await this.loadCalendarEvents();
                break;

            case 'progress':
                this.studentData.grades = await this.loadGrades();
                break;

            case 'achievements':
                this.studentData.achievements = await this.loadAchievements();
                break;

            case 'announcements':
                // Cargar avisos más recientes
                break;

            default:
                // Refresh general
                break;
        }
    }

    async refreshAllWidgets() {
        this.logger.info('StudentDashboard', 'Actualizando todos los widgets');

        const refreshPromises = Array.from(this.widgetComponents.values()).map(widget =>
            widget.refresh()
        );

        try {
            await Promise.allSettled(refreshPromises);
            this.dashboardState.lastSync = new Date();
        } catch (error) {
            this.logger.error('StudentDashboard', 'Error al actualizar widgets', error);
        }
    }

    // Métodos auxiliares para datos de ejemplo
    loadSampleData() {
        this.studentData = {
            profile: {
                firstName: 'Juan',
                lastName: 'Pérez',
                avatar: '/images/sample-avatar.png',
                xp: 450
            },
            assignments: [
                {
                    id: '1',
                    title: 'Ensayo sobre la Revolución Mexicana',
                    subject: 'Historia',
                    dueDate: '2025-09-25T23:59:00Z',
                    completed: false
                },
                {
                    id: '2',
                    title: 'Problemas de álgebra',
                    subject: 'Matemáticas',
                    dueDate: '2025-09-23T23:59:00Z',
                    completed: false
                }
            ],
            evaluations: [
                {
                    id: '1',
                    title: 'Examen de Historia',
                    subject: 'Historia',
                    date: '2025-09-28T10:00:00Z'
                }
            ],
            grades: [
                { subject: 'Matemáticas', value: 85, period: 'current', date: '2025-09-20' },
                { subject: 'Historia', value: 90, period: 'current', date: '2025-09-18' }
            ],
            attendance: {
                currentMonth: {
                    '2025-09-01': 'present',
                    '2025-09-02': 'present',
                    '2025-09-03': 'absent'
                }
            },
            achievements: [
                {
                    id: '1',
                    name: 'Primera Tarea',
                    description: 'Completa tu primera tarea',
                    icon: 'fa-trophy',
                    rarity: 'common',
                    earnedDate: '2025-09-20'
                }
            ],
            studyStreak: 5,
            calendar: [
                {
                    id: '1',
                    title: 'Clase de Matemáticas',
                    type: 'class',
                    date: '2025-09-23',
                    time: '10:00',
                    location: 'Aula 201'
                }
            ]
        };
    }

    isRecentlyCompleted(assignment) {
        if (!assignment.completed) return false;

        const completedDate = new Date(assignment.completedDate);
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

        return completedDate >= threeDaysAgo;
    }

    isCurrentPeriod(period) {
        return period === 'current' || period === '2025-1';
    }

    getStudentActivities() {
        // Simular actividades del estudiante
        return [
            { date: '2025-09-22', type: 'study' },
            { date: '2025-09-21', type: 'study' },
            { date: '2025-09-20', type: 'assignment' }
        ];
    }

    getRecentAnnouncements(limit) {
        // Datos de ejemplo para avisos
        return [
            {
                id: '1',
                title: 'Suspensión de clases',
                excerpt: 'Las clases del viernes 25 de septiembre se suspenden...',
                author: 'Dirección',
                date: '2025-09-22',
                priority: 'high',
                isNew: true
            }
        ].slice(0, limit);
    }

    formatAchievementDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }

    formatAnnouncementDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatWeekLabel(date) {
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }

    setupWidgetEventListeners(widget) {
        // Configurar event listeners específicos para cada widget
        const element = widget.element;

        // Refresh button
        const refreshBtn = element.querySelector('.refresh-widget');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => widget.refresh());
        }
    }

    setupDashboardInteractions(container) {
        // Configurar interacciones globales del dashboard
        container.addEventListener('click', (event) => {
            const target = event.target;

            // Delegar eventos basado en clases
            if (target.classList.contains('refresh-widget')) {
                const widgetId = target.getAttribute('data-widget');
                const widget = this.widgetComponents.get(widgetId);
                if (widget) widget.refresh();
            }
        });
    }

    handleScreenResize() {
        // Manejar cambios de tamaño de pantalla
        const newDeviceType = this.determineDeviceType();

        if (newDeviceType !== this.dashboardState.deviceType) {
            this.dashboardState.deviceType = newDeviceType;
            this.renderDashboard();
        }
    }

    determineDeviceType() {
        const screenWidth = window.innerWidth;

        if (screenWidth >= 1024) return 'desktop';
        if (screenWidth >= 768) return 'tablet';
        return 'mobile';
    }

    applyTheme(themeName) {
        const theme = this.dashboardConfig.themes[themeName];
        if (!theme) return;

        const root = document.documentElement;
        root.style.setProperty('--primary-color', theme.primaryColor);
        root.style.setProperty('--background-color', theme.backgroundColor);
        root.style.setProperty('--card-color', theme.cardColor);
        root.style.setProperty('--text-color', theme.textColor);
        root.style.setProperty('--accent-color', theme.accentColor);
    }

    /**
     * API pública
     */

    async updateTheme(themeName) {
        this.dashboardState.currentTheme = themeName;
        this.applyTheme(themeName);

        // Guardar preferencia
        this.studentData.preferences.theme = themeName;
        await this.saveUserPreferences();
    }

    async saveUserPreferences() {
        try {
            await this.mobileArch.setData(
                'dashboard_preferences',
                'user_data',
                this.studentData.preferences
            );
        } catch (error) {
            this.logger.error('StudentDashboard', 'Error al guardar preferencias', error);
        }
    }

    getDashboardMetrics() {
        return {
            widgetsCount: this.widgetComponents.size,
            lastSync: this.dashboardState.lastSync,
            theme: this.dashboardState.currentTheme,
            deviceType: this.dashboardState.deviceType,
            refreshTimers: this.dashboardState.refreshTimers.size
        };
    }

    async addCustomWidget(widgetConfig) {
        const widget = await this.createWidget(widgetConfig.id, widgetConfig);
        this.widgetComponents.set(widgetConfig.id, widget);

        // Agregar al layout
        this.dashboardState.widgetLayout.push(widgetConfig.id);

        // Re-renderizar
        await this.renderDashboard();

        return widget;
    }

    removeWidget(widgetId) {
        const widget = this.widgetComponents.get(widgetId);
        if (widget) {
            // Limpiar timer si existe
            const timer = this.dashboardState.refreshTimers.get(widgetId);
            if (timer) {
                clearInterval(timer);
                this.dashboardState.refreshTimers.delete(widgetId);
            }

            // Remover del DOM
            if (widget.element && widget.element.parentNode) {
                widget.element.parentNode.removeChild(widget.element);
            }

            // Remover del layout
            const index = this.dashboardState.widgetLayout.indexOf(widgetId);
            if (index > -1) {
                this.dashboardState.widgetLayout.splice(index, 1);
            }

            // Remover del registro
            this.widgetComponents.delete(widgetId);

            return true;
        }

        return false;
    }

    async retryWidget(widgetId) {
        const widget = this.widgetComponents.get(widgetId);
        if (widget) {
            await widget.refresh();
        }
    }

    openDashboardSettings() {
        this.mobileArch.navigateTo('settings/dashboard');
    }
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BGEMobileStudentDashboard;
} else if (typeof window !== 'undefined') {
    window.BGEMobileStudentDashboard = BGEMobileStudentDashboard;
}