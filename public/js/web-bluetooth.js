/**
 * 🔵 WEB BLUETOOTH - CONECTIVIDAD IoT AVANZADA
 * ============================================
 * 
 * Sistema completo de Web Bluetooth para conexión con dispositivos IoT
 * en el entorno educativo del Bachillerato Héroes de la Patria.
 * 
 * Funcionalidades:
 * - Conexión con dispositivos educativos
 * - Sensores ambientales para laboratorios
 * - Dispositivos de seguridad escolar
 * - Monitores de asistencia Bluetooth
 * - Interfaces para equipos científicos
 * 
 * @version 1.0.0
 * @author PWA Advanced System
 */

class WebBluetoothManager {
    constructor() {
        this.isSupported = 'bluetooth' in navigator;
        this.connectedDevices = new Map();
        this.deviceTypes = {
            ENVIRONMENTAL_SENSOR: 'environmental',
            SECURITY_DEVICE: 'security',
            ATTENDANCE_MONITOR: 'attendance',
            LABORATORY_EQUIPMENT: 'laboratory',
            EDUCATIONAL_TOOLS: 'educational'
        };
        this.services = {
            ENVIRONMENTAL: 'environmental_sensing',
            HEART_RATE: 'heart_rate',
            BATTERY: 'battery_service',
            DEVICE_INFO: 'device_information',
            CUSTOM_EDUCATION: '12345678-1234-1234-1234-123456789abc'
        };
        this.analytics = {
            connectionsAttempted: 0,
            connectionsSuccessful: 0,
            devicesConnected: 0,
            dataTransferred: 0,
            errors: []
        };
        this.ui = null;
        this.isScanning = false;
        this.notifications = [];
        
        this.init();
    }

    async init() {
        if (!this.isSupported) {
            console.warn('🔵 Web Bluetooth no soportado en este navegador');
            this.createFallbackUI();
            return;
        }

        this.createUI();
        this.bindEvents();
        await this.loadSavedDevices();
        this.startPeriodicCheck();
    }

