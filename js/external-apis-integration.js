/**
 * 🌐 INTEGRACIÓN DE APIs EXTERNAS
 * ===============================
 * 
 * Sistema completo de integración con APIs externas para el 
 * Bachillerato General Estatal Héroes de la Patria.
 * 
 * Funcionalidades:
 * - Google APIs (Calendar, Drive, Classroom)
 * - Microsoft Graph API (Office 365, Teams)
 * - Sistema de Autenticación OAuth 2.0
 * - API del Sistema Educativo Mexicano (SEP)
 * - APIs de Meteorología y Geolocalización
 * - Integración con redes sociales educativas
 * - Sistema de cacheo inteligente
 * - Manejo de rate limiting y errores
 * 
 * @version 1.0.0
 * @author PWA Advanced System
 */

class ExternalAPIsIntegration {
    constructor() {
        this.apiClients = new Map();
        this.cache = new Map();
        this.rateLimiters = new Map();
        this.authTokens = new Map();
        this.apiConfigs = {
            google: {
                clientId: 'YOUR_GOOGLE_CLIENT_ID',
                apiKey: 'YOUR_GOOGLE_API_KEY',
                scopes: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/drive.readonly']
            },
            microsoft: {
                clientId: 'YOUR_MICROSOFT_CLIENT_ID',
                tenantId: 'YOUR_TENANT_ID',
                scopes: ['https://graph.microsoft.com/calendars.read', 'https://graph.microsoft.com/files.read']
            },
            weather: {
                apiKey: 'YOUR_WEATHER_API_KEY',
                baseUrl: 'https://api.openweathermap.org/data/2.5'
            },
            sep: {
                baseUrl: 'https://www.siged.sep.gob.mx/api',
                version: 'v1'
            }
        };
        this.analytics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            cacheHits: 0,
            rateLimitHits: 0,
            dataTransferred: 0
        };
        this.isOnline = navigator.onLine;
        this.queue = [];
        
