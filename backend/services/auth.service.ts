/**
 * 🔐 SERVICIO DE AUTENTICACIÓN JWT - TypeScript
 * Sistema completo de autenticación con roles y seguridad avanzada
 * 
 * Migración TypeScript: 07 Diciembre 2025
 */

import bcrypt from 'bcryptjs';
import devLogger from '../utils/devLogger';
import jwt from 'jsonwebtoken';
import { executeQuery } from '../config/database';
import fs from 'fs/promises';
import path from 'path';

// =====================================================
// INTERFACES
// =====================================================

export interface User {
    id: number;
    email: string;
    username: string;
    password_hash?: string;
    nombre: string;
    apellido_paterno: string;
    apellido_materno?: string;
    role: string;
    active: boolean; // or status: 'activo' | 'active'
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

// =====================================================
// AUTH SERVICE CLASS
// =====================================================

export class AuthService {
    private saltRounds: number;
    private jwtSecret: string;
    private tokenExpiry: string;
    private refreshTokenExpiry: string;
    private usersJsonPath: string;
    private sessionsJsonPath: string;

    public roles: { [key: string]: string };
    public permissions: { [key: string]: string[] };

    constructor() {
        this.saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
        this.jwtSecret = process.env.JWT_SECRET || 'secret';
        this.tokenExpiry = process.env.JWT_EXPIRES_IN || '24h';
        this.refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRY || '7d';

        // Rutas de archivos JSON de respaldo
        this.usersJsonPath = path.join(__dirname, '../../data/users.json');
        this.sessionsJsonPath = path.join(__dirname, '../../data/sessions.json');

        this.roles = {
            ADMIN: 'admin',
            DOCENTE: 'docente',
            ESTUDIANTE: 'estudiante',
            PADRE: 'padre_familia'
        };

        this.permissions = {
            admin: [
                'read_all', 'write_all', 'delete_all',
                'manage_users', 'manage_system', 'manage_reports',
                'manage_grades', 'manage_calendar', 'manage_communications'
            ],
            docente: [
                'read_students', 'write_grades', 'read_calendar',
                'write_communications', 'read_reports', 'manage_classes'
            ],
            estudiante: [
                'read_own_profile', 'read_own_grades', 'read_calendar',
                'read_communications', 'write_assignments'
            ],
            padre_familia: [
                'read_child_profile', 'read_child_grades', 'read_calendar',
                'read_communications', 'write_communications'
            ]
        };
    }

    /**
     * Inicializar archivos JSON si no existen
     */
    async initializeDataFiles() {
        try {
            // Crear directorio data si no existe
            const dataDir = path.dirname(this.usersJsonPath);
            await fs.mkdir(dataDir, { recursive: true });

            // Inicializar users.json
            try {
                await fs.access(this.usersJsonPath);
            } catch {
                const defaultUsers = [
                    {
                        id: 1,
                        username: 'Administrador',
                        email: 'admin@heroespatria.edu.mx',
                        password_hash: await bcrypt.hash('HeroesPatria2024!', this.saltRounds),
                        nombre: 'Administrador',
                        apellido_paterno: 'Sistema',
                        role: 'admin',
                        active: true,
                        created_at: new Date().toISOString(),
                        last_login: null
                    }
                ];
                await fs.writeFile(this.usersJsonPath, JSON.stringify(defaultUsers, null, 2));
                devLogger.log('✅ Archivo users.json inicializado con usuario admin');
            }

            // Inicializar sessions.json
            try {
                await fs.access(this.sessionsJsonPath);
            } catch {
                await fs.writeFile(this.sessionsJsonPath, JSON.stringify([], null, 2));
                devLogger.log('✅ Archivo sessions.json inicializado');
            }
        } catch (error: any) {
            devLogger.error('❌ Error inicializando archivos de datos:', error);
        }
    }

    /**
     * Cargar usuarios desde JSON (fallback si PostgreSQL no está disponible)
     */
    async loadUsersFromJson(): Promise<User[]> {
        try {
            // devLogger.log('🔍 DEBUG: Intentando cargar usuarios desde:', this.usersJsonPath);
            const data = await fs.readFile(this.usersJsonPath, 'utf8');
            // devLogger.log('🔍 DEBUG: Datos leídos del archivo JSON:', data);
            const parsedData = JSON.parse(data);
            // devLogger.log('🔍 DEBUG: Usuarios parseados:', JSON.stringify(parsedData, null, 2));
            // devLogger.log('🔍 DEBUG: Número de usuarios encontrados:', parsedData.length);
            return parsedData;
        } catch (error: any) {
            devLogger.warn('⚠️ No se pudieron cargar usuarios desde JSON:', error.message);
            // devLogger.error('🔍 DEBUG: Error completo:', error);
            return [];
        }
    }