    createUI() {
        const ui = document.createElement('div');
        ui.id = 'webblutooth-manager';
        ui.className = 'pwa-feature-panel bluetooth-panel';
        ui.innerHTML = `
            <div class="panel-header">
                <h3>🔵 Bluetooth IoT Manager</h3>
                <div class="panel-controls">
                    <button id="bluetoothScanBtn" class="btn-primary">
                        <span class="icon">📡</span> Buscar Dispositivos
                    </button>
                    <button id="bluetoothToggleBtn" class="btn-secondary">
                        <span class="icon">📱</span> Panel
                    </button>
                </div>
            </div>
            
            <div class="bluetooth-content">
                <div class="bluetooth-status">
                    <div class="status-indicator" id="bluetoothStatus">
                        <span class="status-dot"></span>
                        <span class="status-text">Listo para conectar</span>
                    </div>
                </div>

                <div class="device-categories">
                    <h4>Categorías de Dispositivos</h4>
                    <div class="category-grid">
                        <div class="category-card" data-type="environmental">
                            <div class="category-icon">🌡️</div>
                            <div class="category-title">Sensores Ambientales</div>
                            <div class="category-desc">Temperatura, humedad, calidad del aire</div>
                            <div class="device-count">0 conectados</div>
                        </div>
                        <div class="category-card" data-type="security">
                            <div class="category-icon">🔒</div>
                            <div class="category-title">Seguridad Escolar</div>
                            <div class="category-desc">Cerraduras inteligentes, alarmas</div>
                            <div class="device-count">0 conectados</div>
                        </div>
                        <div class="category-card" data-type="attendance">
                            <div class="category-icon">📋</div>
                            <div class="category-title">Control de Asistencia</div>
                            <div class="category-desc">Lectores de proximidad</div>
                            <div class="device-count">0 conectados</div>
                        </div>
                        <div class="category-card" data-type="laboratory">
                            <div class="category-icon">🔬</div>
                            <div class="category-title">Equipos de Laboratorio</div>
                            <div class="category-desc">Microscopios, balanzas digitales</div>
                            <div class="device-count">0 conectados</div>
                        </div>
                        <div class="category-card" data-type="educational">
                            <div class="category-icon">📚</div>
                            <div class="category-title">Herramientas Educativas</div>
                            <div class="category-desc">Calculadoras, tablets, robots</div>
                            <div class="device-count">0 conectados</div>
                        </div>
                    </div>
                </div>

                <div class="connected-devices">
                    <h4>Dispositivos Conectados</h4>
                    <div id="connectedDevicesList" class="devices-list">
                        <div class="no-devices">
                            <div class="empty-icon">📱</div>
                            <p>No hay dispositivos conectados</p>
                            <p class="helper-text">Toca "Buscar Dispositivos" para conectar nuevos dispositivos</p>
                        </div>
                    </div>
                </div>

                <div class="scanning-overlay" id="scanningOverlay">
                    <div class="scanning-content">
                        <div class="scanning-animation">
                            <div class="radar-circle"></div>
                            <div class="radar-sweep"></div>
                        </div>
                        <h4>Buscando dispositivos Bluetooth...</h4>
                        <p>Asegúrate de que los dispositivos estén en modo de emparejamiento</p>
                        <div class="found-devices" id="foundDevices"></div>
                        <button id="stopScanBtn" class="btn-secondary">Detener búsqueda</button>
                    </div>
                </div>

                <div class="bluetooth-analytics">
                    <h4>Estadísticas de Conexión</h4>
                    <div class="analytics-grid">
                        <div class="stat-item">
                            <div class="stat-value" id="connectionsCount">0</div>
                            <div class="stat-label">Conexiones exitosas</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value" id="devicesCount">0</div>
                            <div class="stat-label">Dispositivos activos</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value" id="dataTransferred">0 KB</div>
                            <div class="stat-label">Datos transferidos</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value" id="uptime">0m</div>
                            <div class="stat-label">Tiempo activo</div>
                        </div>
                    </div>
                </div>

                <div class="device-details" id="deviceDetails">
                    <!-- Detalles del dispositivo seleccionado -->
                </div>
            </div>

            <style>
                .bluetooth-panel {
                    background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
                    color: white;
                    border-radius: 12px;
                    padding: 0;
                    max-width: 800px;
                    margin: 20px auto;
                    box-shadow: 0 8px 32px rgba(33, 150, 243, 0.3);
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

                .bluetooth-content {
                    padding: 20px;
                    position: relative;
                }

                .bluetooth-status {
                    margin-bottom: 20px;
                }

                .status-indicator {
                    display: flex;
                    align-items: center;
                    gap: 10px;
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

                .category-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-bottom: 30px;
                }

                .category-card {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 20px;
                    border-radius: 8px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    backdrop-filter: blur(10px);
                }

                .category-card:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: translateY(-2px);
                }

                .category-icon {
                    font-size: 2em;
                    margin-bottom: 10px;
                }

                .category-title {
                    font-weight: bold;
                    margin-bottom: 5px;
                }

                .category-desc {
                    font-size: 0.85em;
                    opacity: 0.8;
                    margin-bottom: 10px;
                }

                .device-count {
                    font-size: 0.8em;
                    background: rgba(255, 255, 255, 0.2);
                    padding: 5px 10px;
                    border-radius: 15px;
                    display: inline-block;
                }

                .devices-list {
                    min-height: 100px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 20px;
                }

                .no-devices {
                    text-align: center;
                    opacity: 0.7;
                }

                .empty-icon {
                    font-size: 3em;
                    margin-bottom: 10px;
                }

                .device-item {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 10px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .device-info {
                    flex: 1;
                }

                .device-name {
                    font-weight: bold;
                    margin-bottom: 5px;
                }

                .device-meta {
                    font-size: 0.85em;
                    opacity: 0.8;
                }

                .device-actions {
                    display: flex;
                    gap: 10px;
                }

                .scanning-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.9);
                    display: none;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }

                .scanning-overlay.active {
                    display: flex;
                }

                .scanning-content {
                    text-align: center;
                    max-width: 400px;
                    padding: 40px;
                }

                .scanning-animation {
                    position: relative;
                    width: 120px;
                    height: 120px;
                    margin: 0 auto 20px;
                }

                .radar-circle {
                    width: 100%;
                    height: 100%;
                    border: 2px solid rgba(33, 150, 243, 0.3);
                    border-radius: 50%;
                    position: absolute;
                }

                .radar-sweep {
                    width: 2px;
                    height: 50%;
                    background: linear-gradient(to bottom, #2196F3, transparent);
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform-origin: bottom center;
                    animation: radarSweep 2s linear infinite;
                }

                .analytics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 15px;
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

                .found-devices {
                    margin: 20px 0;
                    text-align: left;
                }

                .found-device {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 10px;
                    border-radius: 5px;
                    margin-bottom: 10px;
                    cursor: pointer;
                    transition: background 0.3s ease;
                }

                .found-device:hover {
                    background: rgba(255, 255, 255, 0.2);
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                @keyframes radarSweep {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
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

                .btn-primary:hover {
                    background: rgba(255, 255, 255, 0.3);
                }

                .btn-secondary {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                }

                .btn-secondary:hover {
                    background: rgba(255, 255, 255, 0.2);
                }

                @media (max-width: 768px) {
                    .category-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .analytics-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    
                    .panel-header {
                        flex-direction: column;
                        gap: 15px;
                    }
                }
            </style>
        `;

        document.body.appendChild(ui);
        this.ui = ui;
    }

