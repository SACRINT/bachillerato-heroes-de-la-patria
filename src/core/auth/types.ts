export interface User {
    id?: number | string;
    nombre: string;
    apellido_paterno?: string;
    apellido_materno?: string;
    email: string;
    tipo_usuario?: 'estudiante' | 'docente' | 'administrativo' | 'padre_familia' | 'visitante' | 'visitante_google';
    role?: string;
    foto?: string;
    ultimo_acceso?: string;
    fecha_creacion?: string;
    email_verificado?: boolean;
    google_id?: string;
}

export interface AuthState {
    currentUser: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isInitialized: boolean;
    googleReady: boolean;
    lastActivityTime: number;
    webauthnReady?: boolean;
}

export interface AuthConfig {
    apiBaseUrl: string;
    googleClientId?: string | null;
    sessionTimeout: number;
}

export interface AuthResponse {
    success: boolean;
    token?: string;
    user?: User;
    message?: string;
    error?: string;
}
