/**
 * 📦 BGE SDK - JavaScript/Browser Client
 * Cliente para API v2 de BGE en navegador
 *
 * Características:
 * - Autenticación con JWT
 * - Manejo automático de tokens
 * - Retry automático con exponential backoff
 * - TypeScript-ready (JSDoc types)
 *
 * Uso:
 *   const client = new BGEClient({ apiUrl: 'https://api.bge.edu.mx', apiKey: 'your-key' });
 *   await client.auth.login('email@example.com', 'password');
 *   const students = await client.students.list();
 *
 * Versión: 1.0.0
 * Fecha: 17 Noviembre 2025
 */

class BGEClient {
    /**
     * @param {Object} config
     * @param {string} config.apiUrl - Base URL de la API (ej: https://api.bge.edu.mx)
     * @param {string} [config.apiKey] - API Key (opcional si se usa JWT)
     * @param {string} [config.apiVersion='v2'] - Versión de API (v1 o v2)
     * @param {string} [config.tenantId] - ID del tenant (opcional)
     */
    constructor(config = {}) {
        this.apiUrl = config.apiUrl || 'http://localhost:3000';
        this.apiKey = config.apiKey;
        this.apiVersion = config.apiVersion || 'v2';
        this.tenantId = config.tenantId;
        this.token = null;
        this.maxRetries = 3;

        // Módulos del SDK
        this.auth = new AuthModule(this);
        this.students = new StudentsModule(this);
        this.teachers = new TeachersModule(this);
        this.grades = new GradesModule(this);
        this.news = new NewsModule(this);
        this.webhooks = new WebhooksModule(this);
    }

    /**
     * Realiza una petición HTTP a la API
     * @private
     */
    async request(method, endpoint, data = null, options = {}) {
        const url = `${this.apiUrl}/api/${this.apiVersion}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'Accept-Version': this.apiVersion,
        };

        // Agregar autenticación
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        } else if (this.apiKey) {
            headers['X-API-Key'] = this.apiKey;
        }

        // Agregar tenant ID
        if (this.tenantId) {
            headers['X-Tenant-ID'] = this.tenantId;
        }

        // Merge custom headers
        Object.assign(headers, options.headers || {});

        const config = {
            method,
            headers,
        };

        if (data && method !== 'GET') {
            config.body = JSON.stringify(data);
        }

        // Retry logic
        let lastError;
        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            try {
                const response = await fetch(url, config);

                // Check deprecation warning
                if (response.headers.get('X-API-Deprecation-Warning')) {
                    console.warn(`⚠️ API v${this.apiVersion} está deprecada. Migra a v2.`);
                    console.warn(`End of Life: ${response.headers.get('X-API-End-Of-Life')}`);
                }

                // Parse response
                const responseData = await response.json();

                if (!response.ok) {
                    throw new BGEError(
                        responseData.error || 'API_ERROR',
                        responseData.message || 'Error desconocido',
                        response.status,
                        responseData
                    );
                }

                return responseData;

            } catch (error) {
                lastError = error;

                // No retry para errores 4xx (client errors)
                if (error.status >= 400 && error.status < 500) {
                    throw error;
                }

                // Exponential backoff
                if (attempt < this.maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
                    console.warn(`Reintentando petición (${attempt + 1}/${this.maxRetries})...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError;
    }

    /**
     * Establece el token JWT
     */
    setToken(token) {
        this.token = token;
        // Guardar en localStorage (opcional)
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('bge_token', token);
        }
    }

    /**
     * Limpia el token
     */
    clearToken() {
        this.token = null;
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('bge_token');
        }
    }

    /**
     * Recupera token de localStorage
     */
    loadToken() {
        if (typeof localStorage !== 'undefined') {
            const token = localStorage.getItem('bge_token');
            if (token) {
                this.token = token;
            }
        }
    }
}

// =============================================================================
// MÓDULOS DEL SDK
// =============================================================================

class AuthModule {
    constructor(client) {
        this.client = client;
    }

    async login(email, password) {
        const data = await this.client.request('POST', '/auth/login', { email, password });
        if (data.token) {
            this.client.setToken(data.token);
        }
        return data;
    }

    async logout() {
        this.client.clearToken();
        return { success: true };
    }

    async getProfile() {
        return this.client.request('GET', '/auth/profile');
    }

    async changePassword(currentPassword, newPassword) {
        return this.client.request('POST', '/auth/change-password', {
            currentPassword,
            newPassword,
        });
    }
}

class StudentsModule {
    constructor(client) {
        this.client = client;
    }

    async list(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.client.request('GET', `/students?${query}`);
    }

    async get(id) {
        return this.client.request('GET', `/students/${id}`);
    }

    async create(studentData) {
        return this.client.request('POST', '/students', studentData);
    }

    async update(id, studentData) {
        return this.client.request('PUT', `/students/${id}`, studentData);
    }

    async delete(id) {
        return this.client.request('DELETE', `/students/${id}`);
    }
}

class TeachersModule {
    constructor(client) {
        this.client = client;
    }

    async list(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.client.request('GET', `/teachers?${query}`);
    }

    async get(id) {
        return this.client.request('GET', `/teachers/${id}`);
    }
}

class GradesModule {
    constructor(client) {
        this.client = client;
    }

    async list(studentId) {
        return this.client.request('GET', `/students/${studentId}/grades`);
    }

    async create(studentId, gradeData) {
        return this.client.request('POST', `/students/${studentId}/grades`, gradeData);
    }

    async update(gradeId, gradeData) {
        return this.client.request('PUT', `/grades/${gradeId}`, gradeData);
    }
}

class NewsModule {
    constructor(client) {
        this.client = client;
    }

    async list(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.client.request('GET', `/news?${query}`);
    }

    async get(id) {
        return this.client.request('GET', `/news/${id}`);
    }

    async create(newsData) {
        return this.client.request('POST', '/news', newsData);
    }
}

class WebhooksModule {
    constructor(client) {
        this.client = client;
    }

    async list() {
        return this.client.request('GET', '/webhooks');
    }

    async create(webhookData) {
        return this.client.request('POST', '/webhooks', webhookData);
    }

    async update(id, webhookData) {
        return this.client.request('PATCH', `/webhooks/${id}`, webhookData);
    }

    async delete(id) {
        return this.client.request('DELETE', `/webhooks/${id}`);
    }

    async test(id) {
        return this.client.request('POST', `/webhooks/${id}/test`);
    }

    async getDeliveries(id, params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.client.request('GET', `/webhooks/${id}/deliveries?${query}`);
    }
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

class BGEError extends Error {
    constructor(code, message, status, data) {
        super(message);
        this.name = 'BGEError';
        this.code = code;
        this.status = status;
        this.data = data;
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BGEClient, BGEError };
}

// Para uso en navegador con <script>
if (typeof window !== 'undefined') {
    window.BGEClient = BGEClient;
    window.BGEError = BGEError;
}
