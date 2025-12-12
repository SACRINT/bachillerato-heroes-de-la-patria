/**
 * @fileoverview API Client for backend integration.
 * Migrated from public/js/api-client.js
 */

export interface APIOptions {
    baseURL?: string;
    timeout?: number;
    headers?: Record<string, string>;
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
    body?: any;
    headers?: Record<string, string>;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    token?: string;
    [key: string]: any;
}

export class APIClient {
    private baseURL: string;
    private timeout: number;
    private token: string | null;
    private tokenProvider: (() => string | null) | null = null;
    private defaultHeaders: Record<string, string>;

    private baseURLs = {
        development: '',
        production: 'https://bachillerato-heroes-de-la-patria.vercel.app', // Updated placeholder
        local: 'http://127.0.0.1:3000'
    };

    constructor(options: APIOptions = {}) {
        this.baseURL = options.baseURL || this.detectEnvironment();
        this.timeout = options.timeout || 30000;
        this.token = this.getStoredToken();

        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    public setTokenProvider(provider: () => string | null): void {
        this.tokenProvider = provider;
        console.log('API: Token provider injected');
    }

    private detectEnvironment(): string {
        const hostname = window.location.hostname;
        if (hostname.includes('vercel.app') || (!hostname.includes('localhost') && !hostname.includes('127.0.0.1'))) {
            return `${window.location.protocol}//${window.location.host}`;
        }
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return this.baseURLs.development;
        }
        return this.baseURLs.development;
    }

    private getStoredToken(): string | null {
        // Priority 1: Secure admin session
        try {
            const secureSessionStr = localStorage.getItem('secure_admin_session');
            if (secureSessionStr) {
                const sessionData = JSON.parse(secureSessionStr);
                if (sessionData.token) {
                    if (sessionData.expiresAt && Date.now() >= sessionData.expiresAt) {
                        console.warn('API: Token expired in secure_admin_session');
                        localStorage.removeItem('secure_admin_session');
                        this.removeToken();
                    } else {
                        return sessionData.token;
                    }
                }
            }
        } catch (error) {
            console.error('API: Error recovering secure_admin_session', error);
        }

        // Priority 2: Direct authToken
        const directToken = localStorage.getItem('authToken');
        if (directToken) {
            try {
                // Decode payload to check exp
                const payload = JSON.parse(atob(directToken.split('.')[1]));
                const now = Math.floor(Date.now() / 1000);

                if (payload.exp && payload.exp > now) {
                    return directToken;
                } else {
                    console.warn('API: Token expired detected');
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('userData');
                    if (window.location.pathname.includes('admin-dashboard')) {
                        alert('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
                        window.location.href = '/index.html';
                    }
                    return null;
                }
            } catch (error) {
                console.error('API: Error verifying token expiration', error);
            }
        }

        // Fallback: Legacy token
        return localStorage.getItem('heroes_auth_token') || sessionStorage.getItem('heroes_auth_token');
    }

    public setToken(token: string): void {
        this.token = token;
        localStorage.setItem('heroes_auth_token', token);
    }

    public removeToken(): void {
        this.token = null;
        localStorage.removeItem('heroes_auth_token');
        sessionStorage.removeItem('heroes_auth_token');
    }

    private getHeaders(): Record<string, string> {
        const headers = { ...this.defaultHeaders };
        const token = this.tokenProvider ? this.tokenProvider() : this.getStoredToken();

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    public async get<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'GET' });
    }

    public async post<T = any>(endpoint: string, data: any, options: RequestOptions = {}): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'POST', body: data });
    }

    public async put<T = any>(endpoint: string, data: any, options: RequestOptions = {}): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'PUT', body: data });
    }

    public async delete<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'DELETE' });
    }

    private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const url = `${this.baseURL}${endpoint}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const headers = {
            ...this.getHeaders(),
            ...(options.headers || {})
        };

        const config: RequestInit = {
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

            const contentType = response.headers.get('Content-Type') || '';

            if (!contentType.includes('application/json')) {
                if (response.ok) {
                    return await response.text() as unknown as T;
                }
                console.warn(`API: Warning non-JSON response ${config.method} ${url}`);
                throw new Error('Response was not JSON');
            }

            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                console.warn(`API: JSON Parse Error ${config.method} ${url}`, jsonError);
                throw new Error('Error parsing JSON');
            }

            if (!response.ok) {
                throw new Error((data as any).error || (data as any).message || `HTTP ${response.status}`);
            }

            return data as T;
        } catch (error: any) {
            clearTimeout(timeoutId);
            console.error(`API Error: ${(options.method || 'GET')} ${url}`, error);

            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }

            if (error.message?.includes('401') || error.message?.includes('Token')) {
                this.removeToken();
            }

            throw error;
        }
    }

    // Auth helpers could be moved to auth.ts, but keeping some here for compatibility logic
    public async checkConnection(): Promise<boolean> {
        try {
            // Assuming /health endpoint exists
            await this.get('/health'); // Use GET instead of request to use logic
            return true;
        } catch (error) {
            return false;
        }
    }
}

export const apiClient = new APIClient();
