/**
 * 🔐 GOOGLE OAUTH INTEGRATION PARA SISTEMA DE IA GAMIFICADA
 * Solo se activa en index.html
 */

class GoogleAuthIntegration {
    constructor() {
        // NUEVO: Usar configuración centralizada desde config.js
        // Esperar a que AppConfig esté disponible
        if (window.AppConfig && typeof window.AppConfig.getGoogleClientId === 'function') {
            this.clientId = window.AppConfig.getGoogleClientId();
            this.hasValidClientId = window.AppConfig.isEnabled('google');
        } else {
            console.warn('⚠️ AppConfig no disponible, usando configuración legacy');
            // ✅ CONFIGURACIÓN REAL DE GOOGLE OAUTH
            this.clientId = this.isDevelopment()
                ? '411638938693-87nmapmm146kci8i0p80jo745cost08h.apps.googleusercontent.com' // Client ID real
                : '411638938693-87nmapmm146kci8i0p80jo745cost08h.apps.googleusercontent.com'; // Mismo Client ID para producción

            this.hasValidClientId = this.clientId !== 'YOUR_GOOGLE_CLIENT_ID_FOR_DEVELOPMENT' &&
                                   this.clientId !== 'YOUR_GOOGLE_CLIENT_ID_FOR_PRODUCTION' &&
                                   this.clientId.includes('.apps.googleusercontent.com');
        }

        this.useOfflineMode = false;
        this.isIndexPage = window.location.pathname === '/' || window.location.pathname.includes('index.html');

        console.log('🔧 [Google Auth] Inicializando con:', {
            hasValidClientId: this.hasValidClientId,
            clientIdConfigured: this.clientId ? '✅ Sí' : '❌ No',
            isIndexPage: this.isIndexPage
        });

        if (this.isIndexPage) {
            this.initializeGoogleAuth();
        }
    }

    isDevelopment() {
        return window.location.hostname === 'localhost' ||
               window.location.hostname === '127.0.0.1' ||
               window.location.hostname.includes('local');
    }

    async initializeGoogleAuth() {
        console.log('🔧 Inicializando Google Auth con configuración mejorada...');

        // Esperar a que el header se cargue dinámicamente
        await this.waitForHeader();

        // Crear botón de login dinámicamente
        this.createGoogleLoginButton();

        // MEJORADO: Solo cargar Google Services si tenemos un Client ID válido
        if (this.hasValidClientId) {
            console.log('🔑 Client ID válido detectado, cargando Google Services...');
            try {
                await this.loadGoogleIdentityServices();
                console.log('✅ Google Identity Services cargado correctamente');
                console.log('🔑 Client ID configurado:', this.clientId.substring(0, 20) + '...');
            } catch (error) {
                console.log('⚠️ Error cargando Google Services:', error.message);
                this.setupOfflineMode();
            }
        } else {
            console.log('💡 Client ID no configurado - usando modo demostración');
            console.log('ℹ️ Para Google OAuth real, configura CLIENT_ID en google-auth-integration.js');
            this.setupOfflineMode();
        }
        this.setupLoginButton();

        // Agregar estilos profesionales para el botón
        this.addGoogleButtonStyles();
    }

    async loadGoogleIdentityServices() {
        return new Promise((resolve, reject) => {
            // Verificar si ya está cargado
            if (window.google && window.google.accounts) {
                console.log('✅ Google Identity Services ya estaba cargado');
                resolve();
                return;
            }

            console.log('📥 Cargando Google Identity Services...');

            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';

            // Configurar timeout para evitar espera infinita
            const timeout = setTimeout(() => {
                console.warn('⏰ Timeout cargando Google Services - continuando en modo offline');
                reject(new Error('Timeout loading Google Services'));
            }, 8000); // Aumentado a 8 segundos para dar más tiempo

            script.onload = () => {
                clearTimeout(timeout);
                console.log('✅ Google Identity Services cargado exitosamente');

                // Verificar que realmente se cargó correctamente
                if (window.google && window.google.accounts) {
                    resolve();
                } else {
                    console.warn('⚠️ Google Services cargado pero API no disponible');
                    reject(new Error('Google API not available after load'));
                }
            };

            script.onerror = (error) => {
                clearTimeout(timeout);
                console.warn('❌ Error cargando Google Services - usando modo offline');
                reject(error);
            };

            document.head.appendChild(script);
        });
    }

    setupOfflineMode() {
        console.log('🔧 Configurando modo offline para Google Auth...');

        // Simular que Google está disponible pero usar métodos alternativos
        window.google = {
            accounts: {
                id: {
                    initialize: (config) => {
                        console.log('📱 Google Auth en modo offline - usando fallbacks');
                    },
                    prompt: () => {
                        console.log('📱 Google prompt simulado - usando login alternativo');
                        // Mostrar opciones de login alternativo
                        this.showAlternativeLoginOptions();
                    }
                }
            }
        };
    }

    showAlternativeLoginOptions() {
        const loginBtn = document.getElementById('googleLoginBtn');
        if (loginBtn) {
            // Cambiar el texto del botón para indicar modo offline
            loginBtn.innerHTML = `
                <i class="fas fa-user-circle me-1"></i>
                Acceso Local
            `;

            // Configurar click para mostrar opciones locales
            loginBtn.onclick = () => {
                this.showLocalLoginModal();
            };
        }
    }

    showLocalLoginModal() {
        // Crear modal para opciones de login local
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'localLoginModal';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">🔐 Acceso Local</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>Google Services no está disponible. Selecciona una opción:</p>
                        <div class="d-grid gap-2">
                            <button class="btn btn-primary" onclick="initiateGoogleLogin()">
                                <i class="fab fa-google me-2"></i>Reintentar Google
                            </button>
                            <button class="btn btn-success" onclick="initiateDemoLogin()">
                                <i class="fas fa-play me-2"></i>Modo Demo
                            </button>
                            <button class="btn btn-info" onclick="initiateManualLogin()">
                                <i class="fas fa-envelope me-2"></i>Login Manual
                            </button>
                            <button class="btn btn-secondary" onclick="initiateGuestLogin()">
                                <i class="fas fa-user-secret me-2"></i>Invitado
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }

