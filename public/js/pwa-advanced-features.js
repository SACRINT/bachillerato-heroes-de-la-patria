/**
 * PWA ADVANCED FEATURES - FASE 4
 * Bachillerato General Estatal "Héroes de la Patria"
 * Funcionalidades nativas avanzadas para la aplicación móvil
 */

class PWAAdvancedFeatures {
    constructor() {
        this.capabilities = {
            geolocation: false,
            camera: false,
            notifications: false,
            deviceMotion: false,
            vibration: false,
            webShare: false,
            fileSystem: false
        };
        
        this.attendanceSystem = new AttendanceSystem();
        this.cameraIntegration = new CameraIntegration();
        this.geolocationService = new GeolocationService();
        this.nativeNotifications = new NativeNotifications();
        
        this.init();
    }

    async init() {
        //console.log('🚀 Initializing PWA Advanced Features...');
        await this.detectCapabilities();
        await this.setupAdvancedFeatures();
        this.setupEventListeners();
    }

    async detectCapabilities() {
        // Geolocation
        this.capabilities.geolocation = 'geolocation' in navigator;
        
        // Camera/Media
        this.capabilities.camera = 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
        
        // Notifications
        this.capabilities.notifications = 'Notification' in window;
        
        // Device Motion
        this.capabilities.deviceMotion = 'DeviceMotionEvent' in window;
        
        // Vibration
        this.capabilities.vibration = 'vibrate' in navigator;
        
        // Web Share
        this.capabilities.webShare = 'share' in navigator;
        
        // File System Access
        this.capabilities.fileSystem = 'showOpenFilePicker' in window;
        
        //console.log('📱 Device capabilities detected:', this.capabilities);
    }

    async setupAdvancedFeatures() {
        // Setup QR Scanner for attendance
        if (this.capabilities.camera) {
            await this.setupQRScanner();
        }

        // Setup geolocation for campus verification
        if (this.capabilities.geolocation) {
            await this.setupGeolocationTracking();
        }

        // Setup push notifications
        if (this.capabilities.notifications) {
            await this.setupPushNotifications();
        }

        // Setup device motion for interactive features
        if (this.capabilities.deviceMotion) {
            this.setupDeviceMotion();
        }

        // Setup native sharing
        if (this.capabilities.webShare) {
            this.setupWebShare();
        }
    }

