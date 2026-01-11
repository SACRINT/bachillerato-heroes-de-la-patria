/**
// Debug Logger - Logging condicional (GDPR compliant)
if (typeof debugLog === 'undefined') {
    // Fallback si debug-logger.js no está cargado
    var debugLog = {
        log: () => {},
        warn: () => {},
        error: () => {}
    };
}


 * 🔌 CLIENTE API PARA INTEGRACIÓN CON BACKEND
 * Maneja todas las comunicaciones con el backend de la base de datos
 */

class APIClient {
    constructor(options = {}) {
        // URLs base para diferentes ambientes (SIN /api al final para evitar duplicación)
        this.baseURLs = {
            development: '',
            production: 'https://your-backend-domain.com',
            local: 'http://127.0.0.1:3000'
        };

        // Detectar ambiente y establecer URL base (o usar la proporcionada)
        this.baseURL = options.baseURL || this.detectEnvironment();
        this.timeout = options.timeout || 30000; // 30 segundos por defecto
        this.token = this.getStoredToken();

        // ✅ BRIDGE: Token provider inyectado por auth-api-bridge.js
        this._tokenProvider = null;

        // Configuración por defecto para requests
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    /**
     * ✅ BRIDGE: Inyectar token provider (llamado por auth-api-bridge.js)
     * Desacopla api-client de auth.js
     */
    setTokenProvider(providerFunction) {
        this._tokenProvider = providerFunction;
        debugLog.log('API', '✅ Token provider inyectado por auth-api-bridge');
    }

    /**
     * Detectar ambiente actual
     */
    detectEnvironment() {
        const hostname = window.location.hostname;

        // Producción: Vercel o cualquier dominio personalizado
        if (hostname.includes('vercel.app') ||
            (!hostname.includes('localhost') && !hostname.includes('127.0.0.1'))) {
            // En producción, usar URLs relativas (mismo dominio)
            return `${window.location.protocol}//${window.location.host}`;
        }

        // Desarrollo local
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return this.baseURLs.development;
        }

        // Fallback
        return this.baseURLs.development;
    }

    /**
     * Obtener token almacenado y verificar expiración
     */
    getStoredToken() {
        // Prioridad 1: Sistema seguro nuevo (secure_admin_session)
        try {
            const secureSession = localStorage.getItem('secure_admin_session');
            if (secureSession) {
                const sessionData = JSON.parse(secureSession);

                // Validar que el token existe y no está expirado
                if (sessionData.token) {
                    // Si tiene expiresAt, validar que no esté expirado
                    if (sessionData.expiresAt) {
                        if (Date.now() < sessionData.expiresAt) {
                            return sessionData.token;
                        } else {
                            // GDPR: Datos sensibles enmascarados
                            debugLog.warn('APP', '⚠️ Token expirado en secure_admin_session');
                            // ✅ LIMPIAR TOKEN EXPIRADO
                            localStorage.removeItem('secure_admin_session');
                            this.removeToken();
                        }
                    } else {
                        return sessionData.token;
                    }
                }
            }
        } catch (error) {
            // GDPR: Datos sensibles enmascarados
            debugLog.warn('ERROR', '⚠️ Error recuperando secure_admin_session:', error);
        }

        // ✅ NUEVO: Verificar expiración del token directo (authToken)
        const directToken = localStorage.getItem('authToken');
        if (directToken) {
            try {
                // Decodificar payload sin verificar firma (solo para leer exp)
                const payload = JSON.parse(atob(directToken.split('.')[1]));
                const now = Math.floor(Date.now() / 1000);

                if (payload.exp && payload.exp > now) {
                    // Token válido y no expirado
                    return directToken;
                } else {
                    // Token expirado
                    // GDPR: Datos sensibles enmascarados
                    debugLog.warn('APP', '⚠️ Token expirado detectado y eliminado');
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('userData');

                    console.error('APIClient: Token expired. Redirect suppressed for debugging.');
                    // window.location.href = sanitizeURL('/index.html');
                    return null;
                }
            } catch (error) {
                // GDPR: Datos sensibles enmascarados
                debugLog.warn('ERROR', '⚠️ Error verificando expiración de token:', error);
            }
        }

        // ✅ Modern Auth: bge_auth_token
        const bgeToken = localStorage.getItem('bge_auth_token') || sessionStorage.getItem('bge_auth_token');
        if (bgeToken) return bgeToken;

        // Fallback: Sistema viejo (heroes_auth_token)
        return localStorage.getItem('heroes_auth_token') || sessionStorage.getItem('heroes_auth_token');
    }

