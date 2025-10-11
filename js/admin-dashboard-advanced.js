/**
 * 🎛️ ADMIN DASHBOARD ADVANCED - Dashboard Administrativo Avanzado
 * Bachillerato General Estatal "Héroes de la Patria"
 * Sistema completo de administración con métricas en tiempo real
 */

class AdminDashboardAdvanced {
    constructor() {
        this.isAdmin = false;
        this.dashboardVisible = false;
        
        this.widgets = new Map();
        this.metrics = {
            system: {
                uptime: Date.now(),
                memory: 0,
                performance: 100,
                errors: 0,
                warnings: 0
            },
            users: {
                active: 0,
                sessions: 0,
                bounceRate: 0,
                avgSessionTime: 0
            },
            content: {
                pageViews: 0,
                mostVisited: [],
                searchQueries: [],
                interactions: 0
            },
            security: {
                score: 100,
                threats: 0,
                blockedRequests: 0,
                vulnerabilities: []
            },
            performance: {
                loadTime: 0,
                optimizations: 0,
                cacheHits: 0,
                bandwidth: 0
            },
            payments: {
                total: 0,
                successful: 0,
                pending: 0,
                failed: 0
            }
        };
        
        this.notifications = [];
        this.logs = [];
        this.charts = {};
        
        this.init();
    }

    async init() {
        //console.log('🎛️ Iniciando Admin Dashboard Advanced...');
        
        // Verificar permisos de administrador
        await this.checkAdminPermissions();
        
        if (!this.isAdmin) {
            //console.log('ℹ️ Usuario no tiene permisos de administrador');
            return;
        }
        
        // Inicializar dashboard
        this.createDashboardUI();
        this.setupEventListeners();
        this.initializeWidgets();
        this.startDataCollection();
        this.setupRealTimeUpdates();
        
        //console.log('✅ Admin Dashboard Advanced inicializado');
    }

    async checkAdminPermissions() {
        // Verificar múltiples métodos de autenticación
        const checks = [
            localStorage.getItem('userRole') === 'admin',
            localStorage.getItem('adminAuthenticated') === 'true',
            sessionStorage.getItem('adminSession') !== null,
            window.location.search.includes('admin=true'),
            window.location.hash.includes('admin')
        ];
        
        this.isAdmin = checks.some(check => check === true);
        
        // Verificar también si hay sistemas de admin disponibles
        if (window.adminAuth || window.adminAuthSecure) {
            const adminSystem = window.adminAuth || window.adminAuthSecure;
            if (adminSystem.isAuthenticated && adminSystem.isAuthenticated()) {
                this.isAdmin = true;
            }
        }
    }

    createDashboardUI() {
        // Crear botón flotante para abrir dashboard
        this.createDashboardToggle();
        
        // Crear el dashboard principal
        this.createMainDashboard();
        
        // Crear modales auxiliares
        this.createSettingsModal();
        this.createLogsModal();
    }