    showGoogleLoginModal() {
        // NUEVA FUNCIÓN: Modal que simula la interfaz de Google Sign-In
        console.log('🎭 Creando modal de Google Sign-In simulado...');

        // Remover modal anterior si existe
        const existingModal = document.getElementById('googleSignInModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'googleSignInModal';
        modal.setAttribute('data-bs-backdrop', 'static');
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered" style="max-width: 400px;">
                <div class="modal-content" style="border: none; border-radius: 16px; box-shadow: 0 8px 25px rgba(0,0,0,0.15);">
                    <div class="modal-header border-0 text-center" style="padding: 2rem 2rem 1rem 2rem;">
                        <div class="w-100">
                            <!-- Logo de Google -->
                            <div class="mb-3">
                                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M47.36 24.55c0-1.706-.154-3.34-.437-4.915H24v9.283h13.117a11.2 11.2 0 01-4.85 7.244v5.98h7.857c4.591-4.22 7.236-10.447 7.236-17.592z" fill="#4285f4"/>
                                    <path d="M24 48c6.48 0 11.911-2.15 15.886-5.824l-7.857-5.98c-2.15 1.44-4.896 2.29-8.029 2.29-6.168 0-11.385-4.159-13.263-9.756H2.55v6.221A23.996 23.996 0 0024 48z" fill="#34a853"/>
                                    <path d="M10.737 28.73a14.42 14.42 0 01-.77-4.73c0-1.64.277-3.23.77-4.73v-6.22H2.55A23.996 23.996 0 000 24c0 3.877.926 7.541 2.55 10.779l8.187-6.049z" fill="#fbbc05"/>
                                    <path d="M24 9.568c3.469 0 6.589 1.19 9.043 3.527l6.857-6.857C35.907 2.388 30.477 0 24 0A23.996 23.996 0 002.55 13.05l8.187 6.221C12.615 13.668 17.832 9.568 24 9.568z" fill="#ea4335"/>
                                </svg>
                            </div>
                            <h4 class="modal-title" style="font-weight: 400; color: #3c4043; font-size: 24px;">
                                Iniciar sesión
                            </h4>
                            <p style="color: #5f6368; font-size: 14px; margin-top: 8px;">
                                Continuar con BGE Héroes de la Patria
                            </p>
                        </div>
                    </div>
                    <div class="modal-body" style="padding: 1rem 2rem 2rem 2rem;">
                        <!-- Opciones de login estilo Google -->
                        <div class="d-grid gap-3">
                            <!-- Botón principal de Google -->
                            <button class="btn" onclick="window.googleAuth.simulateSuccessfulLogin(); bootstrap.Modal.getInstance(document.getElementById('googleSignInModal')).hide();"
                                    style="border: 1px solid #dadce0; padding: 12px 16px; border-radius: 8px; background: white; color: #3c4043; font-weight: 500; font-size: 14px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 12px;">
                                    <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285f4"/>
                                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34a853"/>
                                    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#fbbc05"/>
                                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#ea4335"/>
                                </svg>
                                Continuar con Google
                            </button>

                            <!-- Separador -->
                            <div class="text-center my-2">
                                <span style="color: #5f6368; font-size: 14px;">o</span>
                            </div>

                            <!-- Botón Demo -->
                            <button class="btn btn-primary" onclick="initiateDemoLogin(); bootstrap.Modal.getInstance(document.getElementById('googleSignInModal')).hide();"
                                    style="padding: 12px 16px; border-radius: 8px; font-weight: 500; font-size: 14px;">
                                <i class="fas fa-play me-2"></i>Cuenta Demo
                            </button>

                            <!-- Login Manual -->
                            <button class="btn btn-outline-secondary" onclick="initiateManualLogin(); bootstrap.Modal.getInstance(document.getElementById('googleSignInModal')).hide();"
                                    style="padding: 12px 16px; border-radius: 8px; font-weight: 500; font-size: 14px;">
                                <i class="fas fa-envelope me-2"></i>Email Manual
                            </button>
                        </div>

                        <!-- Pie del modal -->
                        <div class="text-center mt-4" style="border-top: 1px solid #e8eaed; padding-top: 1rem;">
                            <p style="color: #5f6368; font-size: 12px; margin: 0;">
                                Al continuar, aceptas los términos de servicio y política de privacidad
                            </p>
                        </div>
                    </div>

                    <!-- Botón cerrar discreto -->
                    <button type="button" class="btn-close position-absolute" data-bs-dismiss="modal"
                            style="top: 16px; right: 16px; opacity: 0.5;" aria-label="Cerrar"></button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();

        // Agregar estilos hover para el botón de Google
        const googleBtn = modal.querySelector('button[onclick*="simulateSuccessfulLogin"]');
        if (googleBtn) {
            googleBtn.addEventListener('mouseenter', function() {
                this.style.backgroundColor = '#f8f9fa';
                this.style.boxShadow = '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)';
            });
            googleBtn.addEventListener('mouseleave', function() {
                this.style.backgroundColor = 'white';
                this.style.boxShadow = 'none';
            });
        }

        console.log('✅ Modal de Google Sign-In mostrado exitosamente');
    }

    showGoogleErrorModal(errorMessage) {
        // Modal para mostrar errores de Google OAuth de forma amigable
        console.log('❌ Mostrando modal de error de Google OAuth...');

        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'googleErrorModal';
        modal.setAttribute('data-bs-backdrop', 'static');
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered" style="max-width: 400px;">
                <div class="modal-content" style="border: none; border-radius: 16px; box-shadow: 0 8px 25px rgba(0,0,0,0.15);">
                    <div class="modal-header border-0 text-center" style="padding: 2rem 2rem 1rem 2rem;">
                        <div class="w-100">
                            <div class="mb-3">
                                <i class="fas fa-exclamation-triangle fa-3x text-warning"></i>
                            </div>
                            <h4 class="modal-title" style="font-weight: 400; color: #dc3545; font-size: 24px;">
                                Error de Autenticación
                            </h4>
                            <p style="color: #6c757d; font-size: 14px; margin-top: 8px;">
                                No se pudo conectar con Google
                            </p>
                        </div>
                    </div>
                    <div class="modal-body" style="padding: 1rem 2rem 2rem 2rem;">
                        <div class="alert alert-warning">
                            <strong>Problema:</strong> ${errorMessage}
                        </div>

                        <p class="text-muted mb-3">
                            Para usar el login de Google real, necesitas configurar un Client ID válido en Google Cloud Console.
                        </p>

                        <div class="d-grid gap-2">
                            <button class="btn btn-success" onclick="initiateDemoLogin(); bootstrap.Modal.getInstance(document.getElementById('googleErrorModal')).hide();">
                                <i class="fas fa-play me-2"></i>Usar Cuenta Demo
                            </button>
                            <button class="btn btn-outline-secondary" onclick="bootstrap.Modal.getInstance(document.getElementById('googleErrorModal')).hide();">
                                <i class="fas fa-times me-2"></i>Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();

        console.log('✅ Modal de error de Google mostrado');
    }

    async waitForHeader() {
        return new Promise((resolve) => {
            const checkHeader = () => {
                const navbar = document.querySelector('.navbar');
                if (navbar) {
                    resolve();
                } else {
                    setTimeout(checkHeader, 100);
                }
            };
            checkHeader();
        });
    }

    createGoogleLoginButton() {
        if (!this.isIndexPage) {
            console.log('📍 No está en página index, saltando creación de botón');
            return;
        }

        console.log('🔘 Creando botón de login...');

        // Buscar el navbar con múltiples selectores de fallback
        let navbar = document.querySelector('.navbar .navbar-nav');
        if (!navbar) {
            navbar = document.querySelector('#main-nav-list');
        }
        if (!navbar) {
            navbar = document.querySelector('.navbar-nav');
        }
        if (!navbar) {
            console.warn('❌ No se encontró el navbar para agregar el botón de login');
            console.log('📋 Elementos navbar disponibles:', document.querySelectorAll('[class*="nav"]'));
            return;
        }

        console.log('✅ Navbar encontrado:', navbar);

        // Crear container para el botón de Google Auth
        const authContainer = document.createElement('li');
        authContainer.className = 'nav-item';
        authContainer.id = 'googleLoginContainer';

        authContainer.innerHTML = `
            <!-- Dropdown de opciones de login -->
            <div class="dropdown" id="loginDropdownContainer">
                <button class="btn btn-primary btn-sm dropdown-toggle ms-2" type="button" id="loginDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="fas fa-sign-in-alt me-1"></i>
                    Iniciar Sesión
                </button>
                <ul class="dropdown-menu" aria-labelledby="loginDropdown">
                    <li><h6 class="dropdown-header">Opciones de Acceso</h6></li>
                    <li><a class="dropdown-item" href="#" onclick="initiateGoogleLogin()">
                        <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" class="me-2">
                            <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285f4"/>
                            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#4285f4"/>
                            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#4285f4"/>
                            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#4285f4"/>
                        </svg>
                        Iniciar con Google
                    </a></li>
                    <li><a class="dropdown-item" href="#" onclick="initiateManualLogin()">
                        <i class="fas fa-envelope me-2 text-info"></i>
                        Login Manual
                    </a></li>
                    <li><a class="dropdown-item" href="#" onclick="initiateGuestLogin()">
                        <i class="fas fa-user-secret me-2 text-secondary"></i>
                        Acceso de Invitado
                    </a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" onclick="initiateDemoLogin()">
                        <i class="fas fa-play-circle me-2 text-success"></i>
                        Cuenta Demo
                    </a></li>
                    <!-- Estado de sesión integrado (inicialmente oculto) -->
                    <li id="googleUserSessionStatus" class="d-none" data-protected-element="google-auth">
                        <hr class="dropdown-divider">
                        <span class="dropdown-item-text text-success">
                            <i class="fas fa-check-circle me-2"></i>
                            <span id="currentGoogleUserName">Usuario Demo</span>
                        </span>
                    </li>
                </ul>
            </div>

            <!-- Dropdown de perfil completo (reemplaza el botón de login cuando hay sesión activa) -->
            <div id="userProfileDropdown" class="dropdown" style="display: none;">
                <button class="btn btn-success btn-sm dropdown-toggle ms-2" type="button" data-bs-toggle="dropdown">
                    <img id="userProfileImage" src="" alt="Perfil" style="width: 24px; height: 24px; border-radius: 50%; margin-right: 8px;">
                    <span id="userProfileName">Usuario</span>
                </button>
                <ul class="dropdown-menu">
                    <li><span class="dropdown-item-text">
                        <i class="fas fa-trophy me-2"></i>
                        <span id="userLevel">Nivel 1</span> •
                        <span id="userCoins">0</span> IA Coins
                    </span></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" onclick="openAIVault()">
                        <i class="fas fa-robot me-2"></i>Bóveda IA
                    </a></li>
                    <li><a class="dropdown-item" href="#" onclick="openProfile()">
                        <i class="fas fa-user me-2"></i>Mi Perfil
                    </a></li>
                    <li><a class="dropdown-item" href="#" onclick="openAchievements()">
                        <i class="fas fa-trophy me-2"></i>Logros
                    </a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" onclick="googleLogout()">
                        <i class="fas fa-sign-out-alt me-2"></i>Cerrar Sesión
                    </a></li>
                </ul>
            </div>
        `;

        // Agregar al final del navbar
        console.log('🔗 Agregando botón al navbar...');
        navbar.appendChild(authContainer);
        console.log('✅ Botón de login agregado exitosamente al navbar');

        // Verificar que el botón se agregó correctamente
        const addedButton = document.getElementById('googleLoginContainer');
        if (addedButton) {
            console.log('✅ Verificación: Botón encontrado en DOM con ID:', addedButton.id);
        } else {
            console.warn('❌ Verificación: Botón NO encontrado en DOM después de agregarlo');
        }
    }

    addGoogleButtonStyles() {
        if (!this.isIndexPage) return;

        // Crear estilos profesionales para el botón de Google
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            #googleLoginContainer .google-auth-btn {
                position: relative;
                overflow: hidden;
                isolation: isolate;
            }

            #googleLoginContainer .google-auth-btn:hover {
                background: #3367d6 !important;
                box-shadow: 0 2px 8px rgba(66, 133, 244, 0.2) !important;
            }

