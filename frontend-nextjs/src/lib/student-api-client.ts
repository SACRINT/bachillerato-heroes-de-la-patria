import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * 🎓 Student API Client
 * Cliente HTTP independiente para estudiantes (sin NextAuth)
 * Utiliza localStorage para persistir JWT token
 */

class StudentApiClient {
    private client: AxiosInstance;
    private readonly TOKEN_KEY = 'student_auth_token';

    constructor() {
        this.client = axios.create({
            baseURL: API_URL,
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 15000,
            withCredentials: true, // Importante para CORS con credenciales
        });

        // Request interceptor - Agregar JWT automáticamente
        this.client.interceptors.request.use(
            (config) => {
                if (typeof window !== 'undefined') {
                    const token = this.getToken();
                    if (token) {
                        config.headers = config.headers || {};
                        config.headers.Authorization = `Bearer ${token}`;
                    }
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Response interceptor - Manejar errores
        this.client.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                // Si es 401 y no es un retry, intentar refresh token
                if (error.response?.status === 401 && !originalRequest._retry) {
                    console.warn('[Student API] 401 Unauthorized - Token may be expired');

                    // Opcional: Implementar refresh token aquí
                    // Por ahora, solo limpiar token inválido
                    this.clearToken();

                    // Redirect a login (solo en cliente)
                    if (typeof window !== 'undefined' && window.location.pathname !== '/estudiantes/login') {
                        window.location.href = '/estudiantes/login';
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    /**
     * Guardar token JWT en localStorage
     */
    public setToken(token: string): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem(this.TOKEN_KEY, token);
        }
    }

    /**
     * Obtener token JWT de localStorage
     */
    public getToken(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(this.TOKEN_KEY);
        }
        return null;
    }

    /**
     * Eliminar token (logout)
     */
    public clearToken(): void {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(this.TOKEN_KEY);
        }
    }

    /**
     * Verificar si usuario está autenticado
     */
    public isAuthenticated(): boolean {
        return !!this.getToken();
    }

    /**
     * Login de estudiante
     */
    public async login(matricula: string, password: string) {
        const response = await this.client.post('/api/students-auth/login', {
            matricula,
            password,
        });

        // Guardar token
        if (response.data.token) {
            this.setToken(response.data.token);
        }

        return response.data;
    }

    /**
     * Logout de estudiante
     */
    public logout(): void {
        this.clearToken();
        if (typeof window !== 'undefined') {
            window.location.href = '/estudiantes/login';
        }
    }

    /**
     * Obtener instancia de Axios para hacer requests
     */
    public getClient(): AxiosInstance {
        return this.client;
    }
}

// Exportar instancia singleton
export const studentApiClient = new StudentApiClient();
export default studentApiClient;
