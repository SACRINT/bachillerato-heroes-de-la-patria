/**
 * DASHBOARD PERSONALIZER - Sistema de Personalización de Dashboard
 * Bachillerato General Estatal "Héroes de la Patria"
 * Versión 1.0 - Septiembre 2025
 *
 * Sistema completo de personalización del dashboard con:
 * - Widgets configurables y reutilizables
 * - Drag & drop para reorganización
 * - Layouts adaptativos y responsive
 * - Preferencias de usuario avanzadas
 * - Sistema de favoritos y accesos rápidos
 */

class DashboardPersonalizer {
    constructor() {
        this.widgets = new Map();
        this.layouts = new Map();
        this.userPreferences = null;
        this.dragElement = null;
        this.touchStartPos = null;

        console.log('🎨 Dashboard Personalizer initializing...');

        this.init();
    }

    async init() {
        await this.loadUserPreferences();
        await this.loadAvailableWidgets();
        this.setupDragAndDrop();
        this.createPersonalizationUI();
        this.restoreUserLayout();

        console.log('✅ Dashboard Personalizer ready');
    }

    // === GESTIÓN DE PREFERENCIAS ===
    async loadUserPreferences() {
        try {
            const saved = localStorage.getItem('heroesPatria_dashboardPreferences');
            this.userPreferences = saved ? JSON.parse(saved) : this.getDefaultPreferences();

            console.log('📋 User preferences loaded:', this.userPreferences);
        } catch (error) {
            console.warn('⚠️ Failed to load preferences, using defaults:', error);
            this.userPreferences = this.getDefaultPreferences();
        }
    }

    getDefaultPreferences() {
        return {
            layout: 'grid-3-columns',
            theme: 'auto',
            density: 'comfortable',
            widgets: {
                'quick-stats': { enabled: true, position: 0, size: 'medium' },
                'recent-news': { enabled: true, position: 1, size: 'large' },
                'upcoming-events': { enabled: true, position: 2, size: 'medium' },
                'weather': { enabled: false, position: 3, size: 'small' },
                'calendar': { enabled: true, position: 4, size: 'large' },
                'notifications': { enabled: true, position: 5, size: 'medium' },
                'quick-access': { enabled: true, position: 6, size: 'small' },
                'performance': { enabled: false, position: 7, size: 'medium' }
            },
            quickAccess: [
                { title: 'Calificaciones', url: './calificaciones.html', icon: 'fas fa-chart-line' },
                { title: 'Horarios', url: './estudiantes.html', icon: 'fas fa-clock' },
                { title: 'Contacto', url: './contacto.html', icon: 'fas fa-envelope' }
            ],
            autoRefresh: true,
            refreshInterval: 300000, // 5 minutes
            animations: true
        };
    }

    saveUserPreferences() {
        try {
            localStorage.setItem('heroesPatria_dashboardPreferences', JSON.stringify(this.userPreferences));
            console.log('💾 User preferences saved');
        } catch (error) {
            console.error('❌ Failed to save preferences:', error);
        }
    }

    // === SISTEMA DE WIDGETS ===
    async loadAvailableWidgets() {
        const widgetDefinitions = {
            'quick-stats': {
                id: 'quick-stats',
                title: 'Estadísticas Rápidas',
                description: 'Métricas importantes del sistema',
                icon: 'fas fa-chart-bar',
                category: 'analytics',
                sizes: ['small', 'medium', 'large'],
                refreshInterval: 60000,
                component: this.createQuickStatsWidget.bind(this)
            },
            'recent-news': {
                id: 'recent-news',
                title: 'Noticias Recientes',
                description: 'Últimas noticias y comunicados',
                icon: 'fas fa-newspaper',
                category: 'content',
                sizes: ['medium', 'large'],
                refreshInterval: 300000,
                component: this.createRecentNewsWidget.bind(this)
            },
            'upcoming-events': {
                id: 'upcoming-events',
                title: 'Próximos Eventos',
                description: 'Eventos y fechas importantes',
                icon: 'fas fa-calendar-alt',
                category: 'academic',
                sizes: ['medium', 'large'],
                refreshInterval: 600000,
                component: this.createUpcomingEventsWidget.bind(this)
            },
            'weather': {
                id: 'weather',
                title: 'Clima',
                description: 'Condiciones meteorológicas actuales',
                icon: 'fas fa-cloud-sun',
                category: 'utilities',
                sizes: ['small', 'medium'],
                refreshInterval: 1800000,
                component: this.createWeatherWidget.bind(this)
            },
            'calendar': {
                id: 'calendar',
                title: 'Calendario',
                description: 'Vista del calendario académico',
                icon: 'fas fa-calendar',
                category: 'academic',
                sizes: ['large'],
                refreshInterval: 3600000,
                component: this.createCalendarWidget.bind(this)
            },
            'notifications': {
                id: 'notifications',
                title: 'Notificaciones',
                description: 'Centro de notificaciones',
                icon: 'fas fa-bell',
                category: 'system',
                sizes: ['medium', 'large'],
                refreshInterval: 30000,
                component: this.createNotificationsWidget.bind(this)
            },
            'quick-access': {
                id: 'quick-access',
                title: 'Accesos Rápidos',
                description: 'Enlaces frecuentes personalizables',
                icon: 'fas fa-star',
                category: 'utilities',
                sizes: ['small', 'medium'],
                refreshInterval: 0,
                component: this.createQuickAccessWidget.bind(this)
            },
            'performance': {
                id: 'performance',
                title: 'Rendimiento',
                description: 'Métricas de performance del sitio',
                icon: 'fas fa-tachometer-alt',
                category: 'system',
                sizes: ['medium', 'large'],
                refreshInterval: 120000,
                component: this.createPerformanceWidget.bind(this)
            }
        };

        // Store widget definitions
        for (const [id, widget] of Object.entries(widgetDefinitions)) {
            this.widgets.set(id, widget);
        }

        console.log(`🧩 ${this.widgets.size} widgets loaded`);
    }