    /**
     * Establecer token de autenticación
     */
    setToken(token) {
        this.token = token;
        localStorage.setItem('heroes_auth_token', token);
    }

    /**
     * Remover token de autenticación
     */
    removeToken() {
        this.token = null;
        localStorage.removeItem('heroes_auth_token');
        sessionStorage.removeItem('heroes_auth_token');
    }

    /**
     * Obtener headers con autenticación
     */
    getHeaders() {
        const headers = { ...this.defaultHeaders };

        // ✅ BRIDGE: Usar provider inyectado si está disponible
        const token = this._tokenProvider ? this._tokenProvider() : this.getStoredToken();

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        } else {
            // GDPR: Datos sensibles enmascarados
            debugLog.warn('APP', '⚠️ No se encontró token de autenticación para la petición');
        }

        return headers;
    }

    /**
     * Construir URL completa desde endpoint
     */
    buildURL(endpoint) {
        // Asegurar que endpoint empiece con /
        const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        return `${this.baseURL}${normalizedEndpoint}`;
    }

    /**
     * GET request
     */
    async get(endpoint, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'GET'
        });
    }

    /**
     * POST request
     */
    async post(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: data
        });
    }

    /**
     * PUT request
     */
    async put(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: data
        });
    }

    /**
     * DELETE request
     */
    async delete(endpoint, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'DELETE'
        });
    }

    /**
     * Realizar request HTTP genérico
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;

        // Configurar timeout con AbortController
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        // Merge headers: default + custom options
        const headers = {
            ...this.getHeaders(),
            ...(options.headers || {})
        };

        const config = {
            method: options.method || 'GET',
            headers: headers,
            signal: controller.signal
        };

        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(url, config);
            clearTimeout(timeoutId);

            // ✅ Verificar si Content-Type es JSON
            const contentType = response.headers.get('Content-Type') || '';

            // Si no es JSON, intentar retornar como texto
            if (!contentType.includes('application/json')) {
                if (response.ok) {
                    // Para tests: retornar texto directamente
                    return await response.text();
                }

                debugLog.warn('API', `⚠️ [API WARNING] Endpoint devolvió contenido no JSON (${contentType}): ${config.method} ${url}`);

                return {
                    success: false,
                    fallback: true,
                    message: "Respuesta no JSON",
                    status: response.status
                };
            }

            // ✅ Intentar parsear JSON de forma segura
            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                debugLog.warn('API', `⚠️ [API WARNING] No se pudo parsear JSON: ${config.method} ${url}`, jsonError);

                return {
                    success: false,
                    fallback: true,
                    message: "Error al parsear JSON",
                    status: response.status
                };
            }

            if (!response.ok) {
                throw new Error(data.error || data.message || `HTTP ${response.status}`);
            }

            return data;

        } catch (error) {
            clearTimeout(timeoutId);
            debugLog.error('API', `❌ API Error: ${config.method} ${url}`, error);

            // Manejar timeout
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }

            // Manejar errores de autenticación
            if (error.message.includes('401') || error.message.includes('Token')) {
                this.removeToken();
            }

            // Re-lanzar el error para que los tests puedan capturarlo
            throw error;
        }
    }

    /**
     * Procesar solicitud de IA a través del Orquestador
     */
    async processAIRequest(intent, payload) {
        try {
            return await this.request('/api/ai-gateway/v1/process', {
                method: 'POST',
                body: {
                    intent: intent,
                    payload: payload
                }
            });
        } catch (error) {
            console.error(`AI Orchestrator Error (${intent}):`, error);
            throw error;
        }
    }

    // ============================================

    /**
     * Buscar información en la base de datos
     */
    async searchInformation(query, userType = 'visitante', limit = 5) {
        try {
            return await this.request('/api/chatbot/search', {
                method: 'POST',
                body: {
                    query: query,
                    user_type: userType,
                    limit: limit
                }
            });
        } catch (error) {
            debugLog.warn('APP', '🔍 Búsqueda en DB falló, usando respuestas estáticas');
            return null;
        }
    }

    /**
     * Registrar mensaje de chat
     */
    async logMessage(sessionId, query, response, userType = 'visitante') {
        try {
            return await this.request('/api/chatbot/message', {
                method: 'POST',
                body: {
                    session_id: sessionId,
                    query_text: query,
                    response_text: response,
                    user_type: userType,
                    response_time_ms: Date.now() - this.lastQueryTime
                }
            });
        } catch (error) {
            debugLog.warn('ERROR', '📝 Log de mensaje falló:', error.message);
            return null;
        }
    }

    /**
     * Registrar satisfacción del usuario
     */
    async submitFeedback(sessionId, rating, comment = '') {
        try {
            return await this.request('/api/chatbot/feedback', {
                method: 'POST',
                body: {
                    session_id: sessionId,
                    satisfaction_rating: rating,
                    feedback_comment: comment
                }
            });
        } catch (error) {
            debugLog.warn('ERROR', '⭐ Feedback falló:', error.message);
            return null;
        }
    }

    /**
     * Obtener categorías disponibles
     */
    async getCategories() {
        try {
            return await this.request('/api/information/categories');
        } catch (error) {
            debugLog.warn('ERROR', '📂 Obtener categorías falló:', error.message);
            return null;
        }
    }

    // ============================================
    // MÉTODOS DE AUTENTICACIÓN
    // ============================================

    /**
     * Verificar si un usuario está aprobado
     */
    async checkApproval(email) {
        try {
            const response = await this.request(`/api/admin/check-approval/${encodeURIComponent(email)}`);
            return response;
        } catch (error) {
            debugLog.warn('ERROR', '❌ Error verificando aprobación:', error);
            return { success: false, approved: false };
        }
    }

    /**
     * Iniciar sesión
     */
    async login(email, password) {
        try {
            // ✅ PRIMERO: Verificar si el usuario está aprobado
            const approvalCheck = await this.checkApproval(email);

            if (!approvalCheck.approved) {
                throw new Error('Tu solicitud de registro aún no ha sido aprobada. Por favor contacta al administrador.');
            }

            const response = await this.request('/api/auth/login', {
                method: 'POST',
                body: {
                    email: email,
                    password: password
                }
            });

            if (response.success && response.token) {
                this.setToken(response.token);
                return response;
            }

            throw new Error(response.message || 'Login falló');
        } catch (error) {
            throw error;
        }
    }

    /**
     * Iniciar sesión con Google
     */
    async loginWithGoogle(googleToken) {
        try {
            const response = await this.request('/api/auth/google', {
                method: 'POST',
                body: {
                    credential: googleToken
                }
            });

            if (response.success && response.token) {
                this.setToken(response.token);
                return response;
            }

            throw new Error(response.message || 'Login con Google falló');
        } catch (error) {
            throw error;
        }
    }

    /**
     * Cerrar sesión
     */
    async logout() {
        try {
            if (this.token) {
                await this.request('/api/auth/logout', {
                    method: 'POST'
                });
            }
        } catch (error) {
            debugLog.warn('API', 'Logout API falló:', error.message);
        }
        finally {
            this.removeToken();
            // Limpiar sesión de Google también
            sessionStorage.removeItem('google_user_session');
        }
    }

    /**
     * Obtener perfil del usuario
     */
    async getProfile() {
        try {
            return await this.request('/api/auth/profile');
        } catch (error) {
            throw error;
        }
    }

    /**
     * Verificar si el usuario está autenticado
     */
    isAuthenticated() {
        return !!this.token;
    }

    // ============================================
    // MÉTODOS DE UTILIDAD
    // ============================================

    /**
     * Verificar conexión con el backend
     */
    async checkConnection() {
        try {
            // Usar el método 'get' que ya construye la URL correctamente
            const data = await this.get('/health');
            if (data && data.success) {
                //debugLog.log('DATA', '🟢 Backend conectado:', data.message);
                return true;
            }
            return false;
        } catch (error) {
            //debugLog.log('ERROR', '🔴 Backend no disponible:', error.message);
            return false;
        }
    }

    /**
     * Generar ID de sesión único
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Obtener información del usuario basada en el token
     */
    getUserInfo() {
        if (!this.token) return null;

        try {
            // Decodificar token JWT (solo la parte del payload)
            const payload = this.token.split('.')[1];
            const decoded = JSON.parse(atob(payload));
            return {
                userId: decoded.userId,
                email: decoded.email,
                tipo_usuario: decoded.tipo_usuario
            };
        } catch (error) {
            // GDPR: Datos sensibles enmascarados
            debugLog.warn('ERROR', 'No se pudo decodificar token:', error.message);
            return null;
        }
    }
}

// Crear instancia global del cliente API
window.apiClient = new APIClient();

// Verificar conexión al cargar
document.addEventListener('DOMContentLoaded', async () => {
    const connected = await window.apiClient.checkConnection();

    if (connected) {
        //debugLog.log('API', '🚀 API Cliente inicializado correctamente');
    } else {
        //debugLog.log('API', '⚠️ API Cliente en modo offline - usando datos estáticos');
    }
});

// Export para testing en Node.js/Jest
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIClient;
}
window.APIClient = APIClient;