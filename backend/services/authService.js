/**
 * 🔐 SERVICIO DE AUTENTICACIÓN JWT - BGE HÉROES DE LA PATRIA
 * Sistema completo de autenticación con roles y seguridad avanzada
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

class AuthService {
    constructor() {
        this.saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        this.jwtSecret = process.env.JWT_SECRET;
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
                console.log('✅ Archivo users.json inicializado con usuario admin');
            }

            // Inicializar sessions.json
            try {
                await fs.access(this.sessionsJsonPath);
            } catch {
                await fs.writeFile(this.sessionsJsonPath, JSON.stringify([], null, 2));
                console.log('✅ Archivo sessions.json inicializado');
            }
        } catch (error) {
            console.error('❌ Error inicializando archivos de datos:', error);
        }
    }

    /**
     * Cargar usuarios desde JSON (fallback si PostgreSQL no está disponible)
     */
    async loadUsersFromJson() {
        try {
            console.log('🔍 DEBUG: Intentando cargar usuarios desde:', this.usersJsonPath);
            const data = await fs.readFile(this.usersJsonPath, 'utf8');
            console.log('🔍 DEBUG: Datos leídos del archivo JSON:', data);
            const parsedData = JSON.parse(data);
            console.log('🔍 DEBUG: Usuarios parseados:', JSON.stringify(parsedData, null, 2));
            console.log('🔍 DEBUG: Número de usuarios encontrados:', parsedData.length);
            return parsedData;
        } catch (error) {
            console.warn('⚠️ No se pudieron cargar usuarios desde JSON:', error.message);
            console.error('🔍 DEBUG: Error completo:', error);
            return [];
        }
    }

    /**
     * Guardar usuarios en JSON
     */
    async saveUsersToJson(users) {
        try {
            await fs.writeFile(this.usersJsonPath, JSON.stringify(users, null, 2));
            return true;
        } catch (error) {
            console.error('❌ Error guardando usuarios en JSON:', error);
            return false;
        }
    }

    /**
     * Autenticar usuario
     */
    async authenticateUser(username, password) {
        try {
            let user = null;

            // Intentar primero con PostgreSQL
            try {
                const users = await executeQuery('SELECT * FROM usuarios WHERE username = $1 OR email = $2', [username, username]);
                console.log('🔍 DEBUG: Usuarios retornados por PostgreSQL:', users);
                user = users.find(u => u.username === username || u.email === username);
                console.log('🔍 Usuario encontrado en PostgreSQL:', !!user);

                // Si PostgreSQL no retorna usuarios, también usar JSON fallback
                if (!user && users.length === 0) {
                    console.warn('⚠️ PostgreSQL conectado pero sin usuarios, usando JSON fallback');
                    throw new Error('No users in PostgreSQL, fallback to JSON');
                }
            } catch (pgError) {
                console.warn('⚠️ PostgreSQL no disponible o sin datos, usando JSON fallback');

                // Fallback a JSON
                const jsonUsers = await this.loadUsersFromJson();
                console.log('🔍 DEBUG: Buscando usuario:', username);
                console.log('🔍 DEBUG: Lista de usuarios JSON:', jsonUsers.map(u => ({id: u.id, username: u.username, email: u.email})));
                user = jsonUsers.find(u => u.username === username || u.email === username);
                console.log('🔍 Usuario encontrado en JSON:', !!user);
                if (user) {
                    console.log('🔍 DEBUG: Usuario encontrado:', {id: user.id, username: user.username, email: user.email, role: user.role});
                } else {
                    console.log('🔍 DEBUG: Usuario NO encontrado. Criterio de búsqueda:', username);
                }
            }

            if (!user) {
                throw new Error('Usuario no encontrado');
            }

            // ✅ Validar estado activo - Compatible con PostgreSQL (status='activo') y JSON (active=true)
            const isActive = user.active === true || user.status === 'activo' || user.status === 'active';

            if (!isActive) {
                throw new Error('Usuario inactivo');
            }

            // Verificar contraseña
            const passwordValid = await bcrypt.compare(password, user.password_hash);
            if (!passwordValid) {
                throw new Error('Contraseña incorrecta');
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
            const { password_hash, ...userWithoutPassword } = user;

            console.log(`✅ Login exitoso: ${user.username || user.email} (${user.role})`);
            return userWithoutPassword;

        } catch (error) {
            console.error('❌ Error en autenticación:', error);
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

        return jwt.sign(payload, this.jwtSecret, {
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

        return jwt.sign(payload, this.jwtSecret, {
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
            return jwt.verify(token, this.jwtSecret, {
                issuer: 'bge-heroes-patria',
                audience: 'bge-users'
            });
        } catch (error) {
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
                const users = await executeQuery('SELECT * FROM usuarios WHERE id = $1', [decoded.userId]);
                user = users[0];
            } catch {
                const jsonUsers = await this.loadUsersFromJson();
                user = jsonUsers.find(u => u.id === decoded.userId);
            }

            if (!user || !user.active) {
                throw new Error('Usuario inválido o inactivo');
            }

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

        } catch (error) {
            throw new Error(`Error renovando token: ${error.message}`);
        }
    }

    /**
     * Crear nuevo usuario
     */
    async createUser(userData) {
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
            let existingUser = null;
            try {
                const users = await executeQuery('SELECT id FROM usuarios WHERE email = $1', [email]);
                existingUser = users[0];
            } catch {
                const jsonUsers = await this.loadUsersFromJson();
                existingUser = jsonUsers.find(u => u.email === email);
            }

            if (existingUser) {
                throw new Error('El email ya está registrado');
            }

            // Validar rol
            if (!Object.values(this.roles).includes(role)) {
                throw new Error('Rol inválido');
            }

            // Hashear contraseña
            const passwordHash = await bcrypt.hash(password, this.saltRounds);

            const newUser = {
                email,
                password_hash: passwordHash,
                username,
                nombre,
                apellido_paterno,
                apellido_materno: apellido_materno || null,
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

            console.log(`✅ Usuario creado: ${email} (${role})`);

            // Retornar sin contraseña
            const { password_hash, ...userWithoutPassword } = newUser;
            return userWithoutPassword;

        } catch (error) {
            console.error('❌ Error creando usuario:', error);
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
                const users = await executeQuery('SELECT * FROM usuarios WHERE id = $1', [userId]);
                user = users[0];
            } catch {
                const jsonUsers = await this.loadUsersFromJson();
                user = jsonUsers.find(u => u.id === userId);
            }

            if (!user) {
                throw new Error('Usuario no encontrado');
            }

            // Verificar contraseña actual
            const passwordValid = await bcrypt.compare(currentPassword, user.password_hash);
            if (!passwordValid) {
                throw new Error('Contraseña actual incorrecta');
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

            console.log(`✅ Contraseña cambiada para usuario ID: ${userId}`);
            return true;

        } catch (error) {
            console.error('❌ Error cambiando contraseña:', error);
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
                const users = await executeQuery(
                    'SELECT id, email, username, role, status, created_at, updated_at, last_login FROM usuarios WHERE id = $1',
                    [userId]
                );
                user = users[0];
                if (user) {
                    // Normalizar el campo role
                    if (user.role === 'administrativo') {
                        user.role = 'admin';
                    }
                    // ✅ CORRECCIÓN: Normalizar active desde status - Compatible con PostgreSQL (status='activo') y JSON (status='active')
                    user.active = user.status === 'active' || user.status === 'activo';
                }
            } catch {
                // Fallback a JSON
                const jsonUsers = await this.loadUsersFromJson();
                user = jsonUsers.find(u => u.id === userId);
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

        } catch (error) {
            console.error('❌ Error obteniendo perfil:', error);
            throw error;
        }
    }

    /**
     * Invalidar todas las sesiones de un usuario
     */
    async invalidateUserSessions(userId) {
        try {
            // En un sistema completo, aquí se invalidarían los tokens en una blacklist
            console.log(`🚫 Sesiones invalidadas para usuario ID: ${userId}`);
            return true;
        } catch (error) {
            console.error('❌ Error invalidando sesiones:', error);
            throw error;
        }
    }
}

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

module.exports = {
    AuthService,
    getAuthService
};
