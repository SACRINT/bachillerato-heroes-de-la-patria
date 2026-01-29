import { User } from './types';

export class SessionManager {
    private readonly STORAGE_KEYS = {
        TOKEN: ['bge_auth_token', 'authToken', 'heroes_auth_token'], // Priority 1, 2, 3
        USER: ['userData', 'bge_user_data'],
        REMEMBER: 'bge_remember_me'
    };

    /**
     * Guarda la sesión del usuario
     */
    saveSession(user: User, token: string, rememberMe: boolean): void {
        const storage = rememberMe ? localStorage : sessionStorage;

        // Limpiar ambos almacenamientos para evitar inconsistencias
        this.clearSession();

        // Guardar token y usuario
        storage.setItem('bge_auth_token', token);
        storage.setItem('bge_user_data', JSON.stringify(user));

        if (rememberMe) {
            localStorage.setItem('bge_remember_me', 'true');
        }
    }

    /**
     * Carga la sesión almacenada
     */
    loadSession(): { user: User; token: string } | null {
        // Determinar dónde buscar basado en si rememberMe estaba activo o no
        // Pero por seguridad buscamos en orden de prioridad en ambos

        let token: string | null = null;
        let userDataStr: string | null = null;

        // Buscar token (prioridad: Session > Local)
        token = sessionStorage.getItem('bge_auth_token') ||
            localStorage.getItem('bge_auth_token') ||
            sessionStorage.getItem('authToken') ||
            localStorage.getItem('authToken');

        // Buscar usuario
        userDataStr = sessionStorage.getItem('bge_user_data') ||
            localStorage.getItem('bge_user_data') ||
            sessionStorage.getItem('userData') ||
            localStorage.getItem('userData');


        if (token && userDataStr) {
            try {
                const user = JSON.parse(userDataStr);
                return { user, token };
            } catch (e) {
                console.error('Error parsing user data', e);
                return null;
            }
        }

        return null;
    }

    /**
     * Limpia la sesión actual
     */
    clearSession(): void {
        const keysToRemove = [
            ...this.STORAGE_KEYS.TOKEN,
            ...this.STORAGE_KEYS.USER,
            this.STORAGE_KEYS.REMEMBER,
            'google_user_session',
            // Legacy Admin Keys
            'auth_token',
            'auth_user',
            'auth_expires',
            // Legacy Student Keys
            'student_auth_token',
            'current_student',
            // Other potential residuals
            'redirect_after_login'
        ];

        keysToRemove.forEach(key => {
            sessionStorage.removeItem(key);
            localStorage.removeItem(key);
        });

        // Limpieza profunda de cookies para evitar conflictos
        document.cookie.split(";").forEach((c) => {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });

        console.log('🧹 SessionManager: Limpieza profunda completada (Modern + Legacy)');
    }

    /**
     * Obtiene el token actual
     */
    getToken(): string | null {
        return sessionStorage.getItem('bge_auth_token') ||
            localStorage.getItem('bge_auth_token') ||
            sessionStorage.getItem('authToken') ||
            localStorage.getItem('authToken');
    }
}