        this.init();
    }

    async init() {
        this.setupNetworkListeners();
        this.createUI();
        this.bindEvents();
        await this.loadCachedData();
        this.startPeriodicSync();
        this.initializeRateLimiters();
    }

    createUI() {
        const ui = document.createElement('div');
        ui.id = 'external-apis-manager';
        ui.className = 'pwa-feature-panel apis-panel';
        ui.innerHTML = `
            <div class="panel-header">
                <h3>🌐 APIs Externas Manager</h3>
                <div class="panel-controls">
                    <button id="syncAllApis" class="btn-primary">
                        <span class="icon">🔄</span> Sincronizar Todo
                    </button>
                    <button id="toggleApisPanel" class="btn-secondary">
                        <span class="icon">⚙️</span> Panel
                    </button>
                </div>
            </div>
            
            <div class="apis-content">
                <div class="connection-status">
                    <div class="status-indicator" id="connectionStatus">
                        <span class="status-dot online"></span>
                        <span class="status-text">Conexión estable</span>
                        <span class="last-sync">Última sincronización: nunca</span>
                    </div>
                </div>

                <div class="api-services">
                    <h4>Servicios Integrados</h4>
                    <div class="services-grid">
                        <!-- Google Services -->
                        <div class="service-card google" data-service="google">
                            <div class="service-header">
                                <div class="service-icon">📅</div>
                                <div class="service-info">
                                    <div class="service-name">Google Workspace</div>
                                    <div class="service-status" id="googleStatus">Desconectado</div>
                                </div>
                                <div class="service-actions">
                                    <button class="connect-btn" data-service="google">Conectar</button>
                                </div>
                            </div>
                            <div class="service-features">
                                <div class="feature">📅 Google Calendar</div>
                                <div class="feature">📁 Google Drive</div>
                                <div class="feature">🎓 Google Classroom</div>
                            </div>
                            <div class="service-stats">
                                <span class="stat">Calendarios: <span id="googleCalendars">0</span></span>
                                <span class="stat">Archivos: <span id="googleFiles">0</span></span>
                            </div>
                        </div>

                        <!-- Microsoft Services -->
                        <div class="service-card microsoft" data-service="microsoft">
                            <div class="service-header">
                                <div class="service-icon">🏢</div>
                                <div class="service-info">
                                    <div class="service-name">Microsoft 365</div>
                                    <div class="service-status" id="microsoftStatus">Desconectado</div>
                                </div>
                                <div class="service-actions">
                                    <button class="connect-btn" data-service="microsoft">Conectar</button>
                                </div>
                            </div>
                            <div class="service-features">
                                <div class="feature">📧 Outlook Calendar</div>
                                <div class="feature">📁 OneDrive</div>
                                <div class="feature">👥 Microsoft Teams</div>
                            </div>
                            <div class="service-stats">
                                <span class="stat">Reuniones: <span id="microsoftMeetings">0</span></span>
                                <span class="stat">Archivos: <span id="microsoftFiles">0</span></span>
                            </div>
                        </div>

                        <!-- Weather Service -->
                        <div class="service-card weather" data-service="weather">
                            <div class="service-header">
                                <div class="service-icon">🌤️</div>
                                <div class="service-info">
                                    <div class="service-name">Clima Escolar</div>
                                    <div class="service-status" id="weatherStatus">Activo</div>
                                </div>
                                <div class="service-actions">
                                    <button class="refresh-btn" data-service="weather">Actualizar</button>
                                </div>
                            </div>
                            <div class="weather-display" id="weatherDisplay">
                                <div class="current-weather">
                                    <div class="temperature">--°C</div>
                                    <div class="condition">Cargando...</div>
                                    <div class="location">Coronel Tito Hernández, Puebla</div>
                                </div>
                            </div>
                        </div>

                        <!-- SEP Integration -->
                        <div class="service-card sep" data-service="sep">
                            <div class="service-header">
                                <div class="service-icon">🏛️</div>
                                <div class="service-info">
                                    <div class="service-name">SEP Integración</div>
                                    <div class="service-status" id="sepStatus">Configurando</div>
                                </div>
                                <div class="service-actions">
                                    <button class="sync-btn" data-service="sep">Sincronizar</button>
                                </div>
                            </div>
                            <div class="service-features">
                                <div class="feature">📊 Estadísticas Educativas</div>
                                <div class="feature">📋 Planes de Estudio</div>
                                <div class="feature">🎓 Certificaciones</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="api-data">
                    <h4>Datos Recientes</h4>
                    <div class="data-tabs">
                        <button class="tab-btn active" data-tab="calendar">📅 Calendario</button>
                        <button class="tab-btn" data-tab="files">📁 Archivos</button>
                        <button class="tab-btn" data-tab="weather">🌤️ Clima</button>
                        <button class="tab-btn" data-tab="announcements">📢 Avisos</button>
                    </div>
                    
                    <div class="tab-content">
                        <div class="tab-panel active" id="calendar-panel">
                            <div class="calendar-events" id="calendarEvents">
                                <div class="no-data">
                                    <div class="no-data-icon">📅</div>
                                    <p>No hay eventos próximos</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="tab-panel" id="files-panel">
                            <div class="recent-files" id="recentFiles">
                                <div class="no-data">
                                    <div class="no-data-icon">📁</div>
                                    <p>No hay archivos recientes</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="tab-panel" id="weather-panel">
                            <div class="weather-forecast" id="weatherForecast">
                                <div class="forecast-loading">Cargando pronóstico...</div>
                            </div>
                        </div>
                        
                        <div class="tab-panel" id="announcements-panel">
                            <div class="sep-announcements" id="sepAnnouncements">
                                <div class="no-data">
                                    <div class="no-data-icon">📢</div>
                                    <p>No hay avisos oficiales</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="api-analytics">
                    <h4>Estadísticas de API</h4>
                    <div class="analytics-grid">
                        <div class="stat-item">
                            <div class="stat-value" id="totalRequests">0</div>
                            <div class="stat-label">Peticiones totales</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value" id="successRate">100%</div>
                            <div class="stat-label">Tasa de éxito</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value" id="cacheHitRate">0%</div>
                            <div class="stat-label">Cache hit rate</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value" id="dataUsage">0 MB</div>
                            <div class="stat-label">Datos transferidos</div>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .apis-panel {
                    background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
                    color: white;
                    border-radius: 12px;
                    padding: 0;
                    max-width: 900px;
                    margin: 20px auto;
                    box-shadow: 0 8px 32px rgba(76, 175, 80, 0.3);
                    overflow: hidden;
                }

                .panel-header {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    backdrop-filter: blur(10px);
                }

                .panel-controls {
                    display: flex;
                    gap: 10px;
                }

                .apis-content {
                    padding: 20px;
                }

                .connection-status {
                    margin-bottom: 20px;
                }

                .status-indicator {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    background: rgba(255, 255, 255, 0.1);
                    padding: 15px;
                    border-radius: 8px;
                    backdrop-filter: blur(10px);
                }

                .status-dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: #4CAF50;
                    animation: pulse 2s infinite;
                }

                .status-dot.offline {
                    background: #FF5722;
                }

                .status-text {
                    font-weight: bold;
                }

                .last-sync {
                    font-size: 0.85em;
                    opacity: 0.8;
                    margin-left: auto;
                }

                .services-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .service-card {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    padding: 20px;
                    backdrop-filter: blur(10px);
                    transition: all 0.3s ease;
                }

                .service-card:hover {
                    background: rgba(255, 255, 255, 0.15);
                    transform: translateY(-2px);
                }

                .service-header {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    margin-bottom: 15px;
                }

                .service-icon {
                    font-size: 2em;
                }

                .service-info {
                    flex: 1;
                }

                .service-name {
                    font-weight: bold;
                    font-size: 1.1em;
                    margin-bottom: 5px;
                }

                .service-status {
                    font-size: 0.85em;
                    opacity: 0.8;
                }

                .service-features {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    margin-bottom: 15px;
                }

                .feature {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 5px 10px;
                    border-radius: 15px;
                    font-size: 0.8em;
                }

                .service-stats {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.85em;
                    opacity: 0.9;
                }

                .data-tabs {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 20px;
                    overflow-x: auto;
                }

                .tab-btn {
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    color: white;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    white-space: nowrap;
                    transition: all 0.3s ease;
                }

                .tab-btn.active {
                    background: rgba(255, 255, 255, 0.2);
                    font-weight: bold;
                }

                .tab-btn:hover {
                    background: rgba(255, 255, 255, 0.15);
                }

                .tab-content {
                    min-height: 200px;
                }

                .tab-panel {
                    display: none;
                }

                .tab-panel.active {
                    display: block;
                }

                .weather-display {
                    text-align: center;
                }

                .current-weather .temperature {
                    font-size: 2em;
                    font-weight: bold;
                    margin-bottom: 5px;
                }

                .current-weather .condition {
                    font-size: 1.1em;
                    margin-bottom: 5px;
                }

                .current-weather .location {
                    font-size: 0.9em;
                    opacity: 0.8;
                }

                .analytics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 15px;
                    margin-top: 20px;
                }

                .stat-item {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 15px;
                    border-radius: 8px;
                    text-align: center;
                }

                .stat-value {
                    font-size: 1.5em;
                    font-weight: bold;
                    margin-bottom: 5px;
                }

                .stat-label {
                    font-size: 0.85em;
                    opacity: 0.8;
                }

                .no-data {
                    text-align: center;
                    padding: 40px 20px;
                    opacity: 0.7;
                }

                .no-data-icon {
                    font-size: 3em;
                    margin-bottom: 10px;
                }

                .event-item, .file-item {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 10px;
                }

                .event-title, .file-name {
                    font-weight: bold;
                    margin-bottom: 5px;
                }

                .event-time, .file-meta {
                    font-size: 0.85em;
                    opacity: 0.8;
                }

                .connect-btn, .refresh-btn, .sync-btn {
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    padding: 8px 15px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 0.85em;
                    transition: all 0.3s ease;
                }

                .connect-btn:hover, .refresh-btn:hover, .sync-btn:hover {
                    background: rgba(255, 255, 255, 0.3);
                }

                .btn-primary, .btn-secondary {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: bold;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.3s ease;
                }

                .btn-primary {
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                }

                .btn-secondary {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                @media (max-width: 768px) {
                    .services-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .analytics-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    
                    .panel-header {
                        flex-direction: column;
                        gap: 15px;
                    }
                    
                    .service-header {
                        flex-direction: column;
                        text-align: center;
                    }
                }
            </style>
        `;

        document.body.appendChild(ui);
        this.ui = ui;
    }

    bindEvents() {
        if (!this.ui) return;

        // Main controls
        this.ui.querySelector('#syncAllApis')?.addEventListener('click', () => this.syncAllAPIs());
        this.ui.querySelector('#toggleApisPanel')?.addEventListener('click', () => this.togglePanel());

        // Service connection buttons
        this.ui.querySelectorAll('.connect-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const service = e.target.dataset.service;
                this.connectService(service);
            });
        });

        // Service refresh buttons
        this.ui.querySelectorAll('.refresh-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const service = e.target.dataset.service;
                this.refreshService(service);
            });
        });

        // Service sync buttons
        this.ui.querySelectorAll('.sync-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const service = e.target.dataset.service;
                this.syncService(service);
            });
        });

        // Tab navigation
        this.ui.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabId = e.target.dataset.tab;
                this.switchTab(tabId);
            });
        });
    }

    setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateConnectionStatus();
            this.processOfflineQueue();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateConnectionStatus();
        });
    }

    updateConnectionStatus() {
        const statusDot = this.ui?.querySelector('.status-dot');
        const statusText = this.ui?.querySelector('.status-text');
        
        if (statusDot && statusText) {
            if (this.isOnline) {
                statusDot.className = 'status-dot online';
                statusText.textContent = 'Conexión estable';
            } else {
                statusDot.className = 'status-dot offline';
                statusText.textContent = 'Sin conexión - Modo offline';
            }
        }
    }

    initializeRateLimiters() {
        this.rateLimiters.set('google', { requests: [], maxRequests: 1000, windowMs: 60000 });
        this.rateLimiters.set('microsoft', { requests: [], maxRequests: 500, windowMs: 60000 });
        this.rateLimiters.set('weather', { requests: [], maxRequests: 60, windowMs: 60000 });
        this.rateLimiters.set('sep', { requests: [], maxRequests: 100, windowMs: 60000 });
    }

    async connectService(serviceName) {
        try {
            this.showNotification(`Conectando con ${serviceName}...`, 'info');
            
            switch (serviceName) {
                case 'google':
                    await this.connectGoogle();
                    break;
                case 'microsoft':
                    await this.connectMicrosoft();
                    break;
                default:
                    this.showNotification(`Conexión con ${serviceName} no implementada`, 'warning');
            }
        } catch (error) {
            console.error(`Error conectando ${serviceName}:`, error);
            this.showNotification(`Error al conectar con ${serviceName}`, 'error');
        }
    }

    async connectGoogle() {
        // Mock implementation - en producción usar Google Auth
        try {
            // Simular autenticación OAuth
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.authTokens.set('google', {
                accessToken: 'mock_google_token',
                refreshToken: 'mock_refresh_token',
                expiresAt: Date.now() + 3600000
            });

            this.updateServiceStatus('google', 'Conectado');
            await this.fetchGoogleData();
            this.showNotification('Google Workspace conectado exitosamente', 'success');
        } catch (error) {
            throw new Error('Error en autenticación Google: ' + error.message);
        }
    }

    async connectMicrosoft() {
        // Mock implementation - en producción usar Microsoft Graph Auth
        try {
            await new Promise(resolve => setTimeout(resolve, 1200));
            
            this.authTokens.set('microsoft', {
                accessToken: 'mock_microsoft_token',
                refreshToken: 'mock_refresh_token',
                expiresAt: Date.now() + 3600000
            });

            this.updateServiceStatus('microsoft', 'Conectado');
            await this.fetchMicrosoftData();
            this.showNotification('Microsoft 365 conectado exitosamente', 'success');
        } catch (error) {
            throw new Error('Error en autenticación Microsoft: ' + error.message);
        }
    }

    async refreshService(serviceName) {
        if (!this.isOnline) {
            this.showNotification('Sin conexión a internet', 'error');
            return;
        }

        try {
            this.showNotification(`Actualizando ${serviceName}...`, 'info');

            switch (serviceName) {
                case 'weather':
                    await this.fetchWeatherData();
                    break;
                default:
                    await this.syncService(serviceName);
            }
        } catch (error) {
            console.error(`Error actualizando ${serviceName}:`, error);
            this.showNotification(`Error al actualizar ${serviceName}`, 'error');
        }
    }

    async syncService(serviceName) {
        if (!this.checkRateLimit(serviceName)) {
            this.showNotification(`Rate limit alcanzado para ${serviceName}`, 'warning');
            return;
        }

        try {
            this.analytics.totalRequests++;

            switch (serviceName) {
                case 'google':
                    if (this.authTokens.has('google')) {
                        await this.fetchGoogleData();
                    }
                    break;
                case 'microsoft':
                    if (this.authTokens.has('microsoft')) {
                        await this.fetchMicrosoftData();
                    }
                    break;
                case 'sep':
                    await this.fetchSEPData();
                    break;
            }

            this.analytics.successfulRequests++;
            this.updateAnalytics();
            this.updateLastSync();
            
        } catch (error) {
            this.analytics.failedRequests++;
            console.error(`Error sincronizando ${serviceName}:`, error);
            throw error;
        }
    }

    async fetchGoogleData() {
        // Mock Google Calendar events
        const mockEvents = [
            {
                id: '1',
                title: 'Junta Docentes',
                start: new Date(Date.now() + 86400000).toISOString(),
                location: 'Aula Magna'
            },
            {
                id: '2',
                title: 'Examen Matemáticas',
                start: new Date(Date.now() + 172800000).toISOString(),
                location: 'Aula 201'
            },
            {
                id: '3',
                title: 'Festival Cultural',
                start: new Date(Date.now() + 259200000).toISOString(),
                location: 'Patio Central'
            }
        ];

        this.cache.set('google_calendar_events', {
            data: mockEvents,
            timestamp: Date.now(),
            ttl: 3600000 // 1 hour
        });

        this.updateCalendarDisplay(mockEvents);
        this.updateServiceStats('google', { calendars: 3, files: 15 });
        this.analytics.dataTransferred += JSON.stringify(mockEvents).length;
    }

    async fetchMicrosoftData() {
        // Mock Microsoft meetings
        const mockMeetings = [
            {
                id: '1',
                title: 'Reunión de Padres',
                start: new Date(Date.now() + 129600000).toISOString(),
                organizer: 'Dirección Académica'
            },
            {
                id: '2',
                title: 'Capacitación Docente',
                start: new Date(Date.now() + 216000000).toISOString(),
                organizer: 'Recursos Humanos'
            }
        ];

        this.cache.set('microsoft_meetings', {
            data: mockMeetings,
            timestamp: Date.now(),
            ttl: 3600000
        });

        this.updateServiceStats('microsoft', { meetings: mockMeetings.length, files: 8 });
        this.analytics.dataTransferred += JSON.stringify(mockMeetings).length;
    }

    async fetchWeatherData() {
        try {
            // Mock weather data for Puebla
            const mockWeather = {
                current: {
                    temp: 22,
                    condition: 'Parcialmente nublado',
                    humidity: 65,
                    windSpeed: 8
                },
                forecast: [
                    { day: 'Hoy', temp: '22°/15°', condition: '⛅', icon: '⛅' },
                    { day: 'Mañana', temp: '24°/16°', condition: '☀️', icon: '☀️' },
                    { day: 'Miércoles', temp: '20°/14°', condition: '🌧️', icon: '🌧️' },
                    { day: 'Jueves', temp: '23°/17°', condition: '⛅', icon: '⛅' },
                    { day: 'Viernes', temp: '25°/18°', condition: '☀️', icon: '☀️' }
                ]
            };

            this.cache.set('weather_data', {
                data: mockWeather,
                timestamp: Date.now(),
                ttl: 600000 // 10 minutes
            });

            this.updateWeatherDisplay(mockWeather);
            this.updateServiceStatus('weather', 'Activo - Actualizado');
            this.analytics.dataTransferred += JSON.stringify(mockWeather).length;

        } catch (error) {
            console.error('Error fetching weather data:', error);
            this.updateServiceStatus('weather', 'Error de conexión');
        }
    }

    async fetchSEPData() {
        // Mock SEP announcements
        const mockAnnouncements = [
            {
                id: '1',
                title: 'Nuevo Calendario Escolar 2024-2025',
                content: 'Se ha publicado el calendario oficial para el próximo ciclo escolar.',
                date: new Date().toISOString(),
                priority: 'high'
            },
            {
                id: '2',
                title: 'Actualización de Planes de Estudio',
                content: 'Modificaciones menores en las materias optativas de bachillerato.',
                date: new Date(Date.now() - 86400000).toISOString(),
                priority: 'medium'
            }
        ];

        this.cache.set('sep_announcements', {
            data: mockAnnouncements,
            timestamp: Date.now(),
            ttl: 7200000 // 2 hours
        });

        this.updateAnnouncementsDisplay(mockAnnouncements);
        this.updateServiceStatus('sep', 'Sincronizado');
        this.analytics.dataTransferred += JSON.stringify(mockAnnouncements).length;
    }

    updateCalendarDisplay(events) {
        const panel = this.ui?.querySelector('#calendar-panel .calendar-events');
        if (!panel) return;

        if (events.length === 0) {
            panel.innerHTML = `
                <div class="no-data">
                    <div class="no-data-icon">📅</div>
                    <p>No hay eventos próximos</p>
                </div>
            `;
            return;
        }

        const eventsHTML = events.map(event => `
            <div class="event-item">
                <div class="event-title">${event.title}</div>
                <div class="event-time">
                    📅 ${new Date(event.start).toLocaleDateString('es-MX', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </div>
                ${event.location ? `<div class="event-location">📍 ${event.location}</div>` : ''}
            </div>
        `).join('');

        panel.innerHTML = eventsHTML;
    }

    updateWeatherDisplay(weatherData) {
        const currentWeather = this.ui?.querySelector('.current-weather');
        const forecastPanel = this.ui?.querySelector('#weather-panel .weather-forecast');
        
        if (currentWeather) {
            currentWeather.innerHTML = `
                <div class="temperature">${weatherData.current.temp}°C</div>
                <div class="condition">${weatherData.current.condition}</div>
                <div class="location">Coronel Tito Hernández, Puebla</div>
            `;
        }

        if (forecastPanel && weatherData.forecast) {
            const forecastHTML = `
                <div class="forecast-grid">
                    ${weatherData.forecast.map(day => `
                        <div class="forecast-day">
                            <div class="day-name">${day.day}</div>
                            <div class="day-icon">${day.icon}</div>
                            <div class="day-temp">${day.temp}</div>
                        </div>
                    `).join('')}
                </div>
                <style>
                    .forecast-grid {
                        display: grid;
                        grid-template-columns: repeat(5, 1fr);
                        gap: 15px;
                        margin-top: 20px;
                    }
                    .forecast-day {
                        text-align: center;
                        background: rgba(255, 255, 255, 0.1);
                        padding: 15px;
                        border-radius: 8px;
                    }
                    .day-name {
                        font-size: 0.85em;
                        opacity: 0.8;
                        margin-bottom: 10px;
                    }
                    .day-icon {
                        font-size: 2em;
                        margin-bottom: 10px;
                    }
                    .day-temp {
                        font-weight: bold;
                    }
                </style>
            `;
            forecastPanel.innerHTML = forecastHTML;
        }
    }

    updateAnnouncementsDisplay(announcements) {
        const panel = this.ui?.querySelector('#announcements-panel .sep-announcements');
        if (!panel) return;

        if (announcements.length === 0) {
            panel.innerHTML = `
                <div class="no-data">
                    <div class="no-data-icon">📢</div>
                    <p>No hay avisos oficiales</p>
                </div>
            `;
            return;
        }

        const announcementsHTML = announcements.map(announcement => `
            <div class="announcement-item priority-${announcement.priority}">
                <div class="announcement-title">
                    ${announcement.priority === 'high' ? '🚨' : '📢'} ${announcement.title}
                </div>
                <div class="announcement-content">${announcement.content}</div>
                <div class="announcement-date">
                    ${new Date(announcement.date).toLocaleDateString('es-MX')}
                </div>
            </div>
        `).join('');

        panel.innerHTML = announcementsHTML + `
            <style>
                .announcement-item {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 10px;
                }
                .priority-high {
                    border-left: 4px solid #FF5722;
                }
                .priority-medium {
                    border-left: 4px solid #FF9800;
                }
                .announcement-title {
                    font-weight: bold;
                    margin-bottom: 8px;
                }
                .announcement-content {
                    margin-bottom: 8px;
                    opacity: 0.9;
                }
                .announcement-date {
                    font-size: 0.8em;
                    opacity: 0.7;
                }
            </style>
        `;
    }

    updateServiceStatus(service, status) {
        const statusElement = this.ui?.querySelector(`#${service}Status`);
        if (statusElement) {
            statusElement.textContent = status;
        }
    }

    updateServiceStats(service, stats) {
        Object.keys(stats).forEach(key => {
            const element = this.ui?.querySelector(`#${service}${key.charAt(0).toUpperCase() + key.slice(1)}`);
            if (element) {
                element.textContent = stats[key];
            }
        });
    }

    updateAnalytics() {
        const totalRequests = this.ui?.querySelector('#totalRequests');
        const successRate = this.ui?.querySelector('#successRate');
        const cacheHitRate = this.ui?.querySelector('#cacheHitRate');
        const dataUsage = this.ui?.querySelector('#dataUsage');

        if (totalRequests) totalRequests.textContent = this.analytics.totalRequests;
        
        if (successRate) {
            const rate = this.analytics.totalRequests > 0 
                ? (this.analytics.successfulRequests / this.analytics.totalRequests * 100).toFixed(1)
                : 100;
            successRate.textContent = `${rate}%`;
        }
        
        if (cacheHitRate) {
            const rate = this.analytics.totalRequests > 0
                ? (this.analytics.cacheHits / this.analytics.totalRequests * 100).toFixed(1)
                : 0;
            cacheHitRate.textContent = `${rate}%`;
        }
        
        if (dataUsage) {
            dataUsage.textContent = `${(this.analytics.dataTransferred / 1024 / 1024).toFixed(1)} MB`;
        }
    }

    updateLastSync() {
        const lastSyncElement = this.ui?.querySelector('.last-sync');
        if (lastSyncElement) {
            lastSyncElement.textContent = `Última sincronización: ${new Date().toLocaleTimeString('es-MX')}`;
        }
    }

    switchTab(tabId) {
        // Hide all tabs
        this.ui?.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        this.ui?.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab
        const targetPanel = this.ui?.querySelector(`#${tabId}-panel`);
        const targetBtn = this.ui?.querySelector(`[data-tab="${tabId}"]`);
        
        if (targetPanel) targetPanel.classList.add('active');
        if (targetBtn) targetBtn.classList.add('active');
    }

    checkRateLimit(service) {
        const limiter = this.rateLimiters.get(service);
        if (!limiter) return true;

        const now = Date.now();
        limiter.requests = limiter.requests.filter(timestamp => 
            now - timestamp < limiter.windowMs
        );

        if (limiter.requests.length >= limiter.maxRequests) {
            this.analytics.rateLimitHits++;
            return false;
        }

        limiter.requests.push(now);
        return true;
    }

    async syncAllAPIs() {
        this.showNotification('Sincronizando todas las APIs...', 'info');
        
        const syncPromises = [];
        
        if (this.authTokens.has('google')) {
            syncPromises.push(this.syncService('google'));
        }
        
        if (this.authTokens.has('microsoft')) {
            syncPromises.push(this.syncService('microsoft'));
        }
        
        syncPromises.push(this.syncService('weather'));
        syncPromises.push(this.syncService('sep'));

        try {
            await Promise.allSettled(syncPromises);
            this.showNotification('Sincronización completada', 'success');
        } catch (error) {
            console.error('Error en sincronización masiva:', error);
            this.showNotification('Error en sincronización', 'error');
        }
    }

    async loadCachedData() {
        try {
            const cachedWeather = this.getCachedData('weather_data');
            if (cachedWeather) {
                this.updateWeatherDisplay(cachedWeather);
            } else {
                await this.fetchWeatherData();
            }

            const cachedEvents = this.getCachedData('google_calendar_events');
            if (cachedEvents) {
                this.updateCalendarDisplay(cachedEvents);
            }

            const cachedAnnouncements = this.getCachedData('sep_announcements');
            if (cachedAnnouncements) {
                this.updateAnnouncementsDisplay(cachedAnnouncements);
            }
        } catch (error) {
            console.warn('Error loading cached data:', error);
        }
    }

    getCachedData(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        if (Date.now() - cached.timestamp > cached.ttl) {
            this.cache.delete(key);
            return null;
        }

        this.analytics.cacheHits++;
        return cached.data;
    }

    processOfflineQueue() {
        while (this.queue.length > 0) {
            const request = this.queue.shift();
            this.executeRequest(request);
        }
    }

    async executeRequest(request) {
        try {
            await this.syncService(request.service);
        } catch (error) {
            console.error('Error executing queued request:', error);
        }
    }

    startPeriodicSync() {
        setInterval(async () => {
            if (this.isOnline) {
                // Sync weather every 10 minutes
                await this.refreshService('weather');
                
                // Sync other services every 30 minutes
                if (Date.now() % (30 * 60 * 1000) < 60000) {
                    await this.syncAllAPIs();
                }
            }
        }, 10 * 60 * 1000); // Every 10 minutes
    }

    togglePanel() {
        if (!this.ui) return;
        this.ui.style.display = this.ui.style.display === 'none' ? 'block' : 'none';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `api-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">
                    ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
                </span>
                <span class="notification-message">${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    getStatus() {
        return {
            online: this.isOnline,
            connectedServices: Array.from(this.authTokens.keys()),
            cachedItems: this.cache.size,
            analytics: this.analytics,
            queueSize: this.queue.length
        };
    }

    getAnalytics() {
        return {
            ...this.analytics,
            cacheHitRate: this.analytics.totalRequests > 0 
                ? (this.analytics.cacheHits / this.analytics.totalRequests * 100).toFixed(1)
                : 0,
            successRate: this.analytics.totalRequests > 0 
                ? (this.analytics.successfulRequests / this.analytics.totalRequests * 100).toFixed(1)
                : 0
        };
    }
}

// Inicialización global
let externalAPIsIntegration;

// Auto-inicialización cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        externalAPIsIntegration = new ExternalAPIsIntegration();
    });
} else {
    externalAPIsIntegration = new ExternalAPIsIntegration();
}

// Exportar para uso global
window.externalAPIsIntegration = externalAPIsIntegration;

// Comando de consola para testing
window.testExternalAPIs = async () => {
    if (externalAPIsIntegration) {
        //console.log('🌐 Estado de APIs Externas:', externalAPIsIntegration.getStatus());
        //console.log('🌐 Analytics:', externalAPIsIntegration.getAnalytics());
        
        //console.log('🌐 Iniciando sincronización de prueba...');
        await externalAPIsIntegration.syncAllAPIs();
    }
};

//console.log('🌐 External APIs Integration inicializado correctamente');