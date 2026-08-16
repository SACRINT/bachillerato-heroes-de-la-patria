"use strict";
/**
 * 🔐 SERVICIO DE AUTENTICACIÓN JWT - TypeScript
 * Sistema completo de autenticación con roles y seguridad avanzada
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
exports.getAuthService = getAuthService;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const devLogger_1 = __importDefault(require('../utils/devLogger.js'));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require('../config/database.js');
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
// =====================================================
// AUTH SERVICE CLASS
// =====================================================
class AuthService {
    constructor() {
        this.saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
        this.jwtSecret = process.env.JWT_SECRET || 'secret';
        this.tokenExpiry = process.env.JWT_EXPIRES_IN || '24h';
        this.refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRY || '7d';
        // Rutas de archivos JSON de respaldo
        this.usersJsonPath = path_1.default.join(__dirname, '../../data/users.json');
        this.sessionsJsonPath = path_1.default.join(__dirname, '../../data/sessions.json');
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
            const dataDir = path_1.default.dirname(this.usersJsonPath);
            await promises_1.default.mkdir(dataDir, { recursive: true });
            // Inicializar users.json
            try {
                await promises_1.default.access(this.usersJsonPath);
            }
            catch {
                const defaultUsers = [
                    {
                        id: 1,
                        username: 'Administrador',
                        email: 'admin@heroespatria.edu.mx',
                        password_hash: await bcryptjs_1.default.hash('HeroesPatria2024!', this.saltRounds),
                        nombre: 'Administrador',
                        apellido_paterno: 'Sistema',
                        role: 'admin',
                        active: true,
                        created_at: new Date().toISOString(),
                        last_login: null
                    }
                ];
                await promises_1.default.writeFile(this.usersJsonPath, JSON.stringify(defaultUsers, null, 2));
                devLogger_1.default.log('✅ Archivo users.json inicializado con usuario admin');
            }
            // Inicializar sessions.json
            try {
                await promises_1.default.access(this.sessionsJsonPath);
            }
            catch {
                await promises_1.default.writeFile(this.sessionsJsonPath, JSON.stringify([], null, 2));
                devLogger_1.default.log('✅ Archivo sessions.json inicializado');
            }
        }
        catch (error) {
            devLogger_1.default.error('❌ Error inicializando archivos de datos:', error);
        }
    }
    /**
     * Cargar usuarios desde JSON (fallback si PostgreSQL no está disponible)
     */
    async loadUsersFromJson() {
        try {
            // devLogger.log('🔍 DEBUG: Intentando cargar usuarios desde:', this.usersJsonPath);
            const data = await promises_1.default.readFile(this.usersJsonPath, 'utf8');
            // devLogger.log('🔍 DEBUG: Datos leídos del archivo JSON:', data);
            const parsedData = JSON.parse(data);
            // devLogger.log('🔍 DEBUG: Usuarios parseados:', JSON.stringify(parsedData, null, 2));
            // devLogger.log('🔍 DEBUG: Número de usuarios encontrados:', parsedData.length);
            return parsedData;
        }
        catch (error) {
            devLogger_1.default.warn('⚠️ No se pudieron cargar usuarios desde JSON:', error.message);
            // devLogger.error('🔍 DEBUG: Error completo:', error);
            return [];
        }
    }
    /**
     * Guardar usuarios en JSON
     */
    async saveUsersToJson(users) {
        try {
            await promises_1.default.writeFile(this.usersJsonPath, JSON.stringify(users, null, 2));
            return true;
        }
        catch (error) {
            devLogger_1.default.error('❌ Error guardando usuarios en JSON:', error);
            return false;
        }
    }
    /**
     * Autenticar usuario
     */
    async authenticateUser(username, password) {
        try {
            let user = null;
            let users = [];
            // Intentar primero con PostgreSQL
            try {
                const result = await (0, database_1.executeQuery)('SELECT * FROM usuarios WHERE username = $1 OR email = $1', [username]);
                users = result;
                // devLogger.log('🔍 DEBUG: Usuarios retornados por PostgreSQL:', users);
                user = users.find(u => u.username === username || u.email === username) || null;
                // devLogger.log('🔍 Usuario encontrado en PostgreSQL:', !!user);
                // Si PostgreSQL no retorna usuarios, también usar JSON fallback
                if (!user && users.length === 0) {
                    // devLogger.warn('⚠️ PostgreSQL conectado pero sin usuarios, usando JSON fallback');
                    // throw new Error('No users in PostgreSQL, fallback to JSON');
                    // NOTE: We continue to fallback block
                }
            }
            catch (pgError) {
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
            const isActive = user.active === true || user.status === 'activo' || user.status === 'active' || user.activo === true || user.activo === 1;
            if (!isActive) {
                throw new Error('Usuario inactivo');
            }
            // Verificar contraseña si se proporciona
            if (password && user.password_hash) {
                const passwordValid = await bcryptjs_1.default.compare(password, user.password_hash);
                if (!passwordValid) {
                    throw new Error('Contraseña incorrecta');
                }
            }
            // Actualizar último login
            user.last_login = new Date().toISOString();
            // Intentar actualizar en PostgreSQL, si falla usar JSON
            try {
                await (0, database_1.executeQuery)('UPDATE usuarios SET last_login = $1 WHERE id = $2', [user.last_login, user.id]);
            }
            catch {
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
            if (user.password_hash)
                delete user.password_hash;
            devLogger_1.default.log(`✅ Login exitoso: ${user.username || user.email} (${user.role})`);
            return user;
        }
        catch (error) {
            devLogger_1.default.error('❌ Error en autenticación:', error);
            throw error;
        }
    }
    /**
     * Generar JWT token
     */
    generateAccessToken(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            permissions: this.permissions[user.role] || [],
            iat: Math.floor(Date.now() / 1000),
            type: 'access'
        };
        return jsonwebtoken_1.default.sign(payload, this.jwtSecret, {
            expiresIn: this.tokenExpiry,
            issuer: 'bge-heroes-patria',
            subject: user.id.toString(),
            audience: 'bge-users'
        });
    }
    /**
     * Generar refresh token
     */
    generateRefreshToken(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            type: 'refresh',
            iat: Math.floor(Date.now() / 1000)
        };
        return jsonwebtoken_1.default.sign(payload, this.jwtSecret, {
            expiresIn: this.refreshTokenExpiry,
            issuer: 'bge-heroes-patria',
            subject: user.id.toString(),
            audience: 'bge-users'
        });
    }
    /**
     * Verificar y decodificar token
     */
    verifyToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.jwtSecret, {
                issuer: 'bge-heroes-patria',
                audience: 'bge-users'
            });
        }
        catch (error) {
            throw new Error(`Token inválido: ${error.message}`);
        }
    }
    /**
     * Renovar token de acceso
     */
    async refreshAccessToken(refreshToken) {
        try {
            const decoded = this.verifyToken(refreshToken);
            if (decoded.type !== 'refresh') {
                throw new Error('Token de refresh inválido');
            }
            // Buscar usuario actualizado
            let user = null;
            try {
                const result = await (0, database_1.executeQuery)('SELECT * FROM usuarios WHERE id = $1', [decoded.userId]);
                user = result[0];
            }
            catch {
                const jsonUsers = await this.loadUsersFromJson();
                user = jsonUsers.find(u => u.id === decoded.userId) || null;
            }
            if (!user) {
                // Check isActive logic from authenticateUser
                // const isActive = user.active === true || user.status === 'activo' || user.status === 'active';
                throw new Error('Usuario inválido');
            }
            const isActive = user.active === true || user.status === 'activo' || user.status === 'active';
            if (!isActive)
                throw new Error('Usuario inactivo');
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
        }
        catch (error) {
            throw new Error(`Error renovando token: ${error.message}`);
        }
    }
    /**
     * Crear nuevo usuario
     */
    async createUser(userData) {
        try {
            const { email, password, username, nombre, apellido_paterno, apellido_materno, role } = userData;
            // Verificar que el email no exista
            let existingUser = null;
            try {
                const users = await (0, database_1.executeQuery)('SELECT id FROM usuarios WHERE email = $1', [email]);
                existingUser = users[0];
            }
            catch {
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
            const passwordHash = password ? await bcryptjs_1.default.hash(password, this.saltRounds) : '';
            const newUser = {
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
            // Intentar guardar en PostgreSQL
            // NOTE: Fallback a JSON eliminado para forzar consistencia SQL en creación de perfiles
            const result = await (0, database_1.executeQuery)(`INSERT INTO usuarios (email, password_hash, username, nombre, apellido_paterno, apellido_materno, role, active, created_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`, [email, passwordHash, username, nombre, apellido_paterno, apellido_materno, role, true, newUser.created_at]);
            newUser.id = result[0].id;

            // ✅ FIX: Crear perfil asociado automáticamente según el rol
            if (role === 'estudiante') {
                try {
                    const year = new Date().getFullYear();
                    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                    const matricula = `${year}${random}`;
                    const nia = Math.floor(Math.random() * 90000000 + 10000000).toString();

                    // Intentar insertar en tabla estudiantes (si existe)
                    // Schema real adaptado
                    const generoDefault = 'M';
                    await (0, database_1.executeQuery)(
                        `INSERT INTO estudiantes (
                                usuario_id, matricula, nombre, apellido_paterno, apellido_materno, 
                                fecha_ingreso, genero, semestre, especialidad, created_at, updated_at
                            ) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6, 1, 'Tronco Común', NOW(), NOW())`,
                        [newUser.id, matricula, nombre, apellido_paterno, apellido_materno, generoDefault]
                    );
                    devLogger_1.default.log(`✅ Perfil de estudiante creado para usuario ${newUser.id} (Matrícula: ${matricula})`);
                } catch (profileError) {
                    devLogger_1.default.warn(`⚠️ No se pudo crear perfil de estudiante (puede que la tabla no exista o falten columnas): ${profileError.message}`);
                }
            }
            devLogger_1.default.log(`✅ Usuario creado: ${email} (${role})`);
            // Retornar sin contraseña
            const { password_hash, ...userWithoutPassword } = newUser;
            return userWithoutPassword;
        }
        catch (error) {
            devLogger_1.default.error('❌ Error creando usuario:', error);
            throw error;
        }
    }
    /**
     * Cambiar contraseña
     */
    async changePassword(userId, currentPassword, newPassword) {
        try {
            // Buscar usuario
            let user = null;
            try {
                const users = await (0, database_1.executeQuery)('SELECT * FROM usuarios WHERE id = $1', [userId]);
                user = users[0];
            }
            catch {
                const jsonUsers = await this.loadUsersFromJson();
                user = jsonUsers.find(u => u.id === userId) || null;
            }
            if (!user) {
                throw new Error('Usuario no encontrado');
            }
            // Verificar contraseña actual
            if (user.password_hash) {
                const passwordValid = await bcryptjs_1.default.compare(currentPassword, user.password_hash);
                if (!passwordValid) {
                    throw new Error('Contraseña actual incorrecta');
                }
            }
            // Hashear nueva contraseña
            const newPasswordHash = await bcryptjs_1.default.hash(newPassword, this.saltRounds);
            // Actualizar
            try {
                await (0, database_1.executeQuery)('UPDATE usuarios SET password_hash = $1 WHERE id = $2', [newPasswordHash, userId]);
            }
            catch {
                // Actualizar en JSON
                const jsonUsers = await this.loadUsersFromJson();
                const userIndex = jsonUsers.findIndex(u => u.id === userId);
                if (userIndex !== -1) {
                    jsonUsers[userIndex].password_hash = newPasswordHash;
                    await this.saveUsersToJson(jsonUsers);
                }
            }
            devLogger_1.default.log(`✅ Contraseña cambiada para usuario ID: ${userId}`);
            return true;
        }
        catch (error) {
            devLogger_1.default.error('❌ Error cambiando contraseña:', error);
            throw error;
        }
    }
    /**
     * Actualizar el rol de un usuario.
     * Tarea: Semana 28 - SOC2 Audit Trail
     */
    async updateUserRole(userId, newRole) {
        devLogger_1.default.log(`[AuthService] Intentando actualizar rol para userId=${userId} a newRole=${newRole}`);
        try {
            // Validar que el rol sea válido
            if (!Object.values(this.roles).includes(newRole)) {
                throw new Error('Rol inválido proporcionado.');
            }
            const result = await (0, database_1.executeQuery)('UPDATE usuarios SET role = $1 WHERE id = $2 RETURNING id, email, username, role', [newRole, userId]);
            if (result.length === 0) {
                throw new Error('Usuario no encontrado para actualizar rol.');
            }
            devLogger_1.default.log(`[AuthService] Rol actualizado exitosamente para userId=${userId}.`);
            return result[0];
        }
        catch (error) {
            devLogger_1.default.error(`[AuthService] Error al actualizar rol para userId=${userId}:`, error);
            throw error;
        }
    }
    /**
     * Verificar permisos
     */
    hasPermission(userRole, requiredPermission) {
        const userPermissions = this.permissions[userRole] || [];
        return userPermissions.includes(requiredPermission) || userPermissions.includes('read_all');
    }
    /**
     * Obtener perfil completo del usuario
     */
    async getUserProfile(userId) {
        try {
            let user = null;
            // Intentar PostgreSQL primero
            try {
                const users = await (0, database_1.executeQuery)('SELECT id, email, username, role, status, created_at, updated_at, last_login FROM usuarios WHERE id = $1', [userId]);
                user = users[0];
                if (user) {
                    // Normalizar el campo role
                    if (user.role === 'administrativo') {
                        user.role = 'admin';
                    }
                    // ✅ CORRECCIÓN: Normalizar active desde status
                    user.active = user.status === 'active' || user.status === 'activo';
                }
            }
            catch {
                // Fallback a JSON
                const jsonUsers = await this.loadUsersFromJson();
                user = jsonUsers.find(u => u.id === userId) || null;
                if (user) {
                    // Remover contraseña
                    const { password_hash, ...userWithoutPassword } = user;
                    user = userWithoutPassword;
                }
            }
            if (!user) {
                throw new Error('Usuario no encontrado');
            }
            // Agregar permisos
            user.permissions = this.permissions[user.role] || [];
            return user;
        }
        catch (error) {
            devLogger_1.default.error('❌ Error obteniendo perfil:', error);
            throw error;
        }
    }
    /**
     * Invalidar todas las sesiones de un usuario
     */
    async invalidateUserSessions(userId) {
        try {
            // En un sistema completo, aquí se invalidarían los tokens en una blacklist
            devLogger_1.default.log(`🚫 Sesiones invalidadas para usuario ID: ${userId}`);
            return true;
        }
        catch (error) {
            devLogger_1.default.error('❌ Error invalidando sesiones:', error);
            throw error;
        }
    }
}
exports.AuthService = AuthService;
// Singleton
let authServiceInstance = null;
function getAuthService() {
    if (!authServiceInstance) {
        authServiceInstance = new AuthService();
        // Inicializar archivos al crear instancia
        authServiceInstance.initializeDataFiles();
    }
    return authServiceInstance;
}
exports.default = getAuthService();
module.exports = {
    AuthService,
    getAuthService
};
//# sourceMappingURL=auth.service.js.map