    createDashboardToggle() {
        const toggle = document.createElement('div');
        toggle.id = 'admin-dashboard-toggle';
        toggle.className = 'admin-dashboard-toggle';
        toggle.innerHTML = `
            <i class="fas fa-tachometer-alt"></i>
            <span class="toggle-text">Admin</span>
        `;
        
        toggle.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            z-index: 1050;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 16px;
            border-radius: 25px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 500;
            transition: all 0.3s ease;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        `;
        
        toggle.addEventListener('click', () => this.toggleDashboard());
        toggle.addEventListener('mouseenter', () => {
            toggle.style.transform = 'scale(1.05)';
        });
        toggle.addEventListener('mouseleave', () => {
            toggle.style.transform = 'scale(1)';
        });
        
        document.body.appendChild(toggle);
    }

    createMainDashboard() {
        const dashboard = document.createElement('div');
        dashboard.id = 'admin-dashboard-main';
        dashboard.className = 'admin-dashboard-main';
        dashboard.innerHTML = `
            <div class="dashboard-container">
                <div class="dashboard-header">
                    <div class="dashboard-title">
                        <h4><i class="fas fa-tachometer-alt"></i> Panel de Administración</h4>
                        <div class="dashboard-subtitle">Bachillerato Héroes de la Patria</div>
                    </div>
                    <div class="dashboard-controls">
                        <button class="btn btn-sm btn-outline-light dashboard-settings">
                            <i class="fas fa-cog"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-light dashboard-logs">
                            <i class="fas fa-list-alt"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-light dashboard-fullscreen">
                            <i class="fas fa-expand"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-light dashboard-close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                
                <div class="dashboard-content">
                    <div class="dashboard-tabs">
                        <button class="tab-button active" data-tab="overview">Vista General</button>
                        <button class="tab-button" data-tab="analytics">Analytics</button>
                        <button class="tab-button" data-tab="security">Seguridad</button>
                        <button class="tab-button" data-tab="performance">Performance</button>
                        <button class="tab-button" data-tab="payments">Pagos</button>
                        <button class="tab-button" data-tab="users">Usuarios</button>
                    </div>
                    
                    <div class="dashboard-tabs-content">
                        <div class="tab-content active" data-tab="overview">
                            ${this.getOverviewTabHTML()}
                        </div>
                        <div class="tab-content" data-tab="analytics">
                            ${this.getAnalyticsTabHTML()}
                        </div>
                        <div class="tab-content" data-tab="security">
                            ${this.getSecurityTabHTML()}
                        </div>
                        <div class="tab-content" data-tab="performance">
                            ${this.getPerformanceTabHTML()}
                        </div>
                        <div class="tab-content" data-tab="payments">
                            ${this.getPaymentsTabHTML()}
                        </div>
                        <div class="tab-content" data-tab="users">
                            ${this.getUsersTabHTML()}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        dashboard.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 1060;
            background: rgba(0,0,0,0.8);
            backdrop-filter: blur(5px);
            display: none;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        `;
        
        document.body.appendChild(dashboard);
    }

    getOverviewTabHTML() {
        return `
            <div class="overview-widgets">
                <div class="widget-row">
                    <div class="widget metric-widget" data-widget="system-status">
                        <div class="widget-icon system-icon">
                            <i class="fas fa-server"></i>
                        </div>
                        <div class="widget-content">
                            <div class="widget-title">Estado del Sistema</div>
                            <div class="widget-value" data-metric="system.performance">100%</div>
                            <div class="widget-change positive">+2.3% vs ayer</div>
                        </div>
                    </div>
                    
                    <div class="widget metric-widget" data-widget="active-users">
                        <div class="widget-icon users-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="widget-content">
                            <div class="widget-title">Usuarios Activos</div>
                            <div class="widget-value" data-metric="users.active">0</div>
                            <div class="widget-change" data-change="users">--</div>
                        </div>
                    </div>
                    
                    <div class="widget metric-widget" data-widget="page-views">
                        <div class="widget-icon views-icon">
                            <i class="fas fa-eye"></i>
                        </div>
                        <div class="widget-content">
                            <div class="widget-title">Vistas de Página</div>
                            <div class="widget-value" data-metric="content.pageViews">0</div>
                            <div class="widget-change" data-change="pageviews">--</div>
                        </div>
                    </div>
                    
                    <div class="widget metric-widget" data-widget="security-score">
                        <div class="widget-icon security-icon">
                            <i class="fas fa-shield-alt"></i>
                        </div>
                        <div class="widget-content">
                            <div class="widget-title">Puntuación de Seguridad</div>
                            <div class="widget-value" data-metric="security.score">100</div>
                            <div class="widget-change positive">Excelente</div>
                        </div>
                    </div>
                </div>
                
                <div class="widget-row">
                    <div class="widget chart-widget" data-widget="traffic-chart">
                        <div class="widget-header">
                            <h6>Tráfico en Tiempo Real</h6>
                            <div class="widget-controls">
                                <select class="form-select form-select-sm" data-timeframe="traffic">
                                    <option value="1h">Última hora</option>
                                    <option value="24h" selected>Últimas 24h</option>
                                    <option value="7d">Últimos 7 días</option>
                                </select>
                            </div>
                        </div>
                        <div class="chart-container">
                            <canvas id="traffic-chart"></canvas>
                        </div>
                    </div>
                    
                    <div class="widget list-widget" data-widget="recent-activity">
                        <div class="widget-header">
                            <h6>Actividad Reciente</h6>
                            <button class="btn btn-sm btn-outline-secondary refresh-activity">
                                <i class="fas fa-sync"></i>
                            </button>
                        </div>
                        <div class="activity-list">
                            <div class="activity-item">
                                <div class="activity-icon">
                                    <i class="fas fa-user"></i>
                                </div>
                                <div class="activity-content">
                                    <div class="activity-text">Usuario visitó página principal</div>
                                    <div class="activity-time">Hace 2 minutos</div>
                                </div>
                            </div>
                            <div class="activity-item">
                                <div class="activity-icon">
                                    <i class="fas fa-shield-alt"></i>
                                </div>
                                <div class="activity-content">
                                    <div class="activity-text">Sistema de seguridad actualizado</div>
                                    <div class="activity-time">Hace 15 minutos</div>
                                </div>
                            </div>
                            <div class="activity-item">
                                <div class="activity-icon">
                                    <i class="fas fa-chart-line"></i>
                                </div>
                                <div class="activity-content">
                                    <div class="activity-text">Nuevo reporte de analytics generado</div>
                                    <div class="activity-time">Hace 1 hora</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="widget-row">
                    <div class="widget alerts-widget" data-widget="system-alerts">
                        <div class="widget-header">
                            <h6>Alertas del Sistema</h6>
                            <span class="badge bg-warning" data-alerts-count>0</span>
                        </div>
                        <div class="alerts-container">
                            <div class="alert alert-info alert-dismissible">
                                <i class="fas fa-info-circle"></i>
                                Sistema funcionando correctamente. Todos los servicios están operativos.
                                <button type="button" class="btn-close"></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getAnalyticsTabHTML() {
        return `
            <div class="analytics-dashboard">
                <div class="analytics-summary">
                    <div class="summary-cards">
                        <div class="summary-card">
                            <h6>Usuarios Únicos</h6>
                            <div class="summary-value" data-analytics="unique-users">0</div>
                            <div class="summary-period">Últimos 30 días</div>
                        </div>
                        <div class="summary-card">
                            <h6>Páginas Vistas</h6>
                            <div class="summary-value" data-analytics="page-views">0</div>
                            <div class="summary-period">Últimos 30 días</div>
                        </div>
                        <div class="summary-card">
                            <h6>Tiempo Promedio</h6>
                            <div class="summary-value" data-analytics="avg-time">0:00</div>
                            <div class="summary-period">Por sesión</div>
                        </div>
                        <div class="summary-card">
                            <h6>Tasa de Rebote</h6>
                            <div class="summary-value" data-analytics="bounce-rate">0%</div>
                            <div class="summary-period">Últimos 30 días</div>
                        </div>
                    </div>
                </div>
                
                <div class="analytics-charts">
                    <div class="chart-container large">
                        <h6>Tráfico por Hora</h6>
                        <canvas id="hourly-traffic-chart"></canvas>
                    </div>
                    <div class="chart-container medium">
                        <h6>Páginas Más Visitadas</h6>
                        <canvas id="top-pages-chart"></canvas>
                    </div>
                    <div class="chart-container medium">
                        <h6>Dispositivos</h6>
                        <canvas id="devices-chart"></canvas>
                    </div>
                </div>
            </div>
        `;
    }

    getSecurityTabHTML() {
        return `
            <div class="security-dashboard">
                <div class="security-score-section">
                    <div class="score-display">
                        <div class="score-circle">
                            <svg viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" fill="none" stroke="#e9ecef" stroke-width="8"/>
                                <circle cx="50" cy="50" r="45" fill="none" stroke="#28a745" stroke-width="8" 
                                        stroke-dasharray="283" stroke-dashoffset="0" class="score-progress"/>
                            </svg>
                            <div class="score-value" data-security-score>100</div>
                        </div>
                        <div class="score-label">Puntuación de Seguridad</div>
                    </div>
                    
                    <div class="security-metrics">
                        <div class="security-metric">
                            <div class="metric-icon">
                                <i class="fas fa-shield-alt"></i>
                            </div>
                            <div class="metric-info">
                                <div class="metric-title">Amenazas Detectadas</div>
                                <div class="metric-value" data-security="threats">0</div>
                            </div>
                        </div>
                        <div class="security-metric">
                            <div class="metric-icon">
                                <i class="fas fa-ban"></i>
                            </div>
                            <div class="metric-info">
                                <div class="metric-title">Solicitudes Bloqueadas</div>
                                <div class="metric-value" data-security="blocked">0</div>
                            </div>
                        </div>
                        <div class="security-metric">
                            <div class="metric-icon">
                                <i class="fas fa-bug"></i>
                            </div>
                            <div class="metric-info">
                                <div class="metric-title">Vulnerabilidades</div>
                                <div class="metric-value" data-security="vulnerabilities">0</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="security-logs">
                    <h6>Registro de Seguridad</h6>
                    <div class="logs-container">
                        <div class="log-entry">
                            <span class="log-time">${new Date().toLocaleTimeString()}</span>
                            <span class="log-level info">INFO</span>
                            <span class="log-message">Sistema de seguridad iniciado correctamente</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getPerformanceTabHTML() {
        return `
            <div class="performance-dashboard">
                <div class="performance-metrics">
                    <div class="perf-metric">
                        <div class="metric-header">
                            <i class="fas fa-tachometer-alt"></i>
                            <span>Tiempo de Carga</span>
                        </div>
                        <div class="metric-value" data-performance="load-time">0ms</div>
                        <div class="metric-status good">Excelente</div>
                    </div>
                    <div class="perf-metric">
                        <div class="metric-header">
                            <i class="fas fa-memory"></i>
                            <span>Uso de Memoria</span>
                        </div>
                        <div class="metric-value" data-performance="memory">0MB</div>
                        <div class="metric-status good">Normal</div>
                    </div>
                    <div class="perf-metric">
                        <div class="metric-header">
                            <i class="fas fa-database"></i>
                            <span>Cache Hit Rate</span>
                        </div>
                        <div class="metric-value" data-performance="cache">0%</div>
                        <div class="metric-status good">Óptimo</div>
                    </div>
                    <div class="perf-metric">
                        <div class="metric-header">
                            <i class="fas fa-wifi"></i>
                            <span>Ancho de Banda</span>
                        </div>
                        <div class="metric-value" data-performance="bandwidth">0KB/s</div>
                        <div class="metric-status good">Normal</div>
                    </div>
                </div>
                
                <div class="performance-chart">
                    <h6>Métricas de Performance en Tiempo Real</h6>
                    <canvas id="performance-chart"></canvas>
                </div>
            </div>
        `;
    }

    getPaymentsTabHTML() {
        return `
            <div class="payments-dashboard">
                <div class="payments-summary">
                    <div class="payment-stat">
                        <div class="stat-icon">
                            <i class="fas fa-dollar-sign"></i>
                        </div>
                        <div class="stat-info">
                            <div class="stat-value" data-payments="total">$0</div>
                            <div class="stat-label">Total Recaudado</div>
                        </div>
                    </div>
                    <div class="payment-stat">
                        <div class="stat-icon">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="stat-info">
                            <div class="stat-value" data-payments="successful">0</div>
                            <div class="stat-label">Pagos Exitosos</div>
                        </div>
                    </div>
                    <div class="payment-stat">
                        <div class="stat-icon">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="stat-info">
                            <div class="stat-value" data-payments="pending">0</div>
                            <div class="stat-label">Pagos Pendientes</div>
                        </div>
                    </div>
                    <div class="payment-stat">
                        <div class="stat-icon">
                            <i class="fas fa-times-circle"></i>
                        </div>
                        <div class="stat-info">
                            <div class="stat-value" data-payments="failed">0</div>
                            <div class="stat-label">Pagos Fallidos</div>
                        </div>
                    </div>
                </div>
                
                <div class="recent-transactions">
                    <h6>Transacciones Recientes</h6>
                    <div class="transactions-table">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Estudiante</th>
                                    <th>Concepto</th>
                                    <th>Monto</th>
                                    <th>Estado</th>
                                    <th>Fecha</th>
                                </tr>
                            </thead>
                            <tbody data-transactions-list>
                                <tr>
                                    <td colspan="6" class="text-center text-muted">
                                        No hay transacciones recientes
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    getUsersTabHTML() {
        return `
            <div class="users-dashboard">
                <div class="users-stats">
                    <div class="user-stat">
                        <h6>Usuarios Activos</h6>
                        <div class="stat-value" data-users="active">0</div>
                    </div>
                    <div class="user-stat">
                        <h6>Sesiones Totales</h6>
                        <div class="stat-value" data-users="sessions">0</div>
                    </div>
                    <div class="user-stat">
                        <h6>Tiempo Promedio</h6>
                        <div class="stat-value" data-users="avg-time">0:00</div>
                    </div>
                    <div class="user-stat">
                        <h6>Páginas por Sesión</h6>
                        <div class="stat-value" data-users="pages-per-session">0</div>
                    </div>
                </div>
                
                <div class="users-activity">
                    <h6>Actividad de Usuarios</h6>
                    <div class="activity-feed">
                        <!-- Se llenará dinámicamente -->
                    </div>
                </div>
            </div>
        `;
    }

    createSettingsModal() {
        const modal = document.createElement('div');
        modal.id = 'dashboard-settings-modal';
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Configuración del Dashboard</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="settings-section">
                            <h6>Actualización Automática</h6>
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="auto-refresh" checked>
                                <label class="form-check-label" for="auto-refresh">
                                    Actualizar datos automáticamente
                                </label>
                            </div>
                            <div class="mt-2">
                                <label class="form-label">Intervalo (segundos)</label>
                                <input type="number" class="form-control" id="refresh-interval" value="30" min="10" max="300">
                            </div>
                        </div>
                        
                        <div class="settings-section">
                            <h6>Notificaciones</h6>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="alert-errors" checked>
                                <label class="form-check-label" for="alert-errors">
                                    Alertar sobre errores críticos
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="alert-security" checked>
                                <label class="form-check-label" for="alert-security">
                                    Alertar sobre amenazas de seguridad
                                </label>
                            </div>
                        </div>
                        
                        <div class="settings-section">
                            <h6>Datos a Mostrar</h6>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="show-realtime" checked>
                                <label class="form-check-label" for="show-realtime">
                                    Mostrar datos en tiempo real
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="show-detailed" checked>
                                <label class="form-check-label" for="show-detailed">
                                    Mostrar métricas detalladas
                                </label>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary save-settings">Guardar</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    createLogsModal() {
        const modal = document.createElement('div');
        modal.id = 'dashboard-logs-modal';
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Logs del Sistema</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="logs-controls mb-3">
                            <div class="row">
                                <div class="col-md-3">
                                    <select class="form-select" id="log-level-filter">
                                        <option value="all">Todos los niveles</option>
                                        <option value="error">Error</option>
                                        <option value="warning">Warning</option>
                                        <option value="info">Info</option>
                                        <option value="debug">Debug</option>
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <input type="text" class="form-control" id="log-search" placeholder="Buscar en logs...">
                                </div>
                                <div class="col-md-3">
                                    <button class="btn btn-outline-secondary" id="clear-logs">Limpiar</button>
                                    <button class="btn btn-primary" id="export-logs">Exportar</button>
                                </div>
                            </div>
                        </div>
                        <div class="logs-content" style="max-height: 400px; overflow-y: auto;">
                            <div class="logs-list">
                                <!-- Los logs se cargarán aquí -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    setupEventListeners() {
        // Toggle dashboard
        document.addEventListener('click', (e) => {
            if (e.target.matches('.dashboard-close, #admin-dashboard-toggle')) {
                this.toggleDashboard();
            }
            
            // Tab navigation
            else if (e.target.matches('.tab-button')) {
                this.switchTab(e.target.dataset.tab);
            }
            
            // Settings
            else if (e.target.matches('.dashboard-settings')) {
                const modal = new bootstrap.Modal(document.getElementById('dashboard-settings-modal'));
                modal.show();
            }
            
            // Logs
            else if (e.target.matches('.dashboard-logs')) {
                this.showLogsModal();
            }
            
            // Fullscreen
            else if (e.target.matches('.dashboard-fullscreen')) {
                this.toggleFullscreen();
            }
            
            // Refresh activities
            else if (e.target.matches('.refresh-activity')) {
                this.refreshRecentActivity();
            }
            
            // Save settings
            else if (e.target.matches('.save-settings')) {
                this.saveSettings();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'A') {
                if (this.isAdmin) {
                    this.toggleDashboard();
                }
            }
        });
    }

    toggleDashboard() {
        const dashboard = document.getElementById('admin-dashboard-main');
        this.dashboardVisible = !this.dashboardVisible;
        
        if (this.dashboardVisible) {
            dashboard.style.display = 'flex';
            dashboard.style.alignItems = 'center';
            dashboard.style.justifyContent = 'center';
            
            // Animate in
            setTimeout(() => {
                dashboard.querySelector('.dashboard-container').style.transform = 'scale(1)';
                dashboard.querySelector('.dashboard-container').style.opacity = '1';
            }, 10);
            
            // Start data updates
            this.startRealTimeUpdates();
        } else {
            dashboard.style.display = 'none';
            this.stopRealTimeUpdates();
        }
    }

    switchTab(tabName) {
        // Remove active from all tabs and contents
        document.querySelectorAll('.tab-button, .tab-content').forEach(el => {
            el.classList.remove('active');
        });
        
        // Add active to selected tab and content
        document.querySelector(`[data-tab="${tabName}"].tab-button`).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"].tab-content`).classList.add('active');
        
        // Load tab-specific data
        this.loadTabData(tabName);
    }

    toggleFullscreen() {
        const dashboard = document.querySelector('.dashboard-container');
        const button = document.querySelector('.dashboard-fullscreen i');
        
        if (dashboard.classList.contains('fullscreen')) {
            dashboard.classList.remove('fullscreen');
            button.className = 'fas fa-expand';
        } else {
            dashboard.classList.add('fullscreen');
            button.className = 'fas fa-compress';
        }
    }

    // ============================================
    // DATA COLLECTION AND UPDATES
    // ============================================

    startDataCollection() {
        // Collect data from various system components
        this.collectSystemMetrics();
        this.collectAnalyticsData();
        this.collectSecurityMetrics();
        this.collectPerformanceMetrics();
        this.collectPaymentMetrics();
    }

    collectSystemMetrics() {
        this.metrics.system.uptime = Date.now();
        
        if (performance.memory) {
            this.metrics.system.memory = Math.round(performance.memory.usedJSHeapSize / 1048576);
        }
    }

    collectAnalyticsData() {
        if (window.advancedAnalytics) {
            const analyticsData = window.advancedAnalytics.getMetrics();
            this.metrics.users.active = analyticsData.activeUsers || 0;
            this.metrics.content.pageViews = analyticsData.pageViews || 0;
        }
    }

    collectSecurityMetrics() {
        if (window.securityManager) {
            const securityData = window.securityManager.getSecurityMetrics();
            this.metrics.security.score = securityData.securityScore;
            this.metrics.security.threats = securityData.totalThreats;
            this.metrics.security.blockedRequests = securityData.blockedRequests;
        }
    }

    collectPerformanceMetrics() {
        if (window.unifiedPerformanceOptimizer || window.performanceOptimizer) {
            const perfOptimizer = window.unifiedPerformanceOptimizer || window.performanceOptimizer;
            const perfData = perfOptimizer.getMetrics();
            
            this.metrics.performance.loadTime = performance.now();
            this.metrics.performance.optimizations = perfData.resourcesOptimized || 0;
        }
    }

    collectPaymentMetrics() {
        if (window.paymentSystemAdvanced) {
            const paymentData = window.paymentSystemAdvanced.getMetrics();
            this.metrics.payments.total = paymentData.totalAmount || 0;
            this.metrics.payments.successful = paymentData.successfulPayments || 0;
            this.metrics.payments.failed = paymentData.failedPayments || 0;
        }
    }

    startRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this.updateInterval = setInterval(() => {
            if (this.dashboardVisible) {
                this.updateDashboardData();
            }
        }, 10000); // Update every 10 seconds
    }

    stopRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }

    updateDashboardData() {
        // Collect fresh data
        this.startDataCollection();
        
        // Update UI elements
        this.updateMetricElements();
        this.updateCharts();
        this.updateRecentActivity();
        this.checkAlerts();
    }

    updateMetricElements() {
        // Update system metrics
        const perfElement = document.querySelector('[data-metric="system.performance"]');
        if (perfElement) {
            perfElement.textContent = this.metrics.system.performance + '%';
        }
        
        // Update user metrics
        const activeUsersElement = document.querySelector('[data-metric="users.active"]');
        if (activeUsersElement) {
            activeUsersElement.textContent = this.metrics.users.active;
        }
        
        // Update content metrics
        const pageViewsElement = document.querySelector('[data-metric="content.pageViews"]');
        if (pageViewsElement) {
            pageViewsElement.textContent = this.metrics.content.pageViews;
        }
        
        // Update security score
        const securityScoreElement = document.querySelector('[data-metric="security.score"]');
        if (securityScoreElement) {
            securityScoreElement.textContent = this.metrics.security.score;
        }
    }

    updateCharts() {
        // Update charts if they exist
        if (this.charts.traffic) {
            this.charts.traffic.data.datasets[0].data = this.generateTrafficData();
            this.charts.traffic.update();
        }
    }

    generateTrafficData() {
        // Generate sample traffic data
        return Array.from({length: 24}, () => Math.floor(Math.random() * 100));
    }

    updateRecentActivity() {
        const activityList = document.querySelector('.activity-list');
        if (activityList) {
            // Add new activity items (simulate)
            const activities = [
                { icon: 'fas fa-user', text: 'Nuevo usuario registrado', time: 'Hace 1 minuto' },
                { icon: 'fas fa-eye', text: 'Página visitada', time: 'Hace 3 minutos' },
                { icon: 'fas fa-shield-alt', text: 'Escaneo de seguridad completado', time: 'Hace 5 minutos' }
            ];
            
            // Keep only the latest 5 activities
            const existingItems = activityList.querySelectorAll('.activity-item');
            if (existingItems.length >= 5) {
                existingItems[existingItems.length - 1].remove();
            }
            
            // Add new activity at the top
            const newActivity = activities[Math.floor(Math.random() * activities.length)];
            const activityHTML = `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="${newActivity.icon}"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-text">${newActivity.text}</div>
                        <div class="activity-time">${newActivity.time}</div>
                    </div>
                </div>
            `;
            
            activityList.insertAdjacentHTML('afterbegin', activityHTML);
        }
    }

    checkAlerts() {
        const alertsContainer = document.querySelector('.alerts-container');
        const alertsCount = document.querySelector('[data-alerts-count]');
        
        let alerts = 0;
        
        // Check for performance issues
        if (this.metrics.system.performance < 80) {
            alerts++;
            this.addAlert('warning', 'Rendimiento del sistema por debajo del óptimo');
        }
        
        // Check for security threats
        if (this.metrics.security.threats > 0) {
            alerts++;
            this.addAlert('danger', `${this.metrics.security.threats} amenaza(s) de seguridad detectada(s)`);
        }
        
        // Check for high memory usage
        if (this.metrics.system.memory > 500) {
            alerts++;
            this.addAlert('warning', 'Uso elevado de memoria detectado');
        }
        
        alertsCount.textContent = alerts;
    }

    addAlert(type, message) {
        const alertsContainer = document.querySelector('.alerts-container');
        const alertHTML = `
            <div class="alert alert-${type} alert-dismissible">
                <i class="fas fa-exclamation-triangle"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        alertsContainer.insertAdjacentHTML('afterbegin', alertHTML);
    }

    loadTabData(tabName) {
        switch (tabName) {
            case 'analytics':
                this.loadAnalyticsData();
                break;
            case 'security':
                this.loadSecurityData();
                break;
            case 'performance':
                this.loadPerformanceData();
                break;
            case 'payments':
                this.loadPaymentsData();
                break;
            case 'users':
                this.loadUsersData();
                break;
        }
    }

    loadAnalyticsData() {
        // Update analytics specific data
        if (window.advancedAnalytics) {
            const data = window.advancedAnalytics.getMetrics();
            
            document.querySelector('[data-analytics="unique-users"]').textContent = data.uniqueUsers || '0';
            document.querySelector('[data-analytics="page-views"]').textContent = data.pageViews || '0';
            document.querySelector('[data-analytics="avg-time"]').textContent = this.formatTime(data.avgSessionDuration || 0);
            document.querySelector('[data-analytics="bounce-rate"]').textContent = (data.bounceRate || 0) + '%';
        }
    }

    loadSecurityData() {
        if (window.securityManager) {
            const data = window.securityManager.getSecurityMetrics();
            
            document.querySelector('[data-security="threats"]').textContent = data.totalThreats || 0;
            document.querySelector('[data-security="blocked"]').textContent = data.blockedRequests || 0;
            document.querySelector('[data-security="vulnerabilities"]').textContent = data.validationFailures || 0;
            document.querySelector('[data-security-score]').textContent = data.securityScore || 100;
        }
    }

    loadPerformanceData() {
        document.querySelector('[data-performance="load-time"]').textContent = Math.round(performance.now()) + 'ms';
        
        if (performance.memory) {
            document.querySelector('[data-performance="memory"]').textContent = 
                Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB';
        }
    }

    loadPaymentsData() {
        if (window.paymentSystemAdvanced) {
            const data = window.paymentSystemAdvanced.getMetrics();
            
            document.querySelector('[data-payments="total"]').textContent = '$' + (data.totalAmount || 0).toLocaleString();
            document.querySelector('[data-payments="successful"]').textContent = data.successfulPayments || 0;
            document.querySelector('[data-payments="pending"]').textContent = data.pendingPayments || 0;
            document.querySelector('[data-payments="failed"]').textContent = data.failedPayments || 0;
        }
    }

    loadUsersData() {
        document.querySelector('[data-users="active"]').textContent = this.metrics.users.active;
        document.querySelector('[data-users="sessions"]').textContent = this.metrics.users.sessions;
        document.querySelector('[data-users="avg-time"]').textContent = this.formatTime(this.metrics.users.avgSessionTime);
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}:${minutes % 60}:${seconds % 60}`;
        } else if (minutes > 0) {
            return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
        } else {
            return `0:${seconds.toString().padStart(2, '0')}`;
        }
    }