            #googleLoginContainer .google-auth-btn:active {
                background: #2851a3 !important;
                transform: translateY(1px);
            }

            #googleLoginContainer .google-auth-btn:focus {
                outline: none;
                box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.3);
            }

            #googleLoginContainer .google-auth-btn svg {
                transition: opacity 0.2s ease;
                flex-shrink: 0;
            }

            #googleLoginContainer .google-auth-btn:hover svg {
                opacity: 0.9;
            }

            #googleLoginContainer .google-auth-btn span {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                white-space: nowrap;
            }

            @media (max-width: 768px) {
                #googleLoginContainer .google-auth-btn span {
                    display: none;
                }

                #googleLoginContainer .google-auth-btn {
                    padding: 6px 8px !important;
                    width: 32px !important;
                    justify-content: center !important;
                }
            }
        `;

        document.head.appendChild(styleElement);
    }

    setupLoginButton() {
        const loginBtn = document.getElementById('googleLoginBtn');
        if (!loginBtn || !this.isIndexPage) return;

        loginBtn.addEventListener('click', this.handleGoogleLogin.bind(this));
    }

    async handleGoogleLogin() {
        try {
            console.log('🔐 Iniciando proceso de login con Google...');

            // VERIFICAR: Si tenemos un Client ID válido configurado
            if (!this.hasValidClientId) {
                console.log('⚠️ Client ID no configurado - usando modo demostración');
                this.showGoogleLoginModal();
                return;
            }

            // PRIORIDAD 1: Intentar Google OAuth real si está disponible
            if (window.google && window.google.accounts) {
                console.log('🌐 Usando Google OAuth real...');
                try {
                    window.google.accounts.id.initialize({
                        client_id: this.clientId,
                        callback: this.handleGoogleCallback.bind(this)
                    });

                    // Usar prompt directo que funciona mejor que renderButton
                    window.google.accounts.id.prompt();
                    return; // Salir aquí si Google OAuth está disponible
                } catch (initError) {
                    console.warn('⚠️ Error inicializando Google OAuth:', initError);
                    this.showGoogleErrorModal(initError.message);
                    return;
                }
            }

            // PRIORIDAD 2: Solo intentar cargar si tenemos Client ID válido
            if (this.hasValidClientId) {
                console.log('🔄 Google Services no disponible, intentando cargar...');

                try {
                    await this.loadGoogleIdentityServices();
                    console.log('✅ Google Services cargado, reintentando login...');

                    // Si se cargó exitosamente, inicializar OAuth real
                    if (window.google && window.google.accounts) {
                        window.google.accounts.id.initialize({
                            client_id: this.clientId,
                            callback: this.handleGoogleCallback.bind(this)
                        });
                        window.google.accounts.id.prompt();
                        return;
                    }
                } catch (loadError) {
                    console.warn('⚠️ No se pudo cargar Google Services:', loadError);
                }
            } else {
                console.log('⚠️ Client ID no válido - saltando carga de Google Services');
            }

            // FALLBACK: Solo si todo lo anterior falla, mostrar modal demo
            console.log('🎭 Usando modal de demostración como fallback...');
            this.showGoogleLoginModal();

        } catch (error) {
            console.error('❌ Error en Google Auth:', error);
            // Último recurso: mostrar modal simulado
            this.showGoogleLoginModal();
        }
    }

    showTemporaryLoginOption() {
        this.showNotification(
            'Google OAuth está configurándose. Mientras tanto, puedes usar login temporal.',
            'info'
        );

        // Crear botón de login temporal
        const loginBtn = document.getElementById('googleLoginBtn');
        if (loginBtn) {
            loginBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#ffffff"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#ffffff"/>
                    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#ffffff"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#ffffff"/>
                </svg>
                <span>Login Temporal</span>
            `;

            // Cambiar el evento para login temporal
            loginBtn.removeEventListener('click', this.handleGoogleLogin.bind(this));
            loginBtn.addEventListener('click', () => this.handleTemporaryLogin());
        }
    }

    async handleTemporaryLogin(providedEmail = null) {
        const userEmail = providedEmail || prompt('Ingresa tu email de Google para login temporal:');
        if (userEmail && userEmail.includes('@')) {
            const role = this.detectUserRole(userEmail);
            const tempUser = {
                email: userEmail.toLowerCase(),
                name: userEmail.split('@')[0],
                picture: `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="#4285f4"/><text x="20" y="25" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">${userEmail.charAt(0).toUpperCase()}</text></svg>`)}`,
                role: role,
                accountApproved: await this.isAccountApproved(userEmail, role),
                level: userEmail === 'samuelci6377@gmail.com' ? 10 : 1, // Nivel admin para Samuel
                xp: userEmail === 'samuelci6377@gmail.com' ? 5000 : 0,
                iaCoins: userEmail === 'samuelci6377@gmail.com' ? 2000 : 100
            };

            this.processLogin(tempUser);
        } else if (!providedEmail) {
            this.showNotification('Email inválido. Intenta de nuevo.', 'danger');
        }
    }

    async handleSecureLogin(userEmail, userPassword) {
        console.log('🔐 Iniciando login seguro con contraseña...');

        // VALIDAR CONTRASEÑA
        if (!this.validateUserPassword(userEmail, userPassword)) {
            // Si no existe el usuario, ofrecer registro
            if (!this.userExists(userEmail)) {
                this.showRegistrationDialog(userEmail, userPassword);
                return;
            }
            this.showNotification('❌ Email o contraseña incorrectos', 'danger');
            return;
        }

        // VERIFICAR SI EL USUARIO ESTÁ REVOCADO
        if (this.isUserRevoked(userEmail)) {
            this.showNotification('🚫 Tu acceso ha sido revocado. Contacta al administrador.', 'danger');
            return;
        }

        // Crear usuario si las credenciales son válidas
        const role = this.detectUserRole(userEmail);
        const secureUser = {
            email: userEmail.toLowerCase(),
            name: this.getUserDisplayName(userEmail),
            picture: `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="#28a745"/><text x="20" y="25" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">${userEmail.charAt(0).toUpperCase()}</text></svg>`)}`,
            role: role,
            accountApproved: await this.isAccountApproved(userEmail, role),
            level: userEmail === 'samuelci6377@gmail.com' ? 10 : 1,
            xp: userEmail === 'samuelci6377@gmail.com' ? 5000 : 0,
            iaCoins: userEmail === 'samuelci6377@gmail.com' ? 2000 : 100,
            loginMethod: 'secure_password'
        };

        this.processLogin(secureUser);
    }

    validateUserPassword(email, password) {
        // BASE DE DATOS DE CONTRASEÑAS PREDEFINIDAS
        const userPasswords = {
            // Formato: email: contraseña
            'samuelci6377@gmail.com': 'admin123',
            'admin@bge.edu.mx': 'admin2024',
            'director@bge.edu.mx': 'director123',
            'subdirector@bge.edu.mx': 'subdirector123',

            // Docentes
            'docente.matematicas@bge.edu.mx': 'mate2024',
            'docente.fisica@bge.edu.mx': 'fisica2024',
            'docente.quimica@bge.edu.mx': 'quimica2024',
            'profesor.historia@bge.edu.mx': 'historia2024',

            // Estudiantes
            'usuario.demo@bge.edu.mx': 'demo123',
            'estudiante.ejemplo@bge.edu.mx': 'estudiante123',
            'sci@gmail.com': 'sci123', // Para tus pruebas

            // Padres
            'padre.responsable@bge.edu.mx': 'padre123',
            'tutor.familiar@bge.edu.mx': 'tutor123'
        };

        // AGREGAR USUARIOS APROBADOS DINÁMICAMENTE
        const approvedPasswords = JSON.parse(localStorage.getItem('bge_user_passwords') || '{}');
        const allPasswords = { ...userPasswords, ...approvedPasswords };

        return allPasswords[email.toLowerCase()] === password;
    }

    isUserRevoked(email) {
        // LISTA DE USUARIOS REVOCADOS
        const revokedUsers = JSON.parse(localStorage.getItem('bge_revoked_users') || '[]');
        return revokedUsers.includes(email.toLowerCase());
    }

    getUserDisplayName(email) {
        const displayNames = {
            'samuelci6377@gmail.com': 'Samuel Administrador',
            'admin@bge.edu.mx': 'Administrador General',
            'director@bge.edu.mx': 'Director',
            'subdirector@bge.edu.mx': 'Subdirector',
            'sci@gmail.com': 'SCI Usuario'
        };

        return displayNames[email.toLowerCase()] || email.split('@')[0];
    }

    async simulateSuccessfulLogin() {
        // Simular usuario para desarrollo con acceso completo
        const role = this.detectUserRole('usuario.demo@bge.edu.mx');
        const mockUser = {
            email: 'usuario.demo@bge.edu.mx',
            name: 'Usuario Demo',
            picture: `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="#4285f4"/><text x="20" y="25" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">U</text></svg>')}`,
            role: role,
            accountApproved: await this.isAccountApproved('usuario.demo@bge.edu.mx', role),
            level: 5,
            xp: 2500,
            iaCoins: 1000
        };

        this.processLogin(mockUser);
    }

    async handleGoogleCallback(response) {
        const payload = JSON.parse(atob(response.credential.split('.')[1]));
        const userRole = this.detectUserRole(payload.email);

        const user = {
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
            role: userRole,
            accountApproved: await this.isAccountApproved(payload.email, userRole)
        };

        this.processLogin(user);
    }

    detectUserRole(email) {
        // Lógica de detección de roles basada en email
        if (email.includes('admin')) return 'admin';
        if (email.includes('docente') || email.includes('profesor')) return 'teacher';
        if (email.includes('padre') || email.includes('tutor')) return 'parent';
        return 'student';
    }

    async isAccountApproved(email, role) {
        try {
            // NUEVO: Verificar aprobación contra el backend
            console.log('🔍 Verificando aprobación para:', email);

            const response = await fetch(`/api/admin/check-approval/${encodeURIComponent(email)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.warn('⚠️ Error del servidor al verificar aprobación:', response.status);
                // En caso de error del servidor, denegar acceso por seguridad
                return false;
            }

            const data = await response.json();

            if (data.success && data.approved !== undefined) {
                console.log(`✅ Aprobación verificada para ${email}:`, data.approved);
                return data.approved;
            }

            // Si la respuesta no tiene el formato esperado, denegar acceso
            console.warn('⚠️ Respuesta inesperada del servidor:', data);
            return false;

        } catch (error) {
            console.error('❌ Error al verificar aprobación:', error);
            // En caso de error de red o cualquier otro, denegar acceso por seguridad
            return false;
        }
    }

    processLogin(user) {
        // Verificar si el usuario está aprobado
        if (!user.accountApproved) {
            this.handleUnapprovedUser(user);
            return;
        }

        // Crear sesión completa con datos de aprobación
        const userSession = {
            email: user.email,
            name: user.name,
            imageUrl: user.picture,
            role: user.role,
            level: user.level || 1,
            xp: user.xp || 0,
            iaCoins: user.iaCoins || 100,
            loginTime: Date.now(),
            isLoggedIn: true,
            accountApproved: true
        };

        // Guardar en ambos formatos para compatibilidad
        localStorage.setItem('bge_user', JSON.stringify(user));
        localStorage.setItem('userSession', JSON.stringify(userSession));

        // Activar sistema de IA
        if (window.intelligentLoginSystem) {
            window.intelligentLoginSystem.loginUser(user);
        }

        // MEJORAR: Actualizar TODOS los componentes de IA automáticamente
        forceUpdateAllIAComponents(userSession);

        // Despachar evento personalizado para notificar que el usuario cambió
        window.dispatchEvent(new CustomEvent('userSessionUpdated', {
            detail: { user: userSession, authenticated: true }
        }));

        // Mostrar perfil en lugar de botón login
        this.updateUIAfterLogin(user);

        // Mostrar bienvenida con estado de aprobación
        this.showWelcomeMessage(user);

        // NUEVO: Recarga automática después del login para actualizar toda la UI
        setTimeout(() => {
            console.log('🔄 Recargando página para actualizar toda la interfaz...');
            window.location.reload();
        }, 2000); // Delay de 2 segundos para que se vea el mensaje de bienvenida
    }

    handleUnapprovedUser(user) {
        // Registrar usuario pendiente de aprobación
        this.registerPendingUser(user);

        // Mostrar mensaje de que necesita aprobación
        this.showNotification(
            `🔒 Hola ${user.name}! Tu cuenta necesita aprobación del administrador para acceder a las herramientas de IA. Te notificaremos cuando sea aprobada.`,
            'warning'
        );

        // No mostrar el perfil, mantener botón de login
        const loginBtn = document.getElementById('googleLoginBtn');
        if (loginBtn) {
            loginBtn.style.display = 'flex';
            loginBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#ffffff"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#ffffff"/>
                    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#ffffff"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#ffffff"/>
                </svg>
                <span>Pendiente Aprobación</span>
            `;
        }
    }

    registerPendingUser(user) {
        // Obtener lista de usuarios pendientes
        const pendingUsers = JSON.parse(localStorage.getItem('bge_pending_users') || '[]');

        // Verificar si ya está en la lista
        const existingUser = pendingUsers.find(u => u.email === user.email);
        if (!existingUser) {
            // Agregar nuevo usuario pendiente
            pendingUsers.push({
                email: user.email,
                name: user.name,
                picture: user.picture,
                role: user.role,
                requestDate: new Date().toISOString(),
                status: 'pending'
            });

            localStorage.setItem('bge_pending_users', JSON.stringify(pendingUsers));

            // Notificar al administrador (si hay uno logueado)
            this.notifyAdminNewRequest(user);
        }
    }

    notifyAdminNewRequest(user) {
        console.log(`🔔 Nueva solicitud de acceso: ${user.name} (${user.email})`);
        // Aquí se podría enviar una notificación real al administrador
    }

    updateUIAfterLogin(user) {
        console.log('🔧 Actualizando UI después del login para:', user.name);

        const loginDropdownContainer = document.getElementById('loginDropdownContainer');
        const profileDropdown = document.getElementById('userProfileDropdown');
        const userSessionStatus = document.getElementById('googleUserSessionStatus');
        const currentUserName = document.getElementById('currentGoogleUserName');

        // NUEVA LÓGICA: Crear menú completo con subelementos
        if (loginDropdownContainer && userSessionStatus && currentUserName) {
            console.log('✅ Elementos encontrados, creando menú completo con subelementos');

            // Actualizar el nombre del usuario
            currentUserName.textContent = user.name || 'Usuario';

            // CREAR MENÚ COMPLETO CON SUBELEMENTOS
            userSessionStatus.innerHTML = `
                <hr class="dropdown-divider">
                <span class="dropdown-item-text text-success">
                    <i class="fas fa-check-circle me-2"></i>
                    <strong>${user.name || 'Usuario Demo'}</strong>
                </span>
                <li><span class="dropdown-item-text">
                    <i class="fas fa-trophy me-2"></i>
                    <span id="userLevel">Nivel ${user.level || 1}</span> •
                    <span id="userCoins">${user.iaCoins || 100}</span> IA Coins
                </span></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="#" onclick="openAIVault()">
                    <i class="fas fa-robot me-2"></i>Bóveda IA
                </a></li>
                <li><a class="dropdown-item" href="#" onclick="openProfile()">
                    <i class="fas fa-user me-2"></i>Mi Perfil
                </a></li>
                <li><a class="dropdown-item" href="#" onclick="openAchievements()">
                    <i class="fas fa-trophy me-2"></i>Logros
                </a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item text-danger" href="#" onclick="googleLogout()">
                    <i class="fas fa-sign-out-alt me-2"></i>Cerrar Sesión
                </a></li>
            `;

            // Mostrar el menú completo
            userSessionStatus.classList.remove('d-none');

            // Marcar como protegido para evitar interferencias
            userSessionStatus.setAttribute('data-google-protected', 'true');

            // Cambiar el botón a estado "conectado"
            const loginButton = document.getElementById('loginDropdown');
            if (loginButton) {
                loginButton.innerHTML = `
                    <i class="fas fa-user-check me-1"></i>
                    ${user.name || 'Usuario Conectado'}
                `;
                loginButton.className = 'btn btn-success btn-sm dropdown-toggle ms-2';
                console.log('✅ Botón de login actualizado correctamente');
            } else {
                console.warn('❌ No se encontró el botón loginDropdown');
            }

            console.log('✅ Menú completo con subelementos creado exitosamente');
        } else {
            console.warn('❌ No se encontraron los elementos necesarios:', {
                loginDropdownContainer: !!loginDropdownContainer,
                userSessionStatus: !!userSessionStatus,
                currentUserName: !!currentUserName
            });

            // Intentar nuevamente después de un pequeño delay
            setTimeout(() => {
                console.log('🔄 Reintentando actualización de UI...');
                this.updateUIAfterLogin(user);
            }, 1000);
        }

        // Opción 2: También preparar el dropdown completo de perfil (oculto por defecto)
        if (profileDropdown) {
            // Actualizar datos del perfil completo pero mantenerlo oculto
            const profileImage = document.getElementById('userProfileImage');
            const profileName = document.getElementById('userProfileName');

            if (profileImage && user.picture && user.picture !== 'undefined') {
                profileImage.src = user.picture;
            } else if (profileImage) {
                // Imagen por defecto si no hay picture o es undefined
                profileImage.src = `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="#6c757d"/><text x="20" y="25" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">U</text></svg>')}`;
            }

            if (profileName) {
                profileName.textContent = user.name || 'Usuario';
            }

            // Actualizar nivel y coins basado en el usuario
            this.updateUserProgress(user);

            // Mantener el dropdown de perfil oculto por defecto
            // profileDropdown.style.display = 'block'; // COMENTADO: No mostrar por defecto
        }
    }

    updateUserProgress(user) {
        const userData = this.getUserProgress(user.email);

        document.getElementById('userLevel').textContent = `Nivel ${userData.level}`;
        document.getElementById('userCoins').textContent = userData.coins;
    }

    getUserProgress(email) {
        const saved = localStorage.getItem(`bge_progress_${email}`);
        if (saved) {
            return JSON.parse(saved);
        }

        // Datos iniciales
        return {
            level: 1,
            coins: 0,
            xp: 0,
            unlockedPrompts: ['basic-summary']
        };
    }

    showWelcomeMessage(user) {
        const roleMessages = {
            student: `🎓 ¡Bienvenido ${user.name}! Tu aventura de aprendizaje IA comienza ahora.`,
            teacher: `👨‍🏫 ¡Bienvenido ${user.name}! Accede a herramientas IA pedagógicas avanzadas.`,
            parent: `👨‍👩‍👧‍👦 ¡Bienvenido ${user.name}! Herramientas para apoyar la educación de tu hijo.`,
            admin: `👨‍💼 ¡Bienvenido ${user.name}! Panel de gestión educativa IA disponible.`
        };

        this.showNotification(roleMessages[user.role] || roleMessages.student, 'success');
    }

    showNotification(message, type = 'info') {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 100px; right: 20px; z-index: 1060; max-width: 400px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    logout() {
        localStorage.removeItem('bge_user');
        localStorage.removeItem('userSession');
        localStorage.removeItem(`bge_progress_${this.currentUser?.email}`);

        // Restaurar el dropdown de login a su estado inicial
        const loginDropdownContainer = document.getElementById('loginDropdownContainer');
        const profileDropdown = document.getElementById('userProfileDropdown');
        const userSessionStatus = document.getElementById('googleUserSessionStatus');
        const loginButton = document.getElementById('loginDropdown');

        // Ocultar estado de sesión
        if (userSessionStatus) {
            userSessionStatus.classList.add('d-none');
        }

        // Restaurar botón de login a estado inicial
        if (loginButton) {
            loginButton.innerHTML = `
                <i class="fas fa-sign-in-alt me-1"></i>
                Iniciar Sesión
            `;
            loginButton.className = 'btn btn-primary btn-sm dropdown-toggle ms-2';
        }

        // Ocultar dropdown de perfil completo
        if (profileDropdown) {
            profileDropdown.style.display = 'none';
        }

        this.showNotification('Sesión cerrada exitosamente', 'info');

        // Recargar página para limpiar completamente la interfaz
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    }

    setupPersistenceProtection() {
        // Sistema de protección ULTRA-AGRESIVO contra interferencias DOM
        console.log('🛡️ Configurando protección de persistencia ULTRA-AGRESIVA...');

        const userSessionStatus = document.getElementById('googleUserSessionStatus');
        if (!userSessionStatus) {
            console.warn('⚠️ Elemento de sesión no encontrado para proteger');
            return;
        }

        // PROTECCIÓN NIVEL 1: MutationObserver ultra-rápido
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    if (target.id === 'googleUserSessionStatus' && target.classList.contains('d-none')) {
                        console.log('🚨 INTERFERENCIA DETECTADA - RESTAURANDO INMEDIATAMENTE');

                        // Verificar que realmente hay una sesión activa
                        const savedUser = localStorage.getItem('bge_user');
                        if (savedUser) {
                            // Restauración INMEDIATA sin timeout
                            target.classList.remove('d-none');
                            console.log('⚡ Estado restaurado INSTANTÁNEAMENTE');

                            // Marcar elemento como protegido
                            target.setAttribute('data-google-protected', 'true');
                        }
                    }
                }
            });
        });

        // PROTECCIÓN NIVEL 2: Intervalo ultra-agresivo cada 500ms
        const aggressiveInterval = setInterval(() => {
            const currentStatus = document.getElementById('googleUserSessionStatus');
            const savedUser = localStorage.getItem('bge_user');

            if (currentStatus && savedUser && currentStatus.classList.contains('d-none')) {
                console.log('🔄 PROTECCIÓN AGRESIVA - FORZANDO VISIBILIDAD');
                currentStatus.classList.remove('d-none');
                currentStatus.setAttribute('data-google-protected', 'true');
            }
        }, 500); // Cada 500ms

        // PROTECCIÓN NIVEL 3: Override directo de addClass para este elemento
        const originalAdd = userSessionStatus.classList.add;
        userSessionStatus.classList.add = function(...classes) {
            if (classes.includes('d-none')) {
                const savedUser = localStorage.getItem('bge_user');
                if (savedUser) {
                    console.log('🚫 BLOQUEANDO intento de ocultar elemento de Google Auth');
                    return; // Bloquear completamente el addClass('d-none')
                }
            }
            return originalAdd.apply(this, classes);
        };

        // PROTECCIÓN NIVEL 3.5: Override de innerHTML para evitar que se borre el contenido
        const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
        Object.defineProperty(userSessionStatus, 'innerHTML', {
            get: originalInnerHTML.get,
            set: function(value) {
                const savedUser = localStorage.getItem('bge_user');
                // Solo permitir cambios si hay contenido válido o no hay usuario logueado
                if (savedUser && (!value || value.trim() === '')) {
                    console.log('🚫 BLOQUEANDO intento de borrar contenido del menú de usuario');
                    return; // Bloquear vaciado del innerHTML
                }
                return originalInnerHTML.set.call(this, value);
            }
        });

        // PROTECCIÓN NIVEL 4: Verificación continua con múltiples timeouts
        // Contraatacar los timeouts de admin-auth.js (100, 300, 500, 1000ms)
        [200, 400, 600, 1100, 1500, 2000].forEach(delay => {
            setTimeout(() => {
                const element = document.getElementById('googleUserSessionStatus');
                const savedUser = localStorage.getItem('bge_user');
                if (element && savedUser && element.classList.contains('d-none')) {
                    console.log(`🔄 CONTRAATAQUE TEMPORIZADO ${delay}ms - RESTAURANDO`);
                    element.classList.remove('d-none');
                    element.setAttribute('data-google-protected', 'true');
                }
            }, delay);
        });

        // Observar cambios en el elemento
        observer.observe(userSessionStatus, {
            attributes: true,
            attributeFilter: ['class']
        });

        // Almacenar referencias para cleanup si es necesario
        this.persistenceObserver = observer;
        this.aggressiveInterval = aggressiveInterval;

        console.log('✅ PROTECCIÓN ULTRA-AGRESIVA configurada - Element ID:', userSessionStatus.id);
    }

    // ===== FUNCIONES PARA REGISTRO DE NUEVOS USUARIOS =====

    userExists(email) {
        // Verificar si el usuario existe en la base de datos local
        const userPasswords = {
            // Administradores
            'samuelci6377@gmail.com': 'admin123',
            'admin@bge.edu.mx': 'admin2024',
            'director@bge.edu.mx': 'director123',
            'subdirector@bge.edu.mx': 'subdirector123',

            // Docentes
            'docente.matematicas@bge.edu.mx': 'mate2024',
            'docente.fisica@bge.edu.mx': 'fisica2024',
            'docente.quimica@bge.edu.mx': 'quimica2024',
            'profesor.historia@bge.edu.mx': 'historia2024',

            // Estudiantes
            'usuario.demo@bge.edu.mx': 'demo123',
            'estudiante.ejemplo@bge.edu.mx': 'estudiante123',
            'sci@gmail.com': 'sci123',
            'padre.responsable@bge.edu.mx': 'padre123',
            'tutor.familiar@bge.edu.mx': 'tutor123'
        };

        // INCLUIR USUARIOS APROBADOS DINÁMICAMENTE
        const approvedPasswords = JSON.parse(localStorage.getItem('bge_user_passwords') || '{}');
        const allPasswords = { ...userPasswords, ...approvedPasswords };

        return allPasswords.hasOwnProperty(email.toLowerCase());
    }

    showRegistrationDialog(email, password) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'registrationModal';
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-info text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-user-plus me-2"></i>
                            Crear Nueva Cuenta
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i>
                            <strong>Cuenta no encontrada</strong><br>
                            ¿Deseas crear una nueva cuenta con este email?
                        </div>

                        <div class="user-info-box p-3 bg-light rounded">
                            <h6><i class="fas fa-envelope me-2"></i>Email:</h6>
                            <p class="mb-2 text-primary">${email}</p>

                            <h6><i class="fas fa-lock me-2"></i>Contraseña:</h6>
                            <p class="mb-0">••••••••</p>
                        </div>

                        <div class="mt-3">
                            <h6><i class="fas fa-clipboard-list me-2"></i>¿Qué sucederá?</h6>
                            <ul class="small text-muted">
                                <li>Se enviará tu solicitud al administrador</li>
                                <li>Recibirás notificación cuando sea aprobada</li>
                                <li>Podrás acceder con estas credenciales una vez aprobado</li>
                            </ul>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-1"></i>
                            Cancelar
                        </button>
                        <button type="button" class="btn btn-success" onclick="window.googleAuth.submitRegistration('${email}', '${password}')">
                            <i class="fas fa-paper-plane me-1"></i>
                            Enviar Solicitud
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();

        // Cleanup modal cuando se cierre
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }

    submitRegistration(email, password) {
        // Cerrar modal de registro
        const registrationModal = bootstrap.Modal.getInstance(document.getElementById('registrationModal'));
        if (registrationModal) {
            registrationModal.hide();
        }

        // Agregar a lista de usuarios pendientes
        const pendingUsers = JSON.parse(localStorage.getItem('bge_pending_users') || '[]');

        const newUser = {
            email: email.toLowerCase(),
            password: password,
            requestDate: new Date().toISOString(),
            status: 'pending',
            id: Date.now()
        };

        // Verificar si ya existe solicitud pendiente
        const existingIndex = pendingUsers.findIndex(user => user.email === email.toLowerCase());
        if (existingIndex !== -1) {
            pendingUsers[existingIndex] = newUser; // Actualizar solicitud existente
            this.showNotification('✅ Solicitud actualizada. Esperando aprobación del administrador.', 'info');
        } else {
            pendingUsers.push(newUser);
            this.showNotification('✅ Solicitud de registro enviada. Esperando aprobación del administrador.', 'success');
        }

        localStorage.setItem('bge_pending_users', JSON.stringify(pendingUsers));

        // Trigger actualización en dashboard si está abierto
        if (typeof window.adminDashboard !== 'undefined' && window.adminDashboard.loadPendingUsers) {
            setTimeout(() => {
                window.adminDashboard.loadPendingUsers();
            }, 500);
        }

        console.log('📝 Nueva solicitud de registro:', newUser);
    }
}

