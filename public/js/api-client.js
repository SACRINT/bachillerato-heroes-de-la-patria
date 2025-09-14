/**
 * 🔌 CLIENTE API PARA INTEGRACIÓN CON BACKEND
 * Maneja todas las comunicaciones con el backend de la base de datos
 */

class APIClient {
    constructor() {
        // URLs base para diferentes ambientes
        this.baseURLs = {
            development: 'http://localhost:3000/api',
            production: 'https://your-backend-domain.com/api',
            local: 'http://127.0.0.1:3000/api'
        };
        
        // Detectar ambiente y establecer URL base
        this.baseURL = this.detectEnvironment();
        this.token = this.getStoredToken();
        
        // Configuración por defecto para requests
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    /**
     * Detectar ambiente actual
     */
    detectEnvironment() {
        const hostname = window.location.hostname;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return this.baseURLs.development;
        } else if (hostname.includes('github.io') || hostname.includes('githubpages')) {
            return this.baseURLs.production;
        } else {
            return this.baseURLs.local;
        }
    }

    /**
     * Obtener token almacenado
     */
    getStoredToken() {
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
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    /**
     * Realizar request HTTP genérico
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            method: 'GET',
            headers: this.getHeaders(),
            ...options
        };

        // Agregar body para requests POST/PUT
        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        try {
            //console.log(`🔌 API Request: ${config.method} ${url}`);
            
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || `HTTP ${response.status}`);
            }

            //console.log(`✅ API Response: ${config.method} ${url}`, data);
            return data;

        } catch (error) {
            console.error(`❌ API Error: ${config.method} ${url}`, error);
            
            // Si el error es de autenticación, limpiar token
            if (error.message.includes('401') || error.message.includes('Token')) {
                this.removeToken();
            }
            
            throw error;
        }
    }

    // ============================================
    // MÉTODOS ESPECÍFICOS PARA CHATBOT
    // ============================================

    /**
     * Buscar información en la base de datos
     */
    async searchInformation(query, userType = 'visitante', limit = 5) {
        try {
            return await this.request('/chatbot/search', {
                method: 'POST',
                body: {
                    query: query,
                    user_type: userType,
                    limit: limit
                }
            });
        } catch (error) {
            console.warn('🔍 Búsqueda en DB falló, usando respuestas estáticas');
            return null;
        }
    }

    /**
     * Registrar mensaje de chat
     */
    async logMessage(sessionId, query, response, userType = 'visitante') {
        try {
            return await this.request('/chatbot/message', {
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
            console.warn('📝 Log de mensaje falló:', error.message);
            return null;
        }
    }

    /**
     * Registrar satisfacción del usuario
     */
    async submitFeedback(sessionId, rating, comment = '') {
        try {
            return await this.request('/chatbot/feedback', {
                method: 'POST',
                body: {
                    session_id: sessionId,
                    satisfaction_rating: rating,
                    feedback_comment: comment
                }
            });
        } catch (error) {
            console.warn('⭐ Feedback falló:', error.message);
            return null;
        }
    }

    /**
     * Obtener categorías disponibles
     */
    async getCategories() {
        try {
            return await this.request('/information/categories');
        } catch (error) {
            console.warn('📂 Obtener categorías falló:', error.message);
            return null;
        }
    }

    // ============================================
    // MÉTODOS DE AUTENTICACIÓN
    // ============================================

    /**
     * Iniciar sesión
     */
    async login(email, password) {
        try {
            const response = await this.request('/auth/login', {
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
            const response = await this.request('/auth/google', {
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
                await this.request('/auth/logout', {
                    method: 'POST'
                });
            }
        } catch (error) {
            console.warn('Logout API falló:', error.message);
        } finally {
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
            return await this.request('/auth/profile');
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
            // Intentar endpoint de salud
            const healthURL = this.baseURL.replace('/api', '/health');
            const response = await fetch(healthURL);
            
            if (response.ok) {
                const data = await response.json();
                //console.log('🟢 Backend conectado:', data.status);
                return true;
            }
            
            return false;
        } catch (error) {
            //console.log('🔴 Backend no disponible:', error.message);
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
            console.warn('No se pudo decodificar token:', error.message);
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
        //console.log('🚀 API Cliente inicializado correctamente');
    } else {
        //console.log('⚠️ API Cliente en modo offline - usando datos estáticos');
    }
});