    setupEventListeners() {
        // Install prompt for PWA
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });

        // App installed
        window.addEventListener('appinstalled', () => {
            //console.log('📱 PWA installed successfully');
            this.hideInstallButton();
            this.trackInstallation();
        });

        // Orientation change
        window.addEventListener('orientationchange', () => {
            this.handleOrientationChange();
        });

        // Visibility change (app focus/blur)
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
    }

    async setupQRScanner() {
        const qrScannerButton = document.createElement('button');
        qrScannerButton.className = 'btn btn-primary position-fixed';
        qrScannerButton.style.cssText = `
            bottom: 20px; right: 20px; z-index: 1050;
            border-radius: 50%; width: 60px; height: 60px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        qrScannerButton.innerHTML = '<i class="fas fa-qrcode"></i>';
        qrScannerButton.title = 'Escanear QR para asistencia';
        qrScannerButton.addEventListener('click', () => this.openQRScanner());
        
        // Only show in student area or specific pages
        if (window.location.pathname.includes('estudiantes')) {
            document.body.appendChild(qrScannerButton);
        }
    }

    async openQRScanner() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            // Create scanner modal
            const modal = this.createQRScannerModal(stream);
            document.body.appendChild(modal);
            
            // Start QR detection
            this.startQRDetection(modal.querySelector('video'));

        } catch (error) {
            console.error('❌ Camera access denied:', error);
            this.showAlert('No se pudo acceder a la cámara. Verifica los permisos.');
        }
    }

    createQRScannerModal(stream) {
        const modal = document.createElement('div');
        modal.className = 'modal fade show d-block';
        modal.style.backgroundColor = 'rgba(0,0,0,0.9)';
        modal.innerHTML = `
            <div class="modal-dialog modal-fullscreen">
                <div class="modal-content bg-dark text-white">
                    <div class="modal-header border-0">
                        <h5 class="modal-title">Escanear QR - Asistencia</h5>
                        <button type="button" class="btn-close btn-close-white" onclick="this.closest('.modal').remove()"></button>
                    </div>
                    <div class="modal-body p-0 position-relative">
                        <video autoplay playsinline style="width: 100%; height: auto;"></video>
                        <div class="position-absolute top-50 start-50 translate-middle">
                            <div style="width: 200px; height: 200px; border: 2px solid #00ff00; border-radius: 10px;"></div>
                        </div>
                        <div class="position-absolute bottom-0 w-100 text-center p-3 bg-dark bg-opacity-75">
                            <small>Coloca el código QR dentro del recuadro verde</small>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const video = modal.querySelector('video');
        video.srcObject = stream;
        
        return modal;
    }

    async startQRDetection(video) {
        // Simple QR detection simulation (in production use jsQR or similar library)
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const detectQR = () => {
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0);
                
                // Here would be QR detection logic
                // For now, simulate successful scan after 3 seconds
                setTimeout(() => {
                    this.handleQRScan('SAMPLE_QR_DATA_' + Date.now());
                }, 3000);
            } else {
                requestAnimationFrame(detectQR);
            }
        };
        
        detectQR();
    }

    async handleQRScan(qrData) {
        //console.log('📱 QR Scanned:', qrData);
        
        // Vibrate if supported
        if (this.capabilities.vibration) {
            navigator.vibrate([100, 50, 100]);
        }

        // Close scanner
        document.querySelector('.modal')?.remove();
        
        // Process attendance
        await this.attendanceSystem.registerAttendance(qrData);
        
        this.showAlert('✅ Asistencia registrada correctamente', 'success');
    }

    async setupGeolocationTracking() {
        // Campus coordinates (approximate)
        this.campusLocation = {
            lat: 19.0413, // Approximate coordinates for Puebla
            lng: -98.2062,
            radius: 500 // 500 meters radius
        };
    }

    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                position => resolve(position.coords),
                error => reject(error),
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000
                }
            );
        });
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000; // Earth's radius in meters
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c;
    }

    async verifyLocationOnCampus() {
        try {
            const coords = await this.getCurrentLocation();
            const distance = this.calculateDistance(
                coords.latitude, coords.longitude,
                this.campusLocation.lat, this.campusLocation.lng
            );

            return distance <= this.campusLocation.radius;
        } catch (error) {
            console.warn('⚠️ Location verification failed:', error);
            return null; // Allow if location can't be determined
        }
    }

    async setupPushNotifications() {
        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                //console.log('❌ Notification permission denied');
                return;
            }
        }

        // Register for push notifications
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            
            // Subscribe to push notifications
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(
                    'BEl62iUYgUivxIkv69yViEuiBIa40HI80NqIZOEgC5_gNjwcH3lPNZ4RVOqOE_EJ9d3l1hxFKU8RYcWNwFd8J1M' // Replace with your VAPID key
                )
            });

            //console.log('📱 Push subscription:', subscription);
            
            // Send subscription to server
            await this.sendSubscriptionToServer(subscription);
        }
    }

    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        
        return outputArray;
    }

    async sendSubscriptionToServer(subscription) {
        try {
            const response = await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    subscription: subscription,
                    userAgent: navigator.userAgent,
                    timestamp: Date.now()
                })
            });
            
            if (response.ok) {
                //console.log('✅ Push subscription saved to server');
            }
        } catch (error) {
            console.error('❌ Failed to save subscription:', error);
        }
    }

    setupDeviceMotion() {
        // Shake detection for emergency or quick actions
        let lastAcceleration = { x: 0, y: 0, z: 0 };
        let shakeThreshold = 15;
        
        window.addEventListener('devicemotion', (event) => {
            const acceleration = event.accelerationIncludingGravity;
            
            if (acceleration) {
                const deltaX = Math.abs(acceleration.x - lastAcceleration.x);
                const deltaY = Math.abs(acceleration.y - lastAcceleration.y);
                const deltaZ = Math.abs(acceleration.z - lastAcceleration.z);
                
                if (deltaX + deltaY + deltaZ > shakeThreshold) {
                    this.handleDeviceShake();
                }
                
                lastAcceleration = { ...acceleration };
            }
        });
    }

    handleDeviceShake() {
        //console.log('📱 Device shake detected');
        
        // Show quick action menu
        this.showQuickActionMenu();
        
        // Vibrate feedback
        if (this.capabilities.vibration) {
            navigator.vibrate([50, 100, 50]);
        }
    }

    showQuickActionMenu() {
        // Prevent multiple instances
        if (document.querySelector('.quick-action-menu')) return;
        
        const menu = document.createElement('div');
        menu.className = 'quick-action-menu position-fixed top-50 start-50 translate-middle';
        menu.style.cssText = `
            background: rgba(0,0,0,0.9); color: white; padding: 20px;
            border-radius: 15px; z-index: 2000; min-width: 250px;
            backdrop-filter: blur(10px); animation: fadeInScale 0.3s ease;
        `;
        
        menu.innerHTML = `
            <div class="text-center">
                <h6 class="mb-3">Acciones Rápidas</h6>
                <div class="d-grid gap-2">
                    <button class="btn btn-primary btn-sm" onclick="this.closest('.quick-action-menu').parentNode.dispatchEvent(new CustomEvent('quickChat'))">
                        <i class="fas fa-comments me-2"></i>Chat Rápido
                    </button>
                    <button class="btn btn-success btn-sm" onclick="this.closest('.quick-action-menu').parentNode.dispatchEvent(new CustomEvent('quickGrades'))">
                        <i class="fas fa-chart-line me-2"></i>Ver Calificaciones
                    </button>
                    <button class="btn btn-warning btn-sm" onclick="this.closest('.quick-action-menu').parentNode.dispatchEvent(new CustomEvent('quickSchedule'))">
                        <i class="fas fa-calendar me-2"></i>Horario Hoy
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="this.closest('.quick-action-menu').remove()">
                        <i class="fas fa-times me-2"></i>Cerrar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(menu);
        
        // Auto-remove after 5 seconds
        setTimeout(() => menu.remove(), 5000);
        
        // Handle quick actions
        menu.addEventListener('quickChat', () => {
            menu.remove();
            window.dispatchEvent(new CustomEvent('openChatbot'));
        });
        
        menu.addEventListener('quickGrades', () => {
            menu.remove();
            window.location.href = 'calificaciones.html';
        });
        
        menu.addEventListener('quickSchedule', () => {
            menu.remove();
            this.showTodaySchedule();
        });
    }

    setupWebShare() {
        // Add share buttons to achievement cards and news
        document.addEventListener('click', (e) => {
            if (e.target.matches('.share-btn') || e.target.closest('.share-btn')) {
                e.preventDefault();
                const shareData = this.getShareData(e.target);
                this.shareContent(shareData);
            }
        });
    }

    getShareData(element) {
        const card = element.closest('.card, .news-item, .achievement-card');
        
        return {
            title: card?.querySelector('h5, h6, .card-title')?.textContent || 'Bachillerato Héroes de la Patria',
            text: card?.querySelector('p, .card-text')?.textContent?.substring(0, 100) || 'Contenido educativo',
            url: window.location.href
        };
    }

    async shareContent(shareData) {
        try {
            if (navigator.share) {
                await navigator.share(shareData);
                //console.log('✅ Content shared successfully');
            } else {
                // Fallback to clipboard
                await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
                this.showAlert('📋 Contenido copiado al portapapeles');
            }
        } catch (error) {
            //console.log('Share cancelled or failed:', error);
        }
    }

    showInstallButton() {
        const installBtn = document.createElement('div');
        installBtn.className = 'install-pwa-banner position-fixed bottom-0 start-0 end-0 p-3';
        installBtn.style.cssText = `
            background: linear-gradient(135deg, #1976D2, #1565C0);
            color: white; z-index: 1040; animation: slideUp 0.5s ease;
        `;
        
        installBtn.innerHTML = `
            <div class="container">
                <div class="row align-items-center">
                    <div class="col-auto">
                        <img src="images/app_icons/icon-48x48.png" width="40" height="40" class="rounded">
                    </div>
                    <div class="col">
                        <div class="small fw-bold">Héroes de la Patria</div>
                        <div class="small opacity-75">Instalar aplicación</div>
                    </div>
                    <div class="col-auto">
                        <button class="btn btn-light btn-sm me-2" onclick="this.closest('.install-pwa-banner').style.display='none'">
                            Después
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="window.pwaFeatures.installPWA()">
                            Instalar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(installBtn);
    }

    hideInstallButton() {
        document.querySelector('.install-pwa-banner')?.remove();
    }

    async installPWA() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            const result = await this.deferredPrompt.userChoice;
            
            if (result.outcome === 'accepted') {
                //console.log('✅ PWA installed');
            }
            
            this.deferredPrompt = null;
            this.hideInstallButton();
        }
    }

    handleOrientationChange() {
        setTimeout(() => {
            // Recalculate layouts after orientation change
            window.dispatchEvent(new Event('resize'));
            
            // Show orientation hint for better UX
            const isLandscape = window.innerWidth > window.innerHeight;
            if (isLandscape && window.location.pathname.includes('estudiantes')) {
                this.showOrientationHint();
            }
        }, 100);
    }

    showOrientationHint() {
        const hint = document.createElement('div');
        hint.className = 'orientation-hint';
        hint.style.cssText = `
            position: fixed; top: 10px; right: 10px; z-index: 1050;
            background: rgba(0,0,0,0.8); color: white; padding: 8px 12px;
            border-radius: 20px; font-size: 12px; animation: fadeIn 0.3s;
        `;
        hint.textContent = '📱 Mejor experiencia en vertical';
        
        document.body.appendChild(hint);
        setTimeout(() => hint.remove(), 3000);
    }

    handleVisibilityChange() {
        if (document.hidden) {
            // App went to background
            //console.log('📱 App backgrounded');
            this.onAppBackground();
        } else {
            // App came to foreground
            //console.log('📱 App foregrounded');
            this.onAppForeground();
        }
    }

    onAppBackground() {
        // Reduce activity when app is backgrounded
        clearInterval(this.heartbeatInterval);
        
        // Save current state
        localStorage.setItem('app_last_active', Date.now());
    }

    onAppForeground() {
        // Resume activity when app comes back
        this.startHeartbeat();
        
        // Check for updates
        const lastActive = localStorage.getItem('app_last_active');
        if (lastActive && Date.now() - lastActive > 300000) { // 5 minutes
            this.checkForUpdates();
        }
    }

    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            // Send heartbeat to server for analytics
            this.sendHeartbeat();
        }, 60000); // Every minute
    }

    async sendHeartbeat() {
        try {
            await fetch('/api/analytics/heartbeat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timestamp: Date.now(),
                    page: window.location.pathname,
                    capabilities: this.capabilities
                })
            });
        } catch (error) {
            // Silent fail for heartbeat
        }
    }

    async checkForUpdates() {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            await registration.update();
        }
    }

    trackInstallation() {
        // Track PWA installation for analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'pwa_install', {
                event_category: 'PWA',
                event_label: 'Installation',
                value: 1
            });
        }
        
        // Send to custom analytics
        this.sendAnalytics('pwa_install', {
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            viewport: `${window.innerWidth}x${window.innerHeight}`
        });
    }

    async sendAnalytics(event, data) {
        try {
            await fetch('/api/analytics/event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event, data })
            });
        } catch (error) {
            console.warn('Analytics failed:', error);
        }
    }

    showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; left: 50%; transform: translateX(-50%); z-index: 1060; min-width: 300px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
        `;
        
        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 5000);
    }

    showTodaySchedule() {
        // Mock schedule for today
        const today = new Date().toLocaleDateString('es-MX', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        });
        
        const modal = document.createElement('div');
        modal.className = 'modal fade show d-block';
        modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">📅 Horario de Hoy</h5>
                        <button type="button" class="btn-close" onclick="this.closest('.modal').remove()"></button>
                    </div>
                    <div class="modal-body">
                        <p class="text-muted">${today}</p>
                        <div class="list-group">
                            <div class="list-group-item">
                                <div class="d-flex w-100 justify-content-between">
                                    <h6 class="mb-1">Matemáticas III</h6>
                                    <small>07:00 - 08:00</small>
                                </div>
                                <p class="mb-1">Aula 12 - Prof. García</p>
                            </div>
                            <div class="list-group-item">
                                <div class="d-flex w-100 justify-content-between">
                                    <h6 class="mb-1">Historia de México</h6>
                                    <small>08:00 - 09:00</small>
                                </div>
                                <p class="mb-1">Aula 8 - Prof. López</p>
                            </div>
                            <div class="list-group-item">
                                <div class="d-flex w-100 justify-content-between">
                                    <h6 class="mb-1">Química I</h6>
                                    <small>09:30 - 10:30</small>
                                </div>
                                <p class="mb-1">Laboratorio - Prof. Martínez</p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cerrar</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
}

// Attendance System
class AttendanceSystem {
    constructor() {
        this.apiEndpoint = '/api/attendance';
    }

    async registerAttendance(qrData) {
        try {
            const locationValid = await window.pwaFeatures.verifyLocationOnCampus();
            
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    qrData,
                    timestamp: Date.now(),
                    location: locationValid,
                    deviceInfo: {
                        userAgent: navigator.userAgent,
                        platform: navigator.platform
                    }
                })
            });

            if (response.ok) {
                const result = await response.json();
                return result;
            } else {
                throw new Error('Attendance registration failed');
            }
        } catch (error) {
            console.error('❌ Attendance error:', error);
            // Store for offline sync
            this.storeOfflineAttendance(qrData);
            throw error;
        }
    }

    storeOfflineAttendance(qrData) {
        const offline = JSON.parse(localStorage.getItem('offlineAttendance') || '[]');
        offline.push({
            qrData,
            timestamp: Date.now(),
            synced: false
        });
        localStorage.setItem('offlineAttendance', JSON.stringify(offline));
    }
}

// Camera Integration
class CameraIntegration {
    constructor() {
        this.stream = null;
    }

    async startCamera(constraints = {}) {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    ...constraints
                }
            });
            return this.stream;
        } catch (error) {
            console.error('❌ Camera error:', error);
            throw error;
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }
}

// Geolocation Service
class GeolocationService {
    constructor() {
        this.watchId = null;
    }

    async getCurrentPosition(options = {}) {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000,
                ...options
            });
        });
    }

    startWatching(callback, options = {}) {
        if (this.watchId) {
            this.stopWatching();
        }

        this.watchId = navigator.geolocation.watchPosition(
            callback,
            (error) => console.warn('Geolocation error:', error),
            {
                enableHighAccuracy: false,
                timeout: 30000,
                maximumAge: 300000,
                ...options
            }
        );
    }

    stopWatching() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
    }
}

// Native Notifications
class NativeNotifications {
    constructor() {
        this.permission = Notification.permission;
    }

    async requestPermission() {
        if (this.permission === 'default') {
            this.permission = await Notification.requestPermission();
        }
        return this.permission === 'granted';
    }

    show(title, options = {}) {
        if (this.permission === 'granted') {
            const notification = new Notification(title, {
                icon: '/images/app_icons/icon-192x192.png',
                badge: '/images/app_icons/icon-96x96.png',
                ...options
            });

            // Auto-close after 5 seconds
            setTimeout(() => notification.close(), 5000);
            
            return notification;
        }
        return null;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.pwaFeatures = new PWAAdvancedFeatures();
});

// Add necessary CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInScale {
        from { opacity: 0; transform: translateX(-50%) translateY(-50%) scale(0.8); }
        to { opacity: 1; transform: translateX(-50%) translateY(-50%) scale(1); }
    }
    
    @keyframes slideUp {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    .quick-action-menu {
        animation: fadeInScale 0.3s ease;
    }
    
    .install-pwa-banner {
        animation: slideUp 0.5s ease;
    }
    
    .orientation-hint {
        animation: fadeIn 0.3s ease;
    }
`;
document.head.appendChild(style);