    createFallbackUI() {
        const fallback = document.createElement('div');
        fallback.className = 'bluetooth-fallback';
        fallback.innerHTML = `
            <div class="fallback-content">
                <h3>🔵 Web Bluetooth no disponible</h3>
                <p>Tu navegador no soporta Web Bluetooth API.</p>
                <p>Funcionalidades disponibles en navegadores compatibles:</p>
                <ul>
                    <li>Chrome 56+ (Windows, macOS, Android)</li>
                    <li>Edge 79+ (Windows)</li>
                    <li>Opera 43+ (Windows, macOS, Android)</li>
                </ul>
                <div class="fallback-features">
                    <h4>Dispositivos soportados:</h4>
                    <div class="feature-list">
                        <div class="feature-item">🌡️ Sensores ambientales</div>
                        <div class="feature-item">🔒 Dispositivos de seguridad</div>
                        <div class="feature-item">📋 Control de asistencia</div>
                        <div class="feature-item">🔬 Equipos de laboratorio</div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(fallback);
    }

    bindEvents() {
        if (!this.ui) return;

        const scanBtn = this.ui.querySelector('#bluetoothScanBtn');
        const toggleBtn = this.ui.querySelector('#bluetoothToggleBtn');
        const stopScanBtn = this.ui.querySelector('#stopScanBtn');

        scanBtn?.addEventListener('click', () => this.scanForDevices());
        toggleBtn?.addEventListener('click', () => this.togglePanel());
        stopScanBtn?.addEventListener('click', () => this.stopScanning());

        // Category card clicks
        this.ui.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', () => {
                const type = card.dataset.type;
                this.scanForDeviceType(type);
            });
        });
    }

    async scanForDevices() {
        if (!this.isSupported) {
            this.showNotification('Web Bluetooth no soportado', 'error');
            return;
        }

        this.showScanningOverlay();
        this.isScanning = true;

        try {
            this.analytics.connectionsAttempted++;
            
            const device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: [
                    'battery_service',
                    'device_information',
                    'environmental_sensing',
                    'heart_rate',
                    this.services.CUSTOM_EDUCATION
                ]
            });

            await this.connectDevice(device);
            this.hideScanningOverlay();
            
        } catch (error) {
            console.error('🔵 Error en escaneo Bluetooth:', error);
            this.analytics.errors.push({
                type: 'scan_error',
                message: error.message,
                timestamp: new Date()
            });
            this.showNotification('Error al buscar dispositivos: ' + error.message, 'error');
            this.hideScanningOverlay();
        }
    }

    async scanForDeviceType(deviceType) {
        if (!this.isSupported) return;

        const filters = this.getFiltersForDeviceType(deviceType);
        this.showScanningOverlay();

        try {
            const device = await navigator.bluetooth.requestDevice(filters);
            device.deviceType = deviceType;
            await this.connectDevice(device);
            this.hideScanningOverlay();
        } catch (error) {
            console.error(`🔵 Error al buscar dispositivos ${deviceType}:`, error);
            this.showNotification(`Error al buscar dispositivos ${deviceType}`, 'error');
            this.hideScanningOverlay();
        }
    }

    getFiltersForDeviceType(deviceType) {
        const baseFilters = {
            optionalServices: ['battery_service', 'device_information']
        };

        switch (deviceType) {
            case this.deviceTypes.ENVIRONMENTAL_SENSOR:
                return {
                    ...baseFilters,
                    filters: [
                        { services: ['environmental_sensing'] },
                        { namePrefix: 'ENV' },
                        { namePrefix: 'Sensor' }
                    ]
                };
            case this.deviceTypes.SECURITY_DEVICE:
                return {
                    ...baseFilters,
                    filters: [
                        { namePrefix: 'Security' },
                        { namePrefix: 'Lock' },
                        { namePrefix: 'Alarm' }
                    ]
                };
            case this.deviceTypes.ATTENDANCE_MONITOR:
                return {
                    ...baseFilters,
                    filters: [
                        { namePrefix: 'Attendance' },
                        { namePrefix: 'RFID' },
                        { namePrefix: 'Reader' }
                    ]
                };
            case this.deviceTypes.LABORATORY_EQUIPMENT:
                return {
                    ...baseFilters,
                    filters: [
                        { namePrefix: 'Lab' },
                        { namePrefix: 'Scale' },
                        { namePrefix: 'Microscope' }
                    ]
                };
            case this.deviceTypes.EDUCATIONAL_TOOLS:
                return {
                    ...baseFilters,
                    filters: [
                        { namePrefix: 'Calc' },
                        { namePrefix: 'Robot' },
                        { namePrefix: 'Education' }
                    ]
                };
            default:
                return { acceptAllDevices: true, ...baseFilters };
        }
    }

    async connectDevice(device) {
        try {
            await device.gatt.connect();
            
            const deviceInfo = {
                id: device.id,
                name: device.name || 'Dispositivo desconocido',
                type: device.deviceType || 'unknown',
                gatt: device.gatt,
                services: [],
                characteristics: new Map(),
                connected: true,
                connectedAt: new Date(),
                battery: null,
                rssi: null
            };

            // Obtener servicios disponibles
            const services = await device.gatt.getPrimaryServices();
            for (const service of services) {
                const characteristics = await service.getCharacteristics();
                deviceInfo.services.push({
                    uuid: service.uuid,
                    characteristics: characteristics.map(c => c.uuid)
                });
                
                for (const characteristic of characteristics) {
                    deviceInfo.characteristics.set(characteristic.uuid, characteristic);
                }
            }

            // Intentar obtener información de batería
            try {
                const batteryService = await device.gatt.getPrimaryService('battery_service');
                const batteryCharacteristic = await batteryService.getCharacteristic('battery_level');
                const batteryValue = await batteryCharacteristic.readValue();
                deviceInfo.battery = batteryValue.getUint8(0);
            } catch (e) {
                //console.log('🔵 Información de batería no disponible');
            }

            this.connectedDevices.set(device.id, deviceInfo);
            this.analytics.connectionsSuccessful++;
            this.analytics.devicesConnected = this.connectedDevices.size;

            // Configurar event listeners
            device.addEventListener('gattserverdisconnected', () => {
                this.onDeviceDisconnected(device.id);
            });

            this.updateDevicesList();
            this.updateCategoryCounts();
            this.updateAnalytics();
            
            this.showNotification(`Dispositivo ${deviceInfo.name} conectado exitosamente`, 'success');
            
        } catch (error) {
            console.error('🔵 Error al conectar dispositivo:', error);
            this.showNotification('Error al conectar dispositivo: ' + error.message, 'error');
        }
    }

    onDeviceDisconnected(deviceId) {
        const device = this.connectedDevices.get(deviceId);
        if (device) {
            device.connected = false;
            this.connectedDevices.delete(deviceId);
            this.analytics.devicesConnected = this.connectedDevices.size;
            
            this.updateDevicesList();
            this.updateCategoryCounts();
            this.updateAnalytics();
            
            this.showNotification(`Dispositivo ${device.name} desconectado`, 'warning');
        }
    }

    updateDevicesList() {
        const devicesList = this.ui?.querySelector('#connectedDevicesList');
        if (!devicesList) return;

        if (this.connectedDevices.size === 0) {
            devicesList.innerHTML = `
                <div class="no-devices">
                    <div class="empty-icon">📱</div>
                    <p>No hay dispositivos conectados</p>
                    <p class="helper-text">Toca "Buscar Dispositivos" para conectar nuevos dispositivos</p>
                </div>
            `;
            return;
        }

        let devicesHTML = '';
        for (const [deviceId, device] of this.connectedDevices) {
            const typeIcon = this.getDeviceTypeIcon(device.type);
            const batteryInfo = device.battery !== null ? `🔋 ${device.battery}%` : '';
            const connectedTime = this.formatTimeDifference(device.connectedAt);

            devicesHTML += `
                <div class="device-item" data-device-id="${deviceId}">
                    <div class="device-info">
                        <div class="device-name">${typeIcon} ${device.name}</div>
                        <div class="device-meta">
                            Conectado hace ${connectedTime} • ${device.services.length} servicios ${batteryInfo}
                        </div>
                    </div>
                    <div class="device-actions">
                        <button class="btn-secondary device-details-btn" data-device-id="${deviceId}">
                            Detalles
                        </button>
                        <button class="btn-secondary device-disconnect-btn" data-device-id="${deviceId}">
                            Desconectar
                        </button>
                    </div>
                </div>
            `;
        }

        devicesList.innerHTML = devicesHTML;

        // Bind events for new buttons
        devicesList.querySelectorAll('.device-details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const deviceId = e.target.dataset.deviceId;
                this.showDeviceDetails(deviceId);
            });
        });

        devicesList.querySelectorAll('.device-disconnect-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const deviceId = e.target.dataset.deviceId;
                this.disconnectDevice(deviceId);
            });
        });
    }

    updateCategoryCounts() {
        const categories = this.ui?.querySelectorAll('.category-card');
        if (!categories) return;

        const counts = {};
        Object.values(this.deviceTypes).forEach(type => {
            counts[type] = 0;
        });

        for (const device of this.connectedDevices.values()) {
            if (counts.hasOwnProperty(device.type)) {
                counts[device.type]++;
            }
        }

        categories.forEach(card => {
            const type = card.dataset.type;
            const countElement = card.querySelector('.device-count');
            const count = counts[type] || 0;
            countElement.textContent = `${count} conectado${count !== 1 ? 's' : ''}`;
        });
    }

    updateAnalytics() {
        if (!this.ui) return;

        const connectionsCount = this.ui.querySelector('#connectionsCount');
        const devicesCount = this.ui.querySelector('#devicesCount');
        const dataTransferred = this.ui.querySelector('#dataTransferred');
        const uptime = this.ui.querySelector('#uptime');

        if (connectionsCount) {
            connectionsCount.textContent = this.analytics.connectionsSuccessful;
        }
        
        if (devicesCount) {
            devicesCount.textContent = this.analytics.devicesConnected;
        }
        
        if (dataTransferred) {
            dataTransferred.textContent = `${(this.analytics.dataTransferred / 1024).toFixed(1)} KB`;
        }
        
        if (uptime) {
            const uptimeMinutes = Math.floor((Date.now() - this.startTime) / 60000);
            uptime.textContent = `${uptimeMinutes}m`;
        }
    }

    getDeviceTypeIcon(type) {
        switch (type) {
            case this.deviceTypes.ENVIRONMENTAL_SENSOR: return '🌡️';
            case this.deviceTypes.SECURITY_DEVICE: return '🔒';
            case this.deviceTypes.ATTENDANCE_MONITOR: return '📋';
            case this.deviceTypes.LABORATORY_EQUIPMENT: return '🔬';
            case this.deviceTypes.EDUCATIONAL_TOOLS: return '📚';
            default: return '📱';
        }
    }

    formatTimeDifference(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d`;
        if (hours > 0) return `${hours}h`;
        if (minutes > 0) return `${minutes}m`;
        return 'ahora';
    }