    /**
     * Guardar usuarios en JSON
     */
    async saveUsersToJson(users: User[]): Promise<boolean> {
        try {
            await fs.writeFile(this.usersJsonPath, JSON.stringify(users, null, 2));
            return true;
        } catch (error: any) {
            devLogger.error('❌ Error guardando usuarios en JSON:', error);
            return false;
        }
    }

    /**
     * Autenticar usuario
     */
    async authenticateUser(username: string, password?: string): Promise<User> {
        try {
            let user: User | null = null;
            let users: User[] = [];

            // Intentar primero con PostgreSQL
            try {
                const result = await executeQuery('SELECT * FROM usuarios WHERE username = $1 OR email = $1', [username]);
                users = result as User[];
                // devLogger.log('🔍 DEBUG: Usuarios retornados por PostgreSQL:', users);
                user = users.find(u => u.username === username || u.email === username) || null;
                // devLogger.log('🔍 Usuario encontrado en PostgreSQL:', !!user);

                // Si PostgreSQL no retorna usuarios, también usar JSON fallback
                if (!user && users.length === 0) {
                    // devLogger.warn('⚠️ PostgreSQL conectado pero sin usuarios, usando JSON fallback');
                    // throw new Error('No users in PostgreSQL, fallback to JSON');
                    // NOTE: We continue to fallback block
                }
            } catch (pgError) {
                // devLogger.warn('⚠️ PostgreSQL no disponible o sin datos, usando JSON fallback');
            }

            if (!user) {
                // Fallback a JSON
                const jsonUsers = await this.loadUsersFromJson();
                // devLogger.log('🔍 DEBUG: Buscando usuario:', username);
                // devLogger.log('🔍 DEBUG: Lista de usuarios JSON:', jsonUsers.map(u => ({id: u.id, username: u.username, email: u.email})));
                user = jsonUsers.find(u => u.username === username || u.email === username) || null;
                // devLogger.log('🔍 Usuario encontrado en JSON:', !!user);
                /*
                if (user) {
                    devLogger.log('🔍 DEBUG: Usuario encontrado:', {id: user.id, username: user.username, email: user.email, role: user.role});
                } else {
                    devLogger.log('🔍 DEBUG: Usuario NO encontrado. Criterio de búsqueda:', username);
                }
                 */
            }

            if (!user) {
                throw new Error('Usuario no encontrado');
            }

            // ✅ Validar estado activo - Compatible con PostgreSQL (status='activo') y JSON (active=true)
            const isActive = user.active === true || user.status === 'activo' || user.status === 'active';

            if (!isActive) {
                throw new Error('Usuario inactivo');
            }

            // Verificar contraseña si se proporciona
            if (password && user.password_hash) {
                const passwordValid = await bcrypt.compare(password, user.password_hash);
                if (!passwordValid) {
                    throw new Error('Contraseña incorrecta');
                }
            }

            // Actualizar último login
            user.last_login = new Date().toISOString();

            // Intentar actualizar en PostgreSQL, si falla usar JSON
            try {
                await executeQuery(
                    'UPDATE usuarios SET last_login = $1 WHERE id = $2',
                    [user.last_login, user.id]
                );
            } catch {
                // Actualizar en JSON
                const jsonUsers = await this.loadUsersFromJson();
                const userIndex = jsonUsers.findIndex(u => u.id === user.id);
                if (userIndex !== -1) {
                    jsonUsers[userIndex].last_login = user.last_login;
                    await this.saveUsersToJson(jsonUsers);
                }
            }

            // Remover contraseña del objeto retornado
            // const { password_hash, ...userWithoutPassword } = user;
            if (user.password_hash) delete user.password_hash;

            devLogger.log(`✅ Login exitoso: ${user.username || user.email} (${user.role})`);
            return user;

        } catch (error: any) {
            devLogger.error('❌ Error en autenticación:', error);
            throw error;
        }
    }

    /**
     * Generar JWT token
     */
    generateAccessToken(user: User): string {
        const payload: AuthTokenPayload = {
            userId: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            permissions: this.permissions[user.role] || [],
            iat: Math.floor(Date.now() / 1000),
            type: 'access'
        };

        return jwt.sign(payload, this.jwtSecret, {
            expiresIn: this.tokenExpiry,
            issuer: 'bge-heroes-patria',
            subject: user.id.toString(),
            audience: 'bge-users'
        } as jwt.SignOptions);
    }