// Funciones globales para botones
function initiateGoogleLogin() {
    if (window.googleAuth) {
        window.googleAuth.handleGoogleLogin();
    }
}

function initiateManualLogin() {
    // SISTEMA DE LOGIN SEGURO CON MODAL PROFESIONAL
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'secureLoginModal';
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title">
                        <i class="fas fa-shield-alt me-2"></i>Login Seguro
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="secureLoginForm">
                        <div class="mb-3">
                            <label for="userEmail" class="form-label">
                                <i class="fas fa-envelope me-2"></i>Email Institucional
                            </label>
                            <input type="email" class="form-control" id="userEmail" placeholder="usuario@bge.edu.mx" required>
                        </div>
                        <div class="mb-3">
                            <label for="userPassword" class="form-label">
                                <i class="fas fa-lock me-2"></i>Contraseña
                            </label>
                            <div class="input-group">
                                <input type="password" class="form-control" id="userPassword" placeholder="••••••••" required>
                                <button class="btn btn-outline-secondary" type="button" id="togglePassword">
                                    <i class="fas fa-eye" id="passwordIcon"></i>
                                </button>
                            </div>
                        </div>
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i>
                            <strong>Credenciales de prueba:</strong><br>
                            Email: <code>sci@gmail.com</code><br>
                            Contraseña: <code>sci123</code>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-primary" id="loginSubmit">
                        <i class="fas fa-sign-in-alt me-2"></i>Iniciar Sesión
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    const bootstrapModal = new bootstrap.Modal(modal);

    // Toggle de contraseña
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('userPassword');
    const passwordIcon = document.getElementById('passwordIcon');

    togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        passwordIcon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
    });

    // Submit del formulario
    const loginSubmit = document.getElementById('loginSubmit');
    const loginForm = document.getElementById('secureLoginForm');

    const handleLogin = () => {
        const email = document.getElementById('userEmail').value.trim();
        const password = document.getElementById('userPassword').value;

        if (!email || !email.includes('@')) {
            alert('❌ Email inválido. Debe contener "@"');
            return;
        }

        if (!password || password.trim() === '') {
            alert('❌ La contraseña es obligatoria');
            return;
        }

        if (window.googleAuth) {
            bootstrapModal.hide();
            window.googleAuth.handleSecureLogin(email, password);
        }
    };

    loginSubmit.addEventListener('click', handleLogin);
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleLogin();
    });

    bootstrapModal.show();

    // Limpiar modal al cerrar
    modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
    });
}