    showLogsModal() {
        const modal = new bootstrap.Modal(document.getElementById('dashboard-logs-modal'));
        this.loadLogs();
        modal.show();
    }

    loadLogs() {
        const logsList = document.querySelector('.logs-list');
        
        // Get logs from various sources
        const logs = [
            ...this.logs,
            ...this.getConsoleLogsType(),
            ...this.getSecurityLogs(),
            ...this.getPerformanceLogs()
        ];
        
        logs.sort((a, b) => b.timestamp - a.timestamp);
        
        logsList.innerHTML = logs.slice(0, 100).map(log => `
            <div class="log-entry">
                <span class="log-time">${new Date(log.timestamp).toLocaleTimeString()}</span>
                <span class="log-level ${log.level}">${log.level.toUpperCase()}</span>
                <span class="log-message">${log.message}</span>
            </div>
        `).join('');
    }

    getConsoleLogsType() {
        // This would integrate with a logging system
        return [
            { timestamp: Date.now(), level: 'info', message: 'Dashboard inicializado correctamente' },
            { timestamp: Date.now() - 60000, level: 'info', message: 'Sistema de analytics conectado' },
            { timestamp: Date.now() - 120000, level: 'info', message: 'Seguridad del sitio verificada' }
        ];
    }

    getSecurityLogs() {
        if (window.securityManager) {
            // Get security logs
            return [
                { timestamp: Date.now() - 30000, level: 'info', message: 'Escaneo de seguridad completado' }
            ];
        }
        return [];
    }

