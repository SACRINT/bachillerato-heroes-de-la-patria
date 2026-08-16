// BGE Offline Manager - Connection status checking
        class BGEOfflineManager {
            constructor() {
                this.isCheckingConnection = false;
                this.init();
            }

            init() {
                this.setupEventListeners();
                this.startAutoCheck();

                // Initial check after a short delay
                setTimeout(() => this.checkConnection(), 2000);
            }

            updateConnectionIcon(isOnline) {
                const icon = document.getElementById('connectionIcon');
                const status = document.getElementById('connectionStatus');

                if (isOnline) {
                    icon.textContent = '✅';
                    status.className = 'connection-status status-online';
                    status.innerHTML = '<strong>Estado:</strong> ¡Conexión restaurada! Redirigiendo...';

                    // BGE Analytics - Track connection restored
                    if (window.BGEAnalytics) {
                        window.BGEAnalytics.trackEvent('offline_page', 'connection_restored');
                    }

                    setTimeout(() => {
                        window.location.href = '/';
                    }, 2000);
                } else {
                    icon.textContent = 'ðŸ“¡';
                    status.className = 'connection-status status-offline';
                    status.innerHTML = '<strong>Estado:</strong> Sin conexión a Internet';

                    // BGE Analytics - Track offline state
                    if (window.BGEAnalytics) {
                        window.BGEAnalytics.trackEvent('offline_page', 'connection_failed');
                    }
                }
            }

            checkConnection() {
                if (this.isCheckingConnection) return;

                this.isCheckingConnection = true;
                const icon = document.getElementById('connectionIcon');
                const status = document.getElementById('connectionStatus');
                const button = document.querySelector('.btn-primary');

                // Update UI to show checking state
                icon.textContent = 'ðŸ”„';
                status.className = 'connection-status status-checking';
                status.innerHTML = '<strong>Estado:</strong> Verificando conexión...';
                button.disabled = true;
                button.innerHTML = '<span>â³</span> Verificando...';

                // BGE Performance - Optimized connection check
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                fetch('/', {
                    method: 'HEAD',
                    cache: 'no-cache',
                    mode: 'no-cors',
                    signal: controller.signal
                })
                    .then(() => {
                        clearTimeout(timeoutId);
                        this.updateConnectionIcon(true);
                    })
                    .catch(() => {
                        clearTimeout(timeoutId);
                        this.updateConnectionIcon(false);
                    })
                    .finally(() => {
                        this.isCheckingConnection = false;
                        button.disabled = false;
                        button.innerHTML = '<span>ðŸ”„</span> Verificar conexión';
                    });
            }

            startAutoCheck() {
                setInterval(() => {
                    if (!this.isCheckingConnection) {
                        const controller = new AbortController();
                        setTimeout(() => controller.abort(), 3000);

                        fetch('/', {
                            method: 'HEAD',
                            cache: 'no-cache',
                            mode: 'no-cors',
                            signal: controller.signal
                        })
                            .then(() => {
                                this.updateConnectionIcon(true);
                            })
                            .catch(() => {
                                // Still offline, do nothing
                            });
                    }
                }, 30000); // Check every 30 seconds
            }

            setupEventListeners() {
                // Button click handler for check connection
                const checkBtn = document.querySelector('[data-action="check-connection"]');
                if (checkBtn) {
                    checkBtn.addEventListener('click', () => this.checkConnection());
                }

                // Listen for online/offline events
                window.addEventListener('online', () => {
                    this.updateConnectionIcon(true);
                });

                window.addEventListener('offline', () => {
                    this.updateConnectionIcon(false);
                });

                // Service Worker communication
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.addEventListener('message', event => {
                        if (event.data && event.data.type === 'CACHE_UPDATED') {
                            const status = document.getElementById('connectionStatus');
                            status.className = 'connection-status status-online';
                            status.innerHTML = '<strong>Actualización:</strong> Contenido actualizado en segundo plano';
                        }
                    });
                }

                // PWA install prompt
                window.addEventListener('beforeinstallprompt', (e) => {
                    e.preventDefault();

                    const installButton = document.createElement('button');
                    installButton.className = 'btn btn-secondary';
                    installButton.innerHTML = '<span>ðŸ“±</span> Instalar App';
                    installButton.onclick = () => {
                        e.prompt();
                        // BGE Analytics - Track install prompt
                        if (window.BGEAnalytics) {
                            window.BGEAnalytics.trackEvent('pwa', 'install_prompt_clicked');
                        }
                    };

                    document.querySelector('.button-group').appendChild(installButton);
                });
            }
        }

        // Initialize BGE Offline Manager
        window.addEventListener('load', () => {
            window.bgeOfflineManager = new BGEOfflineManager();

            // Initialize BGE modules if available
            if (window.BGECore) {
                window.BGECore.initializeOfflineMode();
            }
        });

        // Global function for button onclick (backward compatibility)
        function checkConnection() {
            if (window.bgeOfflineManager) {
                window.bgeOfflineManager.checkConnection();
            }
        }
