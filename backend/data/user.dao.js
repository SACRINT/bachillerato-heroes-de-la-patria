/**
 * 🗄️ USER DAO (Data Access Object)
 * Capa de acceso a datos para la entidad Usuario.
 * Abstrae las consultas SQL y elimina la dependencia directa en el servicio.
 */

const { executeQuery } = require('../config/database');
const devLogger = require('../utils/devLogger');

class UserDAO {

    /**
     * Obtener usuario por ID
     * @param {number} id
     * @returns {Promise<Object|null>}
     */
    static async get(id) {
        const query = `
            SELECT id, email, username, role, status, created_at, updated_at, last_login, password_hash
            FROM usuarios
            WHERE id = $1
        `;
        const result = await executeQuery(query, [id]);
        return result[0] || null;
    }

    /**
     * Obtener usuario por Email
     * @param {string} email
     * @returns {Promise<Object|null>}
     */
    static async getByEmail(email) {
        const query = `SELECT * FROM usuarios WHERE email = $1`;
        const result = await executeQuery(query, [email]);
        return result[0] || null;
    }

    /**
     * Obtener usuario por Username
     * @param {string} username
     * @returns {Promise<Object|null>}
     */
    static async getByUsername(username) {
        const query = `SELECT * FROM usuarios WHERE username = $1`;
        const result = await executeQuery(query, [username]);
        return result[0] || null;
    }

    /**
     * Buscar usuario por Username o Email (para login)
     * @param {string} identifier
     * @returns {Promise<Object|null>}
     */
    static async findByUsernameOrEmail(identifier) {
        const query = `SELECT * FROM usuarios WHERE username = $1 OR email = $2`;
        const result = await executeQuery(query, [identifier, identifier]);
        return result[0] || null;
    }

    /**
     * Crear nuevo usuario
     * @param {Object} userData
     * @returns {Promise<Object>}
     */
    static async create(userData) {
        const {
            email, password_hash, username, nombre,
            apellido_paterno, apellido_materno, role, active
        } = userData;

        const query = `
            INSERT INTO usuarios (
                email, password_hash, username, nombre,
                apellido_paterno, apellido_materno, role, active, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            RETURNING id, email, username, role, created_at
        `;

        const params = [
            email, password_hash, username, nombre,
            apellido_paterno, apellido_materno || null,
            role, active !== false
        ];

        const result = await executeQuery(query, params);
        return result[0];
    }

    /**
     * Actualizar contraseña
     * @param {number} id
     * @param {string} newPasswordHash
     * @returns {Promise<boolean>}
     */
    static async updatePassword(id, newPasswordHash) {
        const query = `UPDATE usuarios SET password_hash = $1, updated_at = NOW() WHERE id = $2`;
        const result = await executeQuery(query, [newPasswordHash, id]);
        // Nota: executeQuery devuelve rows, no result object completo con rowCount en esta implementación wrapper.
        // Asumimos éxito si no lanza error, o verificamos con un get posterior si es crítico.
        // Para simplificar y dado el wrapper actual:
        return true;
    }

    /**
     * Actualizar último login
     * @param {number} id
     * @returns {Promise<void>}
     */
    static async updateLastLogin(id) {
        const query = `UPDATE usuarios SET last_login = NOW() WHERE id = $1`;
        await executeQuery(query, [id]);
    }

    /**
     * Actualizar rol de usuario
     * @param {number} id
     * @param {string} newRole
     * @returns {Promise<Object|null>}
     */
    static async updateRole(id, newRole) {
        const query = `
            UPDATE usuarios
            SET role = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING id, email, username, role
        `;
        const result = await executeQuery(query, [newRole, id]);
        return result[0] || null;
    }

    /**
     * Invalidar sesiones (placeholder para futura implementación en DB)
     * @param {number} id
     */
    static async invalidateSessions(id) {
        // Futuro: UPDATE user_sessions SET active = false WHERE user_id = $1
        devLogger.log(`[UserDAO] Sesiones invalidadas para usuario ${id}`);
    }
}

module.exports = UserDAO;