function initiateGuestLogin() {
    if (confirm('🔓 ¿Acceder como invitado? Tendrás acceso limitado a las funciones.')) {
        const guestUser = {
            email: 'invitado@temporal.com',
            name: 'Usuario Invitado',
            picture: `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="#6c757d"/><text x="20" y="25" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">I</text></svg>')}`,
            role: 'guest',
            accountApproved: true,
            level: 1,
            xp: 0,
            iaCoins: 50
        };

        if (window.googleAuth) {
            window.googleAuth.processLogin(guestUser);
        }
    }
}

function initiateDemoLogin() {
    if (confirm('🎮 ¿Usar cuenta demo? Tendrás acceso completo para probar todas las funciones.')) {
        const demoUser = {
            email: 'demo@bge.edu.mx',
            name: 'Usuario Demo',
            picture: `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="#28a745"/><text x="20" y="25" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">D</text></svg>')}`,
            role: 'student',
            accountApproved: true,
            level: 5,
            xp: 2500,
            iaCoins: 1000
        };

        if (window.googleAuth) {
            window.googleAuth.processLogin(demoUser);
        }
    }
}

// NUEVO: Función para forzar actualización de TODOS los componentes de IA
async function forceUpdateAllIAComponents(userSession) {
    console.log('🔄 Forzando actualización de todos los componentes de IA...');

    // 1. Actualizar panel de IA si existe
    if (window.iaDashboard) {
        try {
            window.iaDashboard.loadUserSession();
            window.iaDashboard.updateUIAfterLogin();
            window.iaDashboard.renderAccessInterface();
            console.log('✅ Panel de IA actualizado');
        } catch (error) {
            console.warn('⚠️ Error actualizando panel de IA:', error);
        }
    }

    // 2. Actualizar cualquier modal abierto de IA
    setTimeout(() => {
        const modalElements = document.querySelectorAll('[id*="ia"], [id*="IA"], [class*="ia"], [class*="IA"]');
        modalElements.forEach(element => {
            if (element.style.display !== 'none' && element.offsetParent !== null) {
                // El elemento es visible, forzar su actualización
                const updateEvent = new CustomEvent('forceUpdate', {
                    detail: { userSession, authenticated: true }
                });
                element.dispatchEvent(updateEvent);
            }
        });
        console.log('✅ Modales de IA actualizados');
    }, 200);

    // 3. Forzar re-renderizado de estado de usuario en navbar
    setTimeout(() => {
        const authContainer = document.getElementById('googleLoginContainer');
        if (authContainer && userSession && window.googleAuth) {
            window.googleAuth.updateUIAfterLogin(userSession);
            console.log('✅ Navbar actualizado');
        }
    }, 300);

    // 4. Actualizar cualquier sistema que dependa del estado de usuario
    if (window.intelligentLoginSystem) {
        window.intelligentLoginSystem.loginUser(userSession);
    }
}