    showScanningOverlay() {
        const overlay = this.ui?.querySelector('#scanningOverlay');
        if (overlay) {
            overlay.classList.add('active');
        }
    }

    hideScanningOverlay() {
        const overlay = this.ui?.querySelector('#scanningOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
        this.isScanning = false;
    }

    stopScanning() {
        this.hideScanningOverlay();
        this.showNotification('Búsqueda de dispositivos detenida', 'info');
    }

    async disconnectDevice(deviceId) {
        const device = this.connectedDevices.get(deviceId);
        if (device && device.gatt && device.gatt.connected) {
            try {
                device.gatt.disconnect();
                this.showNotification(`Dispositivo ${device.name} desconectado`, 'info');
            } catch (error) {
                console.error('🔵 Error al desconectar dispositivo:', error);
                this.showNotification('Error al desconectar dispositivo', 'error');
            }
        }
    }

    showDeviceDetails(deviceId) {
        const device = this.connectedDevices.get(deviceId);
        if (!device) return;

        const detailsContainer = this.ui?.querySelector('#deviceDetails');
        if (!detailsContainer) return;

        const servicesHTML = device.services.map(service => `
            <div class="service-item">
                <div class="service-uuid">${service.uuid}</div>
                <div class="characteristics-count">${service.characteristics.length} características</div>
            </div>
        `).join('');

        detailsContainer.innerHTML = `
            <div class="device-details-content">
                <h4>Detalles del Dispositivo</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">Nombre:</span>
                        <span class="detail-value">${device.name}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">ID:</span>
                        <span class="detail-value">${device.id}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Tipo:</span>
                        <span class="detail-value">${device.type}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Estado:</span>
                        <span class="detail-value">${device.connected ? '✅ Conectado' : '❌ Desconectado'}</span>
                    </div>
                    ${device.battery !== null ? `
                        <div class="detail-item">
                            <span class="detail-label">Batería:</span>
                            <span class="detail-value">🔋 ${device.battery}%</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="services-section">
                    <h5>Servicios Disponibles (${device.services.length})</h5>
                    <div class="services-list">
                        ${servicesHTML}
                    </div>
                </div>
                
                <div class="actions-section">
                    <button class="btn-primary" onclick="webBluetoothManager.readDeviceData('${deviceId}')">
                        📊 Leer Datos
                    </button>
                    <button class="btn-secondary" onclick="webBluetoothManager.closeDeviceDetails()">
                        Cerrar
                    </button>
                </div>
            </div>
        `;

        detailsContainer.style.display = 'block';
    }

    closeDeviceDetails() {
        const detailsContainer = this.ui?.querySelector('#deviceDetails');
        if (detailsContainer) {
            detailsContainer.style.display = 'none';
        }
    }

    async readDeviceData(deviceId) {
        const device = this.connectedDevices.get(deviceId);
        if (!device) return;

        try {
            this.showNotification(`Leyendo datos de ${device.name}...`, 'info');
            
            // Intentar leer características disponibles
            for (const [uuid, characteristic] of device.characteristics) {
                if (characteristic.properties.read) {
                    try {
                        const value = await characteristic.readValue();
                        this.analytics.dataTransferred += value.byteLength;
                        //console.log(`🔵 Datos leídos de ${uuid}:`, value);
                    } catch (error) {
                        console.warn(`🔵 No se pudo leer característica ${uuid}:`, error);
                    }
                }
            }
            
            this.updateAnalytics();
            this.showNotification(`Datos leídos de ${device.name}`, 'success');
            
        } catch (error) {
            console.error('🔵 Error al leer datos del dispositivo:', error);
            this.showNotification('Error al leer datos del dispositivo', 'error');
        }
    }

    togglePanel() {
        if (!this.ui) return;
        
        this.ui.style.display = this.ui.style.display === 'none' ? 'block' : 'none';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `bluetooth-notification ${type}`;
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
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);

        this.notifications.push({
            message,
            type,
            timestamp: new Date()
        });
    }

    async loadSavedDevices() {
        try {
            const savedDevices = localStorage.getItem('bluetooth_devices');
            if (savedDevices) {
                const devices = JSON.parse(savedDevices);
                // Intentar reconectar dispositivos guardados
                for (const deviceInfo of devices) {
                    try {
                        const device = await navigator.bluetooth.getDevices();
                        const savedDevice = device.find(d => d.id === deviceInfo.id);
                        if (savedDevice) {
                            await this.connectDevice(savedDevice);
                        }
                    } catch (error) {
                        console.warn('🔵 No se pudo reconectar dispositivo guardado:', error);
                    }
                }
            }
        } catch (error) {
            console.warn('🔵 Error al cargar dispositivos guardados:', error);
        }
    }

    saveDevices() {
        try {
            const devicesToSave = Array.from(this.connectedDevices.values()).map(device => ({
                id: device.id,
                name: device.name,
                type: device.type
            }));
            localStorage.setItem('bluetooth_devices', JSON.stringify(devicesToSave));
        } catch (error) {
            console.warn('🔵 Error al guardar dispositivos:', error);
        }
    }

    startPeriodicCheck() {
        this.startTime = Date.now();
        
        setInterval(() => {
            this.updateAnalytics();
            this.saveDevices();
            
            // Verificar estado de conexiones
            for (const [deviceId, device] of this.connectedDevices) {
                if (device.gatt && !device.gatt.connected) {
                    this.onDeviceDisconnected(deviceId);
                }
            }
        }, 30000); // Cada 30 segundos
    }

    getStatus() {
        return {
            supported: this.isSupported,
            devicesConnected: this.connectedDevices.size,
            isScanning: this.isScanning,
            analytics: this.analytics,
            connectedDevices: Array.from(this.connectedDevices.values()).map(device => ({
                name: device.name,
                type: device.type,
                connected: device.connected,
                services: device.services.length,
                battery: device.battery
            }))
        };
    }

    getAnalytics() {
        return {
            ...this.analytics,
            uptime: Date.now() - this.startTime,
            devicesConnected: this.connectedDevices.size,
            successRate: this.analytics.connectionsAttempted > 0 
                ? (this.analytics.connectionsSuccessful / this.analytics.connectionsAttempted * 100).toFixed(1)
                : 0
        };
    }
}

// Inicialización global
let webBluetoothManager;

// Auto-inicialización cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        webBluetoothManager = new WebBluetoothManager();
    });
} else {
    webBluetoothManager = new WebBluetoothManager();
}

// Exportar para uso global
window.webBluetoothManager = webBluetoothManager;

// Comando de consola para testing
window.testWebBluetooth = async () => {
    if (webBluetoothManager) {
        //console.log('🔵 Estado de Web Bluetooth:', webBluetoothManager.getStatus());
        //console.log('🔵 Analytics:', webBluetoothManager.getAnalytics());
        
        if (webBluetoothManager.isSupported) {
            //console.log('🔵 Iniciando escaneo de prueba...');
            await webBluetoothManager.scanForDevices();
        } else {
            //console.log('🔵 Web Bluetooth no soportado en este navegador');
        }
    }
};

//console.log('🔵 Web Bluetooth Manager inicializado correctamente');