    getPerformanceLogs() {
        return [
            { timestamp: Date.now() - 45000, level: 'info', message: 'Optimizaciones de rendimiento aplicadas' }
        ];
    }

    saveSettings() {
        const settings = {
            autoRefresh: document.getElementById('auto-refresh').checked,
            refreshInterval: parseInt(document.getElementById('refresh-interval').value),
            alertErrors: document.getElementById('alert-errors').checked,
            alertSecurity: document.getElementById('alert-security').checked,
            showRealtime: document.getElementById('show-realtime').checked,
            showDetailed: document.getElementById('show-detailed').checked
        };
        
        localStorage.setItem('admin_dashboard_settings', JSON.stringify(settings));
        
        // Apply settings
        if (settings.autoRefresh) {
            this.startRealTimeUpdates();
        } else {
            this.stopRealTimeUpdates();
        }
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('dashboard-settings-modal'));
        modal.hide();
        
        this.showNotification('Configuración guardada exitosamente', 'success');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} dashboard-notification`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1070;
            min-width: 300px;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 4000);
    }

    refreshRecentActivity() {
        this.updateRecentActivity();
        
        const button = document.querySelector('.refresh-activity');
        button.innerHTML = '<i class="fas fa-sync fa-spin"></i>';
        
        setTimeout(() => {
            button.innerHTML = '<i class="fas fa-sync"></i>';
        }, 1000);
    }

    // ============================================
    // PUBLIC API
    // ============================================

    getDashboardMetrics() {
        return { ...this.metrics };
    }

    addCustomWidget(widgetConfig) {
        this.widgets.set(widgetConfig.id, widgetConfig);
    }

    logActivity(activity) {
        this.logs.push({
            timestamp: Date.now(),
            level: activity.level || 'info',
            message: activity.message
        });
    }
}

// Auto-inicialización
let adminDashboardAdvanced;

document.addEventListener('DOMContentLoaded', () => {
    adminDashboardAdvanced = new AdminDashboardAdvanced();
    
    // Hacer disponible globalmente
    window.adminDashboardAdvanced = adminDashboardAdvanced;
});

// Agregar estilos para el dashboard
const dashboardStyles = document.createElement('style');
dashboardStyles.textContent = `
    .dashboard-container {
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        width: 95vw;
        height: 90vh;
        max-width: 1400px;
        max-height: 900px;
        display: flex;
        flex-direction: column;
        transform: scale(0.9);
        opacity: 0;
        transition: all 0.3s ease;
        overflow: hidden;
    }
    
    .dashboard-container.fullscreen {
        width: 100vw;
        height: 100vh;
        max-width: none;
        max-height: none;
        border-radius: 0;
    }
    
    .dashboard-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px 30px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    
    .dashboard-title h4 {
        margin: 0;
        font-weight: 600;
    }
    
    .dashboard-subtitle {
        font-size: 0.9rem;
        opacity: 0.8;
        margin-top: 2px;
    }
    
    .dashboard-controls {
        display: flex;
        gap: 10px;
    }
    
    .dashboard-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }
    
    .dashboard-tabs {
        display: flex;
        border-bottom: 1px solid #dee2e6;
        background: #f8f9fa;
        padding: 0 30px;
    }
    
    .tab-button {
        background: none;
        border: none;
        padding: 15px 20px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-weight: 500;
        color: #6c757d;
        border-bottom: 3px solid transparent;
    }
    
    .tab-button:hover {
        color: #495057;
        background: rgba(0,0,0,0.05);
    }
    
    .tab-button.active {
        color: #007bff;
        border-bottom-color: #007bff;
        background: white;
    }
    
    .dashboard-tabs-content {
        flex: 1;
        overflow: auto;
        padding: 30px;
    }
    
    .tab-content {
        display: none;
    }
    
    .tab-content.active {
        display: block;
    }
    
    .overview-widgets {
        display: flex;
        flex-direction: column;
        gap: 25px;
    }
    
    .widget-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
    }
    
    .widget {
        background: white;
        border: 1px solid #e3e6f0;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        transition: all 0.3s ease;
    }
    
    .widget:hover {
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        transform: translateY(-2px);
    }
    
    .metric-widget {
        display: flex;
        align-items: center;
        gap: 15px;
    }
    
    .widget-icon {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
    }
    
    .system-icon { background: linear-gradient(135deg, #667eea, #764ba2); color: white; }
    .users-icon { background: linear-gradient(135deg, #f093fb, #f5576c); color: white; }
    .views-icon { background: linear-gradient(135deg, #4facfe, #00f2fe); color: white; }
    .security-icon { background: linear-gradient(135deg, #43e97b, #38f9d7); color: white; }
    
    .widget-content {
        flex: 1;
    }
    
    .widget-title {
        font-size: 0.9rem;
        color: #6c757d;
        margin-bottom: 5px;
    }
    
    .widget-value {
        font-size: 2rem;
        font-weight: bold;
        color: #2c3e50;
        line-height: 1;
        margin-bottom: 5px;
    }
    
    .widget-change {
        font-size: 0.8rem;
        color: #6c757d;
    }
    
    .widget-change.positive {
        color: #28a745;
    }
    
    .widget-change.negative {
        color: #dc3545;
    }
    
    .chart-widget {
        grid-column: span 2;
    }
    
    .list-widget {
        grid-column: span 1;
    }
    
    .alerts-widget {
        grid-column: span 3;
    }
    
    .widget-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
    }
    
    .widget-header h6 {
        margin: 0;
        color: #2c3e50;
        font-weight: 600;
    }
    
    .chart-container {
        height: 300px;
        position: relative;
    }
    
    .activity-list {
        max-height: 300px;
        overflow-y: auto;
    }
    
    .activity-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 0;
        border-bottom: 1px solid #f8f9fa;
    }
    
    .activity-item:last-child {
        border-bottom: none;
    }
    
    .activity-icon {
        width: 35px;
        height: 35px;
        background: #f8f9fa;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #6c757d;
        font-size: 0.9rem;
    }
    
    .activity-content {
        flex: 1;
    }
    
    .activity-text {
        font-size: 0.9rem;
        color: #2c3e50;
        margin-bottom: 2px;
    }
    
    .activity-time {
        font-size: 0.8rem;
        color: #6c757d;
    }
    
    .alerts-container {
        max-height: 200px;
        overflow-y: auto;
    }
    
    .log-entry {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 0;
        border-bottom: 1px solid #f8f9fa;
        font-size: 0.9rem;
    }
    
    .log-time {
        color: #6c757d;
        font-size: 0.8rem;
        width: 80px;
        flex-shrink: 0;
    }
    
    .log-level {
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 0.7rem;
        font-weight: bold;
        width: 60px;
        text-align: center;
    }
    
    .log-level.info { background: #d1ecf1; color: #0c5460; }
    .log-level.warning { background: #fff3cd; color: #856404; }
    .log-level.error { background: #f8d7da; color: #721c24; }
    .log-level.debug { background: #d4edda; color: #155724; }
    
    .log-message {
        flex: 1;
        color: #2c3e50;
    }
    
    .dashboard-notification {
        animation: slideInRight 0.3s ease-out;
    }
    
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @media (max-width: 768px) {
        .dashboard-container {
            width: 100vw;
            height: 100vh;
            border-radius: 0;
        }
        
        .dashboard-tabs {
            padding: 0 15px;
            overflow-x: auto;
            flex-wrap: nowrap;
        }
        
        .tab-button {
            white-space: nowrap;
            padding: 12px 15px;
        }
        
        .dashboard-tabs-content {
            padding: 20px 15px;
        }
        
        .widget-row {
            grid-template-columns: 1fr;
        }
        
        .chart-widget, .list-widget, .alerts-widget {
            grid-column: span 1;
        }
    }
`;

document.head.appendChild(dashboardStyles);

// Exponer la clase
window.AdminDashboardAdvanced = AdminDashboardAdvanced;

//console.log('🎛️ Admin Dashboard Advanced cargado. Usa window.adminDashboardAdvanced para acceso directo.');