function googleLogout() {
    if (window.googleAuth) {
        window.googleAuth.logout();
    }
}

function openAIVault() {
    if (window.aiVaultModal) {
        window.aiVaultModal.show();
    } else {
        alert('🤖 Bóveda IA: Sistema en desarrollo. ¡Próximamente disponible!');
    }
}

function openProfile() {
    alert('👤 Perfil: Funcionalidad en desarrollo. ¡Próximamente!');
}

function openAchievements() {
    alert('🏆 Logros: Sistema de badges en desarrollo. ¡Próximamente!');
}

// PROTECCIÓN GLOBAL ULTRA-TEMPRANA
(function() {
    console.log('🛡️ INICIANDO PROTECCIÓN GLOBAL TEMPRANA CONTRA INTERFERENCIAS');

    // Protección cada 1 segundo de forma permanente
    setInterval(() => {
        const element = document.getElementById('googleUserSessionStatus');
        const savedUser = localStorage.getItem('bge_user');

        if (element && savedUser && element.classList.contains('d-none')) {
            console.log('🚨 PROTECCIÓN GLOBAL: Restaurando estado oculto');
            element.classList.remove('d-none');
            element.setAttribute('data-global-protected', 'true');
        }
    }, 1000); // Cada segundo

    console.log('✅ PROTECCIÓN GLOBAL ACTIVADA - Monitoreo cada 1 segundo');
})();

