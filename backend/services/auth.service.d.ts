/**
 * 🔐 SERVICIO DE AUTENTICACIÓN JWT - TypeScript
 * Sistema completo de autenticación con roles y seguridad avanzada
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface User {
    id: number;
    email: string;
    username: string;
    password_hash?: string;
    nombre: string;
    apellido_paterno: string;
    apellido_materno?: string;
    role: string;
    active: boolean;
    status?: string;
    created_at: string | Date;
    updated_at?: string | Date;
    last_login: string | Date | null;
    permissions?: string[];
}
export interface AuthTokenPayload {
    userId: number;
    email: string;
    username: string;
    role: string;
    permissions?: string[];
    iat?: number;
    type?: 'access' | 'refresh';
}
export interface LoginResponse {
    user: Omit<User, 'password_hash'>;
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
}
export interface UserInput {
    email: string;
    password?: string;
    username: string;
    nombre: string;
    apellido_paterno: string;
    apellido_materno?: string;
    role: string;
}
export declare class AuthService {
    private saltRounds;
    private jwtSecret;
    private tokenExpiry;
    private refreshTokenExpiry;
    private usersJsonPath;
    private sessionsJsonPath;
    roles: {
        [key: string]: string;
    };
    permissions: {
        [key: string]: string[];
    };
    constructor();
    /**
     * Inicializar archivos JSON si no existen
     */
    initializeDataFiles(): Promise<void>;
    /**
     * Cargar usuarios desde JSON (fallback si PostgreSQL no está disponible)
     */
    loadUsersFromJson(): Promise<User[]>;
    /**
     * Guardar usuarios en JSON
     */
    saveUsersToJson(users: User[]): Promise<boolean>;
    /**
     * Autenticar usuario
     */
    authenticateUser(username: string, password?: string): Promise<User>;
    /**
     * Generar JWT token
     */
    generateAccessToken(user: User): string;
    /**
     * Generar refresh token
     */
    generateRefreshToken(user: User): string;
    /**
     * Verificar y decodificar token
     */
    verifyToken(token: string): any;
    /**
     * Renovar token de acceso
     */
    refreshAccessToken(refreshToken: string): Promise<any>;
    /**
     * Crear nuevo usuario
     */
    createUser(userData: UserInput): Promise<Omit<User, 'password_hash'>>;
    /**
     * Cambiar contraseña
     */
    changePassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean>;
    /**
     * Actualizar el rol de un usuario.
     * Tarea: Semana 28 - SOC2 Audit Trail
     */
    updateUserRole(userId: number, newRole: string): Promise<User>;
    /**
     * Verificar permisos
     */
    hasPermission(userRole: string, requiredPermission: string): boolean;
    /**
     * Obtener perfil completo del usuario
     */
    getUserProfile(userId: number): Promise<User>;
    /**
     * Invalidar todas las sesiones de un usuario
     */
    invalidateUserSessions(userId: number): Promise<boolean>;
}
export declare function getAuthService(): AuthService;
declare const _default: AuthService;
export default _default;
//# sourceMappingURL=auth.service.d.ts.map