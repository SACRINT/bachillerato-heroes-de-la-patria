/**
 * 📦 BGE SDK - Node.js Client
 * Cliente para API v2 de BGE en Node.js
 *
 * Instalación:
 *   npm install node-fetch
 *
 * Uso:
 *   const { BGEClient } = require('./sdk/nodejs');
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
     * @param {string} config.apiUrl - Base URL de la API
     * @param {string} [config.apiKey] - API Key
     * @param {string} [config.apiVersion='v2'] - Versión de API
     * @param {string} [config.tenantId] - ID del tenant
     */
    constructor(config = {}) {
        this.apiUrl = config.apiUrl || 'http://localhost:3000';
        this.apiKey = config.apiKey;
        this.apiVersion = config.apiVersion || 'v2';
        this.tenantId = config.tenantId;
        this.token = null;
        this.maxRetries = 3;

        // Módulos
        this.auth = new AuthModule(this);
        this.students = new StudentsModule(this);
        this.teachers = new TeachersModule(this);
        this.grades = new GradesModule(this);
        this.news = new NewsModule(this);
        this.webhooks = new WebhooksModule(this);
        this.reports = new ReportsModule(this);
        this.search = new SearchModule(this);
    }

    /**
     * Realiza una petición HTTP
     * @private
     */
    async request(method, endpoint, data = null, options = {}) {
        // Lazy import de node-fetch
        const fetch = (await import('node-fetch')).default;

        const url = `${this.apiUrl}/api/${this.apiVersion}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'Accept-Version': this.apiVersion,
            'User-Agent': 'BGE-SDK-NodeJS/1.0.0',
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        } else if (this.apiKey) {
            headers['X-API-Key'] = this.apiKey;
        }

        if (this.tenantId) {
            headers['X-Tenant-ID'] = this.tenantId;
        }

        Object.assign(headers, options.headers || {});

        const config = {
            method,
            headers,
        };

        if (data && method !== 'GET') {
            config.body = JSON.stringify(data);
        }

        // Retry logic con exponential backoff
        let lastError;
        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            try {
                const response = await fetch(url, config);

                // Warning deprecation
                if (response.headers.get('x-api-deprecation-warning')) {
                    console.warn(`⚠️ API ${this.apiVersion} deprecada. End of Life: ${response.headers.get('x-api-end-of-life')}`);
                }

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

                // No retry para 4xx
                if (error.status >= 400 && error.status < 500) {
                    throw error;
                }

                if (attempt < this.maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000;
                    console.warn(`Retry ${attempt + 1}/${this.maxRetries} después de ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError;
    }

    setToken(token) {
        this.token = token;
    }

    clearToken() {
        this.token = null;
    }
}

// =============================================================================
// MÓDULOS
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

    async getGrades(id) {
        return this.client.request('GET', `/students/${id}/grades`);
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

    async create(studentId, gradeData) {
        return this.client.request('POST', `/students/${studentId}/grades`, gradeData);
    }

    async update(gradeId, gradeData) {
        return this.client.request('PUT', `/grades/${gradeId}`, gradeData);
    }

    async delete(gradeId) {
        return this.client.request('DELETE', `/grades/${gradeId}`);
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

    async update(id, newsData) {
        return this.client.request('PUT', `/news/${id}`, newsData);
    }

    async publish(id) {
        return this.client.request('POST', `/news/${id}/publish`);
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

class ReportsModule {
    constructor(client) {
        this.client = client;
    }

    async students(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.client.request('GET', `/reports/students?${query}`);
    }

    async financial(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.client.request('GET', `/reports/financial?${query}`);
    }

    async approvals() {
        return this.client.request('GET', '/reports/approvals');
    }

    async attendance(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.client.request('GET', `/reports/attendance?${query}`);
    }

    async predictTrend(metric) {
        return this.client.request('GET', `/reports/predict/${metric}`);
    }
}

class SearchModule {
    constructor(client) {
        this.client = client;
    }

    async advanced(query, options = {}) {
        const params = new URLSearchParams({
            q: query,
            ...options,
        }).toString();
        return this.client.request('GET', `/search/advanced?${params}`);
    }

    async suggestions(query, limit = 10) {
        const params = new URLSearchParams({ q: query, limit }).toString();
        return this.client.request('GET', `/search/suggestions?${params}`);
    }

    async analytics() {
        return this.client.request('GET', '/search/analytics/summary');
    }
}

// =============================================================================
// ERROR
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

module.exports = {
    BGEClient,
    BGEError,
};