    // === COMPONENTES DE WIDGETS ===
    createQuickStatsWidget(container, size = 'medium') {
        const stats = this.getQuickStats();

        container.innerHTML = `
            <div class="widget-content quick-stats-content">
                <div class="stats-grid stats-${size}">
                    <div class="stat-item">
                        <div class="stat-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-number">${stats.totalUsers}</span>
                            <span class="stat-label">Usuarios Activos</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon">
                            <i class="fas fa-newspaper"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-number">${stats.totalNews}</span>
                            <span class="stat-label">Noticias</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon">
                            <i class="fas fa-calendar-check"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-number">${stats.upcomingEvents}</span>
                            <span class="stat-label">Eventos</span>
                        </div>
                    </div>
                    ${size === 'large' ? `
                    <div class="stat-item">
                        <div class="stat-icon">
                            <i class="fas fa-download"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-number">${stats.downloads}</span>
                            <span class="stat-label">Descargas</span>
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    createRecentNewsWidget(container, size = 'medium') {
        this.fetchRecentNews().then(news => {
            const itemsToShow = size === 'large' ? 5 : 3;

            container.innerHTML = `
                <div class="widget-content news-content">
                    <div class="news-list">
                        ${news.slice(0, itemsToShow).map(item => `
                            <div class="news-item" onclick="window.open('${item.url}', '_blank')">
                                <div class="news-meta">
                                    <span class="news-date">${this.formatDate(item.fecha)}</span>
                                    <span class="news-category">${item.categoria || 'General'}</span>
                                </div>
                                <h5 class="news-title">${item.titulo}</h5>
                                <p class="news-excerpt">${item.resumen || item.contenido.substring(0, 100)}...</p>
                            </div>
                        `).join('')}
                    </div>
                    <div class="widget-footer">
                        <a href="./index.html#noticias" class="view-all-link">Ver todas las noticias</a>
                    </div>
                </div>
            `;
        });
    }

    createUpcomingEventsWidget(container, size = 'medium') {
        this.fetchUpcomingEvents().then(events => {
            const itemsToShow = size === 'large' ? 4 : 2;

            container.innerHTML = `
                <div class="widget-content events-content">
                    <div class="events-list">
                        ${events.slice(0, itemsToShow).map(event => `
                            <div class="event-item">
                                <div class="event-date">
                                    <span class="event-day">${new Date(event.fecha).getDate()}</span>
                                    <span class="event-month">${this.getMonthName(new Date(event.fecha).getMonth())}</span>
                                </div>
                                <div class="event-info">
                                    <h6 class="event-title">${event.titulo}</h6>
                                    <p class="event-description">${event.descripcion}</p>
                                    <span class="event-time">${event.hora || '09:00'}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="widget-footer">
                        <a href="./calendario.html" class="view-all-link">Ver calendario completo</a>
                    </div>
                </div>
            `;
        });
    }

    createWeatherWidget(container, size = 'small') {
        // Simulate weather data - in production would use real API
        const weather = {
            temperature: 24,
            condition: 'sunny',
            humidity: 65,
            location: 'Guadalajara, JAL'
        };

        container.innerHTML = `
            <div class="widget-content weather-content">
                <div class="weather-main">
                    <div class="weather-icon">
                        <i class="fas fa-sun"></i>
                    </div>
                    <div class="weather-temp">
                        <span class="temp-value">${weather.temperature}</span>
                        <span class="temp-unit">°C</span>
                    </div>
                </div>
                <div class="weather-info">
                    <p class="weather-location">${weather.location}</p>
                    ${size === 'medium' ? `
                    <div class="weather-details">
                        <span>Humedad: ${weather.humidity}%</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    createCalendarWidget(container, size = 'large') {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        container.innerHTML = `
            <div class="widget-content calendar-content">
                <div class="calendar-header">
                    <h5>${this.getMonthName(currentMonth)} ${currentYear}</h5>
                </div>
                <div class="calendar-grid">
                    ${this.generateCalendarGrid(currentYear, currentMonth)}
                </div>
                <div class="widget-footer">
                    <a href="./calendario.html" class="view-all-link">Ver calendario completo</a>
                </div>
            </div>
        `;
    }

    createNotificationsWidget(container, size = 'medium') {
        const notifications = this.getRecentNotifications();
        const itemsToShow = size === 'large' ? 5 : 3;

        container.innerHTML = `
            <div class="widget-content notifications-content">
                <div class="notifications-list">
                    ${notifications.slice(0, itemsToShow).map(notif => `
                        <div class="notification-item ${notif.read ? 'read' : 'unread'}">
                            <div class="notif-icon">
                                <i class="${notif.icon}"></i>
                            </div>
                            <div class="notif-content">
                                <p class="notif-title">${notif.title}</p>
                                <p class="notif-message">${notif.message}</p>
                                <span class="notif-time">${this.formatTimeAgo(notif.timestamp)}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="widget-footer">
                    <button onclick="window.notificationConfigUI?.openConfigPanel()" class="view-all-link">Gestionar notificaciones</button>
                </div>
            </div>
        `;
    }

    createQuickAccessWidget(container, size = 'small') {
        const quickAccess = this.userPreferences.quickAccess;

        container.innerHTML = `
            <div class="widget-content quick-access-content">
                <div class="quick-access-grid quick-access-${size}">
                    ${quickAccess.map(item => `
                        <a href="${item.url}" class="quick-access-item" title="${item.title}">
                            <i class="${item.icon}"></i>
                            <span>${item.title}</span>
                        </a>
                    `).join('')}
                </div>
                <div class="widget-footer">
                    <button onclick="window.dashboardPersonalizer?.editQuickAccess()" class="edit-link">Editar accesos</button>
                </div>
            </div>
        `;
    }

    createPerformanceWidget(container, size = 'medium') {
        const performance = this.getPerformanceMetrics();

        container.innerHTML = `
            <div class="widget-content performance-content">
                <div class="performance-metrics">
                    <div class="metric-item">
                        <span class="metric-label">Carga de página</span>
                        <div class="metric-bar">
                            <div class="metric-fill" style="width: ${performance.pageLoad}%"></div>
                        </div>
                        <span class="metric-value">${performance.pageLoadTime}ms</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">Rendimiento</span>
                        <div class="metric-bar">
                            <div class="metric-fill" style="width: ${performance.performance}%"></div>
                        </div>
                        <span class="metric-value">${performance.performance}%</span>
                    </div>
                    ${size === 'large' ? `
                    <div class="metric-item">
                        <span class="metric-label">Lighthouse Score</span>
                        <div class="metric-bar">
                            <div class="metric-fill" style="width: ${performance.lighthouse}%"></div>
                        </div>
                        <span class="metric-value">${performance.lighthouse}/100</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // === GESTIÓN DE LAYOUT ===
    restoreUserLayout() {
        const dashboardContainer = document.querySelector('.dashboard-widgets-container');
        if (!dashboardContainer) {
            console.log('🎨 Dashboard container not found, creating personalization UI only');
            return; // Salir silenciosamente si no hay dashboard, pero el botón ya se creó
        }

        // Apply layout class
        dashboardContainer.className = `dashboard-widgets-container layout-${this.userPreferences.layout}`;

        // Clear existing widgets
        dashboardContainer.innerHTML = '';

        // Sort widgets by position
        const enabledWidgets = Object.entries(this.userPreferences.widgets)
            .filter(([id, config]) => config.enabled)
            .sort(([, a], [, b]) => a.position - b.position);

        // Create widgets
        enabledWidgets.forEach(([widgetId, config]) => {
            this.createWidget(widgetId, config);
        });

        console.log(`🎨 Layout restored: ${enabledWidgets.length} widgets`);
    }

    createDashboardContainer() {
        // Find the main content area
        const mainContent = document.querySelector('main') || document.querySelector('.container-fluid') || document.body;

        const dashboardContainer = document.createElement('div');
        dashboardContainer.className = `dashboard-widgets-container layout-${this.userPreferences.layout}`;
        dashboardContainer.id = 'dashboardWidgets';

        // Add to the page
        const targetElement = document.querySelector('.hero-section') || mainContent.firstElementChild;
        if (targetElement && targetElement.nextSibling) {
            mainContent.insertBefore(dashboardContainer, targetElement.nextSibling);
        } else {
            mainContent.appendChild(dashboardContainer);
        }

        this.addDashboardStyles();
    }

    createWidget(widgetId, config) {
        const widgetDef = this.widgets.get(widgetId);
        if (!widgetDef) {
            console.warn(`⚠️ Widget definition not found: ${widgetId}`);
            return;
        }

        const container = document.querySelector('.dashboard-widgets-container');
        const widgetElement = document.createElement('div');
        widgetElement.className = `dashboard-widget widget-${widgetId} widget-size-${config.size}`;
        widgetElement.dataset.widgetId = widgetId;
        widgetElement.dataset.position = config.position;

        widgetElement.innerHTML = `
            <div class="widget-header">
                <div class="widget-title">
                    <i class="${widgetDef.icon}"></i>
                    <span>${widgetDef.title}</span>
                </div>
                <div class="widget-controls">
                    <button class="widget-control" onclick="window.dashboardPersonalizer?.refreshWidget('${widgetId}')" title="Actualizar">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                    <button class="widget-control" onclick="window.dashboardPersonalizer?.configureWidget('${widgetId}')" title="Configurar">
                        <i class="fas fa-cog"></i>
                    </button>
                    <button class="widget-control widget-drag-handle" title="Mover">
                        <i class="fas fa-grip-vertical"></i>
                    </button>
                </div>
            </div>
            <div class="widget-body" id="widget-body-${widgetId}">
                <div class="widget-loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Cargando...</span>
                </div>
            </div>
        `;

        container.appendChild(widgetElement);

        // Load widget content
        setTimeout(() => {
            const widgetBody = document.getElementById(`widget-body-${widgetId}`);
            if (widgetBody && widgetDef.component) {
                widgetDef.component(widgetBody, config.size);
            }
        }, 100);

        // Setup auto-refresh if configured
        if (widgetDef.refreshInterval > 0 && this.userPreferences.autoRefresh) {
            setInterval(() => {
                this.refreshWidget(widgetId);
            }, widgetDef.refreshInterval);
        }
    }

    // === DRAG & DROP ===
    setupDragAndDrop() {
        document.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));

        // Touch events for mobile
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    handleMouseDown(e) {
        if (e.target.closest('.widget-drag-handle')) {
            e.preventDefault();
            this.startDrag(e.target.closest('.dashboard-widget'), e.clientX, e.clientY);
        }
    }

    handleMouseMove(e) {
        if (this.dragElement) {
            e.preventDefault();
            this.updateDragPosition(e.clientX, e.clientY);
        }
    }

    handleMouseUp(e) {
        if (this.dragElement) {
            this.endDrag(e.clientX, e.clientY);
        }
    }

    handleTouchStart(e) {
        if (e.target.closest('.widget-drag-handle')) {
            e.preventDefault();
            const touch = e.touches[0];
            this.touchStartPos = { x: touch.clientX, y: touch.clientY };
            this.startDrag(e.target.closest('.dashboard-widget'), touch.clientX, touch.clientY);
        }
    }

    handleTouchMove(e) {
        if (this.dragElement) {
            e.preventDefault();
            const touch = e.touches[0];
            this.updateDragPosition(touch.clientX, touch.clientY);
        }
    }

    handleTouchEnd(e) {
        if (this.dragElement) {
            const touch = e.changedTouches[0];
            this.endDrag(touch.clientX, touch.clientY);
            this.touchStartPos = null;
        }
    }

    startDrag(widget, x, y) {
        this.dragElement = widget;
        widget.classList.add('dragging');

        // Create drag ghost
        const ghost = widget.cloneNode(true);
        ghost.classList.add('drag-ghost');
        ghost.style.position = 'fixed';
        ghost.style.pointerEvents = 'none';
        ghost.style.zIndex = '9999';
        ghost.style.opacity = '0.8';
        ghost.style.transform = 'rotate(3deg)';
        document.body.appendChild(ghost);

        this.dragGhost = ghost;
        this.updateDragPosition(x, y);

        // Add visual feedback
        document.body.classList.add('dragging-active');
    }

    updateDragPosition(x, y) {
        if (this.dragGhost) {
            this.dragGhost.style.left = (x - 150) + 'px';
            this.dragGhost.style.top = (y - 50) + 'px';
        }

        // Find drop target
        const dropTarget = this.findDropTarget(x, y);
        document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
        if (dropTarget) {
            dropTarget.classList.add('drop-target');
        }
    }

    endDrag(x, y) {
        if (!this.dragElement) return;

        const dropTarget = this.findDropTarget(x, y);

        if (dropTarget && dropTarget !== this.dragElement) {
            this.swapWidgets(this.dragElement, dropTarget);
        }

        // Cleanup
        this.dragElement.classList.remove('dragging');
        if (this.dragGhost) {
            this.dragGhost.remove();
            this.dragGhost = null;
        }

        document.body.classList.remove('dragging-active');
        document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));

        this.dragElement = null;
    }

    findDropTarget(x, y) {
        const widgets = document.querySelectorAll('.dashboard-widget:not(.dragging)');

        for (const widget of widgets) {
            const rect = widget.getBoundingClientRect();
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                return widget;
            }
        }

        return null;
    }

    swapWidgets(widget1, widget2) {
        const widget1Id = widget1.dataset.widgetId;
        const widget2Id = widget2.dataset.widgetId;

        const widget1Pos = parseInt(widget1.dataset.position);
        const widget2Pos = parseInt(widget2.dataset.position);

        // Update positions in preferences
        this.userPreferences.widgets[widget1Id].position = widget2Pos;
        this.userPreferences.widgets[widget2Id].position = widget1Pos;

        // Update DOM
        widget1.dataset.position = widget2Pos;
        widget2.dataset.position = widget1Pos;

        // Reorder in DOM
        const container = widget1.parentNode;
        const widget1Next = widget1.nextSibling;
        const widget2Next = widget2.nextSibling;

        if (widget1Next) {
            container.insertBefore(widget2, widget1Next);
        } else {
            container.appendChild(widget2);
        }

        if (widget2Next) {
            container.insertBefore(widget1, widget2Next);
        } else {
            container.appendChild(widget1);
        }

        this.saveUserPreferences();
        console.log('🔄 Widgets swapped:', widget1Id, '↔', widget2Id);
    }

    // === ACCIONES DE WIDGETS ===
    refreshWidget(widgetId) {
        const widgetBody = document.getElementById(`widget-body-${widgetId}`);
        const widgetDef = this.widgets.get(widgetId);
        const config = this.userPreferences.widgets[widgetId];

        if (widgetBody && widgetDef && config) {
            widgetBody.innerHTML = '<div class="widget-loading"><i class="fas fa-spinner fa-spin"></i><span>Actualizando...</span></div>';

            setTimeout(() => {
                widgetDef.component(widgetBody, config.size);
            }, 500);
        }
    }

    configureWidget(widgetId) {
        const widgetDef = this.widgets.get(widgetId);
        const config = this.userPreferences.widgets[widgetId];

        if (!widgetDef || !config) return;

        this.showWidgetConfigModal(widgetId, widgetDef, config);
    }

    showWidgetConfigModal(widgetId, widgetDef, config) {
        const modal = document.createElement('div');
        modal.className = 'widget-config-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h4><i class="${widgetDef.icon}"></i> Configurar ${widgetDef.title}</h4>
                        <button class="modal-close" onclick="this.closest('.widget-config-modal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="config-group">
                            <label>Tamaño del widget:</label>
                            <select id="widgetSize-${widgetId}">
                                ${widgetDef.sizes.map(size =>
                                    `<option value="${size}" ${config.size === size ? 'selected' : ''}>${this.getSizeLabel(size)}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div class="config-group">
                            <label>
                                <input type="checkbox" id="widgetEnabled-${widgetId}" ${config.enabled ? 'checked' : ''}>
                                Widget habilitado
                            </label>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" onclick="this.closest('.widget-config-modal').remove()">Cancelar</button>
                        <button class="btn-primary" onclick="window.dashboardPersonalizer?.saveWidgetConfig('${widgetId}')">Guardar</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    saveWidgetConfig(widgetId) {
        const sizeSelect = document.getElementById(`widgetSize-${widgetId}`);
        const enabledCheckbox = document.getElementById(`widgetEnabled-${widgetId}`);

        if (sizeSelect && enabledCheckbox) {
            this.userPreferences.widgets[widgetId].size = sizeSelect.value;
            this.userPreferences.widgets[widgetId].enabled = enabledCheckbox.checked;

            this.saveUserPreferences();
            this.restoreUserLayout();

            document.querySelector('.widget-config-modal')?.remove();
        }
    }

    // === UI DE PERSONALIZACIÓN ===
    createPersonalizationUI() {
        // Only create if not exists
        if (document.getElementById('dashboardPersonalizerBtn')) {
            console.log('🎨 Dashboard Personalizer button already exists, skipping creation');
            return;
        }

        console.log('🎨 Creating Dashboard Personalizer floating button...');

        const button = document.createElement('button');
        button.id = 'dashboardPersonalizerBtn';
        button.className = 'dashboard-personalizer-btn';
        button.innerHTML = `
            <i class="fas fa-palette"></i>
        `;
        button.title = 'Personalizar Dashboard';

        document.body.appendChild(button);

        console.log('✅ Dashboard Personalizer button created and added to DOM');

        // Add styles
        this.addPersonalizerStyles();

        // Event listener
        button.addEventListener('click', () => this.openPersonalizationPanel());
    }

    openPersonalizationPanel() {
        const panel = document.createElement('div');
        panel.className = 'personalization-panel';
        panel.innerHTML = `
            <div class="panel-overlay">
                <div class="panel-content">
                    <div class="panel-header">
                        <h3><i class="fas fa-palette"></i> Personalizar Dashboard</h3>
                        <button class="panel-close" onclick="this.closest('.personalization-panel').remove()">×</button>
                    </div>
                    <div class="panel-body">
                        ${this.generatePersonalizationContent()}
                    </div>
                    <div class="panel-footer">
                        <button class="btn-secondary" onclick="this.closest('.personalization-panel').remove()">Cancelar</button>
                        <button class="btn-primary" onclick="window.dashboardPersonalizer?.applyPersonalizationChanges()">Aplicar Cambios</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(panel);
    }

    generatePersonalizationContent() {
        return `
            <div class="personalization-section">
                <h4>Layout del Dashboard</h4>
                <div class="layout-options">
                    <label class="layout-option">
                        <input type="radio" name="layout" value="grid-2-columns" ${this.userPreferences.layout === 'grid-2-columns' ? 'checked' : ''}>
                        <div class="layout-preview layout-2-col">
                            <div class="col"></div>
                            <div class="col"></div>
                        </div>
                        <span>2 Columnas</span>
                    </label>
                    <label class="layout-option">
                        <input type="radio" name="layout" value="grid-3-columns" ${this.userPreferences.layout === 'grid-3-columns' ? 'checked' : ''}>
                        <div class="layout-preview layout-3-col">
                            <div class="col"></div>
                            <div class="col"></div>
                            <div class="col"></div>
                        </div>
                        <span>3 Columnas</span>
                    </label>
                    <label class="layout-option">
                        <input type="radio" name="layout" value="masonry" ${this.userPreferences.layout === 'masonry' ? 'checked' : ''}>
                        <div class="layout-preview layout-masonry">
                            <div class="col tall"></div>
                            <div class="col short"></div>
                            <div class="col medium"></div>
                        </div>
                        <span>Masonry</span>
                    </label>
                </div>
            </div>

            <div class="personalization-section">
                <h4>Widgets Disponibles</h4>
                <div class="widgets-list">
                    ${Array.from(this.widgets.entries()).map(([id, widget]) => {
                        const config = this.userPreferences.widgets[id];
                        return `
                            <div class="widget-item">
                                <div class="widget-info">
                                    <div class="widget-icon">
                                        <i class="${widget.icon}"></i>
                                    </div>
                                    <div class="widget-details">
                                        <h5>${widget.title}</h5>
                                        <p>${widget.description}</p>
                                    </div>
                                </div>
                                <div class="widget-controls">
                                    <label class="widget-toggle">
                                        <input type="checkbox" id="widget-${id}" ${config?.enabled ? 'checked' : ''}>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <div class="personalization-section">
                <h4>Preferencias Generales</h4>
                <div class="preferences-grid">
                    <label class="preference-item">
                        <input type="checkbox" id="autoRefresh" ${this.userPreferences.autoRefresh ? 'checked' : ''}>
                        <span>Actualización automática</span>
                    </label>
                    <label class="preference-item">
                        <input type="checkbox" id="animations" ${this.userPreferences.animations ? 'checked' : ''}>
                        <span>Animaciones</span>
                    </label>
                </div>
            </div>
        `;
    }

    applyPersonalizationChanges() {
        // Layout changes
        const selectedLayout = document.querySelector('input[name="layout"]:checked')?.value;
        if (selectedLayout) {
            this.userPreferences.layout = selectedLayout;
        }

        // Widget toggles
        Array.from(this.widgets.keys()).forEach(widgetId => {
            const checkbox = document.getElementById(`widget-${widgetId}`);
            if (checkbox) {
                if (!this.userPreferences.widgets[widgetId]) {
                    this.userPreferences.widgets[widgetId] = { enabled: false, position: 0, size: 'medium' };
                }
                this.userPreferences.widgets[widgetId].enabled = checkbox.checked;
            }
        });

        // General preferences
        const autoRefreshCheckbox = document.getElementById('autoRefresh');
        const animationsCheckbox = document.getElementById('animations');

        if (autoRefreshCheckbox) {
            this.userPreferences.autoRefresh = autoRefreshCheckbox.checked;
        }

        if (animationsCheckbox) {
            this.userPreferences.animations = animationsCheckbox.checked;
        }

        // Apply changes
        this.saveUserPreferences();
        this.restoreUserLayout();

        // Close panel
        document.querySelector('.personalization-panel')?.remove();

        // Show success message
        this.showToast('✅ Cambios aplicados correctamente', 'success');
    }

    // === ESTILOS ===
    addDashboardStyles() {
        if (document.getElementById('dashboardPersonalizerStyles')) return;

        const styles = document.createElement('style');
        styles.id = 'dashboardPersonalizerStyles';
        styles.textContent = `
            .dashboard-widgets-container {
                display: grid;
                gap: 20px;
                margin: 20px 0;
                padding: 0 15px;
            }

            .layout-grid-2-columns { grid-template-columns: repeat(2, 1fr); }
            .layout-grid-3-columns { grid-template-columns: repeat(3, 1fr); }
            .layout-masonry {
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                grid-auto-rows: min-content;
            }

            .dashboard-widget {
                background: white;
                border-radius: 12px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                transition: all 0.3s ease;
                overflow: hidden;
            }

            .dashboard-widget:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            }

            .dashboard-widget.dragging {
                opacity: 0.5;
                transform: scale(0.95);
            }

            .widget-size-small { grid-row: span 1; }
            .widget-size-medium { grid-row: span 2; }
            .widget-size-large { grid-row: span 3; }

            .widget-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }

            .widget-title {
                display: flex;
                align-items: center;
                gap: 10px;
                font-weight: 600;
            }

            .widget-controls {
                display: flex;
                gap: 5px;
            }

            .widget-control {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                width: 30px;
                height: 30px;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            }

            .widget-control:hover {
                background: rgba(255,255,255,0.3);
                transform: scale(1.1);
            }

            .widget-drag-handle {
                cursor: grab;
            }

            .widget-drag-handle:active {
                cursor: grabbing;
            }

            .widget-body {
                padding: 20px;
                min-height: 120px;
            }

            .widget-loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100px;
                color: #666;
                gap: 10px;
            }

            .widget-footer {
                padding: 15px 20px;
                border-top: 1px solid #eee;
                text-align: center;
            }

            .view-all-link, .edit-link {
                color: #667eea;
                text-decoration: none;
                font-size: 14px;
                font-weight: 500;
                background: none;
                border: none;
                cursor: pointer;
            }

            .view-all-link:hover, .edit-link:hover {
                text-decoration: underline;
            }

            /* Widget-specific styles */
            .stats-grid {
                display: grid;
                gap: 15px;
                grid-template-columns: repeat(2, 1fr);
            }

            .stats-large {
                grid-template-columns: repeat(2, 1fr);
            }

            .stat-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 8px;
            }

            .stat-icon {
                width: 40px;
                height: 40px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
            }

            .stat-number {
                font-size: 24px;
                font-weight: bold;
                color: #333;
                display: block;
            }

            .stat-label {
                font-size: 12px;
                color: #666;
                text-transform: uppercase;
            }

            .news-list, .events-list, .notifications-list {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }

            .news-item, .event-item, .notification-item {
                padding: 15px;
                background: #f8f9fa;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .news-item:hover, .event-item:hover, .notification-item:hover {
                background: #e9ecef;
                transform: translateX(5px);
            }

            .news-meta {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                font-size: 12px;
                color: #666;
            }

            .news-title {
                font-size: 14px;
                font-weight: 600;
                margin: 0 0 5px 0;
                color: #333;
            }

            .news-excerpt {
                font-size: 13px;
                color: #666;
                margin: 0;
                line-height: 1.4;
            }

            .event-item {
                display: flex;
                gap: 15px;
            }

            .event-date {
                flex-shrink: 0;
                width: 50px;
                text-align: center;
                background: #667eea;
                color: white;
                border-radius: 8px;
                padding: 8px 5px;
            }

            .event-day {
                display: block;
                font-size: 18px;
                font-weight: bold;
                line-height: 1;
            }

            .event-month {
                display: block;
                font-size: 10px;
                text-transform: uppercase;
                opacity: 0.8;
            }

            .event-title {
                font-size: 14px;
                font-weight: 600;
                margin: 0 0 5px 0;
                color: #333;
            }

            .event-description {
                font-size: 13px;
                color: #666;
                margin: 0 0 5px 0;
                line-height: 1.4;
            }

            .event-time {
                font-size: 12px;
                color: #667eea;
                font-weight: 500;
            }

            .quick-access-grid {
                display: grid;
                gap: 10px;
                grid-template-columns: repeat(3, 1fr);
            }

            .quick-access-medium {
                grid-template-columns: repeat(2, 1fr);
            }

            .quick-access-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                padding: 15px 10px;
                background: #f8f9fa;
                border-radius: 8px;
                text-decoration: none;
                color: #333;
                transition: all 0.2s ease;
                text-align: center;
            }

            .quick-access-item:hover {
                background: #667eea;
                color: white;
                transform: translateY(-2px);
            }

            .quick-access-item i {
                font-size: 20px;
            }

            .quick-access-item span {
                font-size: 11px;
                font-weight: 500;
            }

            /* Drag & Drop */
            .drag-ghost {
                pointer-events: none !important;
                z-index: 9999 !important;
            }

            .drop-target {
                border: 2px dashed #667eea !important;
                background: rgba(102, 126, 234, 0.1) !important;
            }

            .dragging-active .dashboard-widget:not(.dragging) {
                transition: all 0.3s ease;
            }

            .dragging-active .dashboard-widget:not(.dragging):hover {
                border: 2px dashed #ccc;
                background: rgba(0,0,0,0.02);
            }

            /* Responsive */
            @media (max-width: 768px) {
                .layout-grid-2-columns,
                .layout-grid-3-columns,
                .layout-masonry {
                    grid-template-columns: 1fr;
                }

                .dashboard-widgets-container {
                    padding: 0 10px;
                    gap: 15px;
                }

                .widget-header {
                    padding: 12px 15px;
                }

                .widget-body {
                    padding: 15px;
                }

                .stats-grid {
                    grid-template-columns: 1fr;
                }

                .quick-access-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
            }
        `;

        document.head.appendChild(styles);
    }

    addPersonalizerStyles() {
        if (document.getElementById('personalizerUIStyles')) return;

        const styles = document.createElement('style');
        styles.id = 'personalizerUIStyles';
        styles.textContent = `
            .dashboard-personalizer-btn {
                position: fixed;
                bottom: 180px;
                right: 20px;
                width: 56px;
                height: 56px;
                background: linear-gradient(135deg, #ff0080 0%, #ff00ff 50%, #8000ff 100%);
                border: none;
                border-radius: 50%;
                color: white;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(255, 0, 128, 0.5), 0 0 30px rgba(255, 0, 255, 0.3);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                z-index: 999;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
            }

            .dashboard-personalizer-btn:hover {
                transform: translateY(-2px) scale(1.1);
                box-shadow: 0 8px 30px rgba(255, 0, 128, 0.7), 0 0 40px rgba(255, 0, 255, 0.5);
                background: linear-gradient(135deg, #ff0080 0%, #ff00ff 30%, #8000ff 100%);
            }

            .personalization-panel {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 2000;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .panel-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .panel-content {
                background: white;
                border-radius: 12px;
                width: 90%;
                max-width: 700px;
                max-height: 90vh;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            }

            .panel-header {
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                color: white;
                padding: 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .panel-close {
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .panel-body {
                padding: 20px;
                max-height: 60vh;
                overflow-y: auto;
            }

            .personalization-section {
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 1px solid #eee;
            }

            .personalization-section:last-child {
                border-bottom: none;
                margin-bottom: 0;
            }

            .personalization-section h4 {
                margin: 0 0 15px 0;
                color: #333;
                font-size: 18px;
            }

            .layout-options {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 15px;
            }

            .layout-option {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
                cursor: pointer;
                padding: 15px;
                border: 2px solid #eee;
                border-radius: 8px;
                transition: all 0.2s ease;
            }

            .layout-option:hover {
                border-color: #f093fb;
            }

            .layout-option input {
                display: none;
            }

            .layout-option input:checked + .layout-preview {
                background: #f093fb;
            }

            .layout-option input:checked ~ span {
                color: #f093fb;
                font-weight: 600;
            }

            .layout-preview {
                width: 60px;
                height: 40px;
                border: 2px solid #ddd;
                border-radius: 4px;
                display: flex;
                gap: 2px;
                padding: 4px;
                transition: all 0.2s ease;
            }

            .layout-preview .col {
                background: #eee;
                border-radius: 2px;
                flex: 1;
            }

            .layout-preview.layout-2-col { }
            .layout-preview.layout-3-col { }
            .layout-preview.layout-masonry .col.short { height: 50%; }
            .layout-preview.layout-masonry .col.tall { height: 100%; }
            .layout-preview.layout-masonry .col.medium { height: 75%; }

            .widgets-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .widget-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 8px;
                transition: all 0.2s ease;
            }

            .widget-item:hover {
                background: #e9ecef;
            }

            .widget-info {
                display: flex;
                align-items: center;
                gap: 15px;
            }

            .widget-icon {
                width: 40px;
                height: 40px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
            }

            .widget-details h5 {
                margin: 0 0 5px 0;
                font-size: 16px;
                color: #333;
            }

            .widget-details p {
                margin: 0;
                font-size: 14px;
                color: #666;
            }

            .widget-toggle {
                position: relative;
                display: inline-block;
                width: 50px;
                height: 25px;
            }

            .widget-toggle input {
                opacity: 0;
                width: 0;
                height: 0;
            }

            .toggle-slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: #ccc;
                transition: 0.3s;
                border-radius: 25px;
            }

            .toggle-slider:before {
                position: absolute;
                content: "";
                height: 19px;
                width: 19px;
                left: 3px;
                bottom: 3px;
                background: white;
                transition: 0.3s;
                border-radius: 50%;
            }

            input:checked + .toggle-slider {
                background: #f093fb;
            }

            input:checked + .toggle-slider:before {
                transform: translateX(25px);
            }

            .preferences-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
            }

            .preference-item {
                display: flex;
                align-items: center;
                gap: 10px;
                cursor: pointer;
            }

            .panel-footer {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                padding: 20px;
                background: #f8f9fa;
                border-top: 1px solid #e9ecef;
            }

            .btn-primary {
                background: #f093fb;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .btn-primary:hover {
                background: #f5576c;
                transform: translateY(-1px);
            }

            .btn-secondary {
                background: #6c757d;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .btn-secondary:hover {
                background: #5a6268;
            }

            @media (max-width: 768px) {
                .layout-options {
                    grid-template-columns: 1fr;
                }

                .preferences-grid {
                    grid-template-columns: 1fr;
                }

                .panel-content {
                    width: 95%;
                    margin: 10px;
                }
            }
        `;

        document.head.appendChild(styles);
    }

    // === UTILIDADES ===
    async fetchRecentNews() {
        try {
            const response = await fetch('./data/noticias.json');
            const data = await response.json();
            return data.noticias || [];
        } catch (error) {
            console.warn('⚠️ Failed to fetch news:', error);
            return this.getMockNews();
        }
    }

    async fetchUpcomingEvents() {
        try {
            const response = await fetch('./data/eventos.json');
            const data = await response.json();
            return data.eventos || [];
        } catch (error) {
            console.warn('⚠️ Failed to fetch events:', error);
            return this.getMockEvents();
        }
    }

    getQuickStats() {
        return {
            totalUsers: 1247,
            totalNews: 28,
            upcomingEvents: 12,
            downloads: 342
        };
    }

    getRecentNotifications() {
        const notificationManager = window.heroesNotifications;
        if (notificationManager) {
            return notificationManager.getNotificationHistory().slice(0, 10);
        }

        return [
            {
                title: 'Nueva noticia',
                message: 'Se ha publicado una nueva convocatoria',
                icon: 'fas fa-newspaper',
                timestamp: Date.now() - 300000,
                read: false
            },
            {
                title: 'Evento próximo',
                message: 'Ceremonia de graduación en 3 días',
                icon: 'fas fa-calendar',
                timestamp: Date.now() - 3600000,
                read: true
            }
        ];
    }

    getPerformanceMetrics() {
        return {
            pageLoad: 85,
            pageLoadTime: 1200,
            performance: 92,
            lighthouse: 94
        };
    }

    getMockNews() {
        return [
            {
                titulo: 'Nueva convocatoria de becas',
                contenido: 'Se abre el proceso de solicitud de becas para el próximo semestre...',
                fecha: new Date().toISOString(),
                url: './index.html#noticias'
            }
        ];
    }

    getMockEvents() {
        const now = new Date();
        return [
            {
                titulo: 'Ceremonia de graduación',
                descripcion: 'Ceremonia de graduación de la generación 2024',
                fecha: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                hora: '10:00'
            }
        ];
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'short'
        });
    }

    formatTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (days > 0) return `hace ${days} día${days > 1 ? 's' : ''}`;
        if (hours > 0) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
        if (minutes > 0) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
        return 'hace un momento';
    }

    getMonthName(monthIndex) {
        const months = [
            'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
        ];
        return months[monthIndex];
    }

    getSizeLabel(size) {
        const labels = {
            small: 'Pequeño',
            medium: 'Mediano',
            large: 'Grande'
        };
        return labels[size] || size;
    }

    generateCalendarGrid(year, month) {
        // Simplified calendar grid
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfWeek = new Date(year, month, 1).getDay();

        let grid = '<div class="calendar-days">Dom Lun Mar Mié Jue Vie Sáb</div>';
        grid += '<div class="calendar-grid-days">';

        // Empty cells for days before month starts
        for (let i = 0; i < firstDayOfWeek; i++) {
            grid += '<div class="calendar-day empty"></div>';
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = day === new Date().getDate() &&
                           month === new Date().getMonth() &&
                           year === new Date().getFullYear();
            grid += `<div class="calendar-day ${isToday ? 'today' : ''}">${day}</div>`;
        }

        grid += '</div>';
        return grid;
    }

    editQuickAccess() {
        // Open quick access editor modal
        console.log('🔗 Opening quick access editor...');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `dashboard-toast toast-${type}`;
        toast.textContent = message;

        const colors = {
            success: '#4CAF50',
            error: '#F44336',
            warning: '#FF9800',
            info: '#2196F3'
        };

        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 3000;
            opacity: 0;
            transform: translateX(300px);
            transition: all 0.3s ease;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(300px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// === INICIALIZACIÓN ===
window.DashboardPersonalizer = DashboardPersonalizer;

// Inicialización condicional usando context manager
function initDashboardPersonalizer() {
    console.log('🎨 [INIT] Attempting to initialize Dashboard Personalizer...');
    if (!window.dashboardPersonalizer) {
        console.log('🎨 [INIT] Creating new Dashboard Personalizer instance...');
        window.dashboardPersonalizer = new DashboardPersonalizer();
    } else {
        console.log('🎨 [INIT] Dashboard Personalizer already exists');
    }
}

// INICIALIZACIÓN SIMPLIFICADA - SIEMPRE mostrar botón flotante
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboardPersonalizer);
} else {
    initDashboardPersonalizer();
}

console.log('🎨 Dashboard Personalizer loaded successfully');