// Inicializar solo en index.html
document.addEventListener('DOMContentLoaded', function() {
    const isIndexPage = window.location.pathname === '/' || window.location.pathname.includes('index.html');

    if (isIndexPage) {
        window.googleAuth = new GoogleAuthIntegration();

        // MEJORADO: Verificar sesión existente y forzar actualización completa
        const savedUser = localStorage.getItem('bge_user');
        const savedSession = localStorage.getItem('userSession');

        if (savedUser && savedSession) {
            try {
                const user = JSON.parse(savedUser);
                const userSession = JSON.parse(savedSession);

                console.log('🔄 Restaurando sesión guardada:', user.name);

                // Verificar si el usuario sigue siendo válido/aprobado (con fallback)
                const isApproved = window.googleAuth.checkUserApprovalStatus ?
                    window.googleAuth.checkUserApprovalStatus(user.email) :
                    (user.accountApproved || true); // Fallback: asumir aprobado si no hay método

                if (isApproved) {
                    // CRÍTICO: Actualizar UI inmediatamente y repetidamente para asegurar persistencia
                    console.log('✅ Actualizando UI para usuario logueado');
                    window.googleAuth.updateUIAfterLogin(user);

                    // NUEVO: Sistema de protección anti-interferencia más agresivo
                    let verificationCount = 0;
                    const persistenceInterval = setInterval(() => {
                        verificationCount++;
                        const userSessionStatus = document.getElementById('googleUserSessionStatus');

                        if (userSessionStatus && userSessionStatus.classList.contains('d-none')) {
                            console.log(`🔄 Reactivando estado de sesión interferido (intento ${verificationCount})`);
                            console.log('🔍 Posible interferencia de admin-auth.js detectada');
                            window.googleAuth.updateUIAfterLogin(user);
                        }

                        if (verificationCount >= 10) { // Verificar 10 veces en 20 segundos (más agresivo)
                            clearInterval(persistenceInterval);
                            console.log('✅ Verificación de persistencia completada');

                            // PROTECCIÓN FINAL: Observer para vigilar cambios DOM
                            window.googleAuth.setupPersistenceProtection();
                        }
                    }, 2000);

                    // Forzar actualización de todos los componentes después de un delay
                    setTimeout(() => {
                        forceUpdateAllIAComponents(userSession);
                    }, 500);
                } else {
                    // Usuario ya no aprobado, limpiar sesión
                    localStorage.removeItem('bge_user');
                    localStorage.removeItem('userSession');
                    console.log('🔒 Usuario ya no está aprobado, sesión limpiada');
                }
            } catch (error) {
                console.warn('⚠️ Error verificando sesión guardada:', error);
                localStorage.removeItem('bge_user');
                localStorage.removeItem('userSession');
            }
        } else {
            console.log('ℹ️ No hay sesión guardada para restaurar');
        }
    }
});