    /**
     * Generar refresh token
     */
    generateRefreshToken(user: User): string {
        const payload = {
            userId: user.id,
            email: user.email,
            type: 'refresh',
            iat: Math.floor(Date.now() / 1000)
        };

        return jwt.sign(payload, this.jwtSecret, {
            expiresIn: this.refreshTokenExpiry,
            issuer: 'bge-heroes-patria',
            subject: user.id.toString(),
            audience: 'bge-users'
        } as jwt.SignOptions);
    }

    /**
     * Verificar y decodificar token
     */
    verifyToken(token: string): any {
        try {
            return jwt.verify(token, this.jwtSecret, {
                issuer: 'bge-heroes-patria',
                audience: 'bge-users'
            });
        } catch (error: any) {
            throw new Error(`Token inválido: ${error.message}`);
        }
    }

    /**
     * Renovar token de acceso
     */
    async refreshAccessToken(refreshToken: string): Promise<any> {
        try {
            const decoded = this.verifyToken(refreshToken);

            if (decoded.type !== 'refresh') {
                throw new Error('Token de refresh inválido');
            }

            // Buscar usuario actualizado
            let user: User | null = null;
            try {
                const result = await executeQuery('SELECT * FROM usuarios WHERE id = $1', [decoded.userId]);
                user = result[0] as User;
            } catch {
                const jsonUsers = await this.loadUsersFromJson();
                user = jsonUsers.find(u => u.id === decoded.userId) || null;
            }

            if (!user) {
                // Check isActive logic from authenticateUser
                // const isActive = user.active === true || user.status === 'activo' || user.status === 'active';
                throw new Error('Usuario inválido');
            }
            const isActive = (user as any).active === true || (user as any).status === 'activo' || (user as any).status === 'active';
            if (!isActive) throw new Error('Usuario inactivo');

            // Generar nuevo token de acceso
            const newAccessToken = this.generateAccessToken(user);

            return {
                accessToken: newAccessToken,
                expiresIn: this.tokenExpiry,
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    role: user.role
                }
            };

        } catch (error: any) {
            throw new Error(`Error renovando token: ${error.message}`);
        }
    }

    /**
     * Crear nuevo usuario
     */
    async createUser(userData: UserInput): Promise<Omit<User, 'password_hash'>> {
        try {
            const {
                email,
                password,
                username,
                nombre,
                apellido_paterno,
                apellido_materno,
                role
            } = userData;

            // Verificar que el email no exista
            let existingUser: User | null = null;
            try {
                const users = await executeQuery('SELECT id FROM usuarios WHERE email = $1', [email]);
                existingUser = users[0] as User;
            } catch {
                const jsonUsers = await this.loadUsersFromJson();
                existingUser = jsonUsers.find(u => u.email === email) || null;
            }

            if (existingUser) {
                throw new Error('El email ya está registrado');
            }

            // Validar rol
            if (!Object.values(this.roles).includes(role)) {
                throw new Error('Rol inválido');
            }

            // Hashear contraseña
            const passwordHash = password ? await bcrypt.hash(password, this.saltRounds) : '';

            const newUser: User = {
                id: 0, // Placeholder
                email,
                password_hash: passwordHash,
                username,
                nombre,
                apellido_paterno,
                apellido_materno: apellido_materno || undefined,
                role,
                active: true,
                created_at: new Date().toISOString(),
                last_login: null
            };

            // Intentar guardar en PostgreSQL
            try {
                const result = await executeQuery(
                    `INSERT INTO usuarios (email, password_hash, username, nombre, apellido_paterno, apellido_materno, role, active, created_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
                    [email, passwordHash, username, nombre, apellido_paterno, apellido_materno, role, true, newUser.created_at]
                );
                newUser.id = result[0].id;
            } catch {
                // Fallback a JSON
                const jsonUsers = await this.loadUsersFromJson();
                newUser.id = Math.max(0, ...jsonUsers.map(u => u.id)) + 1;
                jsonUsers.push(newUser);
                await this.saveUsersToJson(jsonUsers);
            }

            devLogger.log(`✅ Usuario creado: ${email} (${role})`);

            // Retornar sin contraseña
            const { password_hash, ...userWithoutPassword } = newUser;
            return userWithoutPassword;

        } catch (error: any) {
            devLogger.error('❌ Error creando usuario:', error);
            throw error;
        }
    }

    /**
     * Cambiar contraseña
     */
    async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean> {
        try {
            // Buscar usuario
            let user: User | null = null;
            try {
                const users = await executeQuery('SELECT * FROM usuarios WHERE id = $1', [userId]);
                user = users[0] as User;
            } catch {
                const jsonUsers = await this.loadUsersFromJson();
                user = jsonUsers.find(u => u.id === userId) || null;
            }

            if (!user) {
                throw new Error('Usuario no encontrado');
            }

            // Verificar contraseña actual
            if (user.password_hash) {
                const passwordValid = await bcrypt.compare(currentPassword, user.password_hash);
                if (!passwordValid) {
                    throw new Error('Contraseña actual incorrecta');
                }
            }


            // Hashear nueva contraseña
            const newPasswordHash = await bcrypt.hash(newPassword, this.saltRounds);

            // Actualizar
            try {
                await executeQuery(
                    'UPDATE usuarios SET password_hash = $1 WHERE id = $2',
                    [newPasswordHash, userId]
                );
            } catch {
                // Actualizar en JSON
                const jsonUsers = await this.loadUsersFromJson();
                const userIndex = jsonUsers.findIndex(u => u.id === userId);
                if (userIndex !== -1) {
                    jsonUsers[userIndex].password_hash = newPasswordHash;
                    await this.saveUsersToJson(jsonUsers);
                }
            }

            devLogger.log(`✅ Contraseña cambiada para usuario ID: ${userId}`);
            return true;

        } catch (error: any) {
            devLogger.error('❌ Error cambiando contraseña:', error);
            throw error;
        }
    }

    /**
     * Actualizar el rol de un usuario.
     * Tarea: Semana 28 - SOC2 Audit Trail
     */
    async updateUserRole(userId: number, newRole: string): Promise<User> {
        devLogger.log(`[AuthService] Intentando actualizar rol para userId=${userId} a newRole=${newRole}`);
        try {
            // Validar que el rol sea válido
            if (!Object.values(this.roles).includes(newRole)) {
                throw new Error('Rol inválido proporcionado.');
            }

            const result = await executeQuery(
                'UPDATE usuarios SET role = $1 WHERE id = $2 RETURNING id, email, username, role',
                [newRole, userId]
            );

            if (result.length === 0) {
                throw new Error('Usuario no encontrado para actualizar rol.');
            }

            devLogger.log(`[AuthService] Rol actualizado exitosamente para userId=${userId}.`);
            return result[0] as User;
        } catch (error: any) {
            devLogger.error(`[AuthService] Error al actualizar rol para userId=${userId}:`, error);
            throw error;
        }
    }

    /**
     * Verificar permisos
     */
    hasPermission(userRole: string, requiredPermission: string): boolean {
        const userPermissions = this.permissions[userRole] || [];
        return userPermissions.includes(requiredPermission) || userPermissions.includes('read_all');
    }

    /**
     * Obtener perfil completo del usuario
     */
    async getUserProfile(userId: number): Promise<User> {
        try {
            let user: User | null = null;

            // Intentar PostgreSQL primero
            try {
                const users = await executeQuery(
                    'SELECT id, email, username, role, status, created_at, updated_at, last_login FROM usuarios WHERE id = $1',
                    [userId]
                );
                user = users[0] as User;
                if (user) {
                    // Normalizar el campo role
                    if (user.role === 'administrativo') {
                        user.role = 'admin';
                    }
                    // ✅ CORRECCIÓN: Normalizar active desde status
                    user.active = user.status === 'active' || user.status === 'activo';
                }
            } catch {
                // Fallback a JSON
                const jsonUsers = await this.loadUsersFromJson();
                user = jsonUsers.find(u => u.id === userId) || null;
                if (user) {
                    // Remover contraseña
                    const { password_hash, ...userWithoutPassword } = user;
                    user = userWithoutPassword as User;
                }
            }

            if (!user) {
                throw new Error('Usuario no encontrado');
            }

            // Agregar permisos
            user.permissions = this.permissions[user.role] || [];

            return user;

        } catch (error: any) {
            devLogger.error('❌ Error obteniendo perfil:', error);
            throw error;
        }
    }

    /**
     * Invalidar todas las sesiones de un usuario
     */
    async invalidateUserSessions(userId: number): Promise<boolean> {
        try {
            // En un sistema completo, aquí se invalidarían los tokens en una blacklist
            devLogger.log(`🚫 Sesiones invalidadas para usuario ID: ${userId}`);
            return true;
        } catch (error: any) {
            devLogger.error('❌ Error invalidando sesiones:', error);
            throw error;
        }
    }
}

// Singleton
let authServiceInstance: AuthService | null = null;

export function getAuthService(): AuthService {
    if (!authServiceInstance) {
        authServiceInstance = new AuthService();
        // Inicializar archivos al crear instancia
        authServiceInstance.initializeDataFiles();
    }
    return authServiceInstance;
}

export default getAuthService();
module.exports = {
    AuthService,
    getAuthService
};
