/**
 * 🗄️ USER DAO (Data Access Object)
 * Capa de acceso a datos para la entidad Usuario.
 * Abstrae las consultas SQL y elimina la dependencia directa en el servicio.
 * ✅ FASE 3 DAL - Migración completa
 */

const { executeQuery } = require('../config/database');
const devLogger = require('../utils/devLogger');

class UserDAO {

    static async get(id) {
        const query = `SELECT id, email, username, role, status, created_at, updated_at, last_login, password_hash FROM usuarios WHERE id = $1`;
        const result = await executeQuery(query, [id]);
        return result[0] || null;
    }

    static async getByEmail(email) {
        const result = await executeQuery(`SELECT * FROM usuarios WHERE email = $1`, [email]);
        return result[0] || null;
    }

    static async getByUsername(username) {
        const result = await executeQuery(`SELECT * FROM usuarios WHERE username = $1`, [username]);
        return result[0] || null;
    }

    static async findByUsernameOrEmail(identifier) {
        const result = await executeQuery(`SELECT * FROM usuarios WHERE username = $1 OR email = $2`, [identifier, identifier]);
        return result[0] || null;
    }

    static async create(userData) {
        const { email, password_hash, username, nombre, apellido_paterno, apellido_materno, role, active } = userData;
        const query = `INSERT INTO usuarios (email, password_hash, username, nombre, apellido_paterno, apellido_materno, role, active, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING id, email, username, role, created_at`;
        const params = [email, password_hash, username, nombre, apellido_paterno, apellido_materno || null, role, active !== false];
        const result = await executeQuery(query, params);
        return result[0];
    }

    static async updatePassword(id, newPasswordHash) {
        await executeQuery(`UPDATE usuarios SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [newPasswordHash, id]);
        return true;
    }

    static async updateLastLogin(id) {
        await executeQuery(`UPDATE usuarios SET last_login = NOW() WHERE id = $1`, [id]);
    }

    static async updateRole(id, newRole) {
        const result = await executeQuery(`UPDATE usuarios SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, username, role`, [newRole, id]);
        return result[0] || null;
    }

    static async invalidateSessions(id) {
        devLogger.log(`[UserDAO] Sesiones invalidadas para usuario ${id}`);
    }

    // =====================================================
    // MÉTODOS DE VERIFICACIÓN DE EMAIL (Fase 3 DAL)
    // =====================================================

    static async checkEmailExists(email) {
        const result = await executeQuery('SELECT id, email_verified FROM usuarios WHERE email = $1', [email.toLowerCase()]);
        return result[0] || null;
    }

    static async updateUserRegistration(id, passwordHash, nombre, apellidoPaterno, apellidoMaterno) {
        await executeQuery(`UPDATE usuarios SET password_hash = $1, nombre = $2, apellido_paterno = $3, apellido_materno = $4 WHERE id = $5`, [passwordHash, nombre, apellidoPaterno, apellidoMaterno, id]);
    }

    static async createPendingUser(email, username, passwordHash, nombre, apellidoPaterno, apellidoMaterno) {
        const result = await executeQuery(`INSERT INTO usuarios (uuid, email, username, password_hash, role, status, nombre, apellido_paterno, apellido_materno, email_verified, created_at) VALUES (gen_random_uuid(), $1, $2, $3, 'estudiante', 'pendiente', $4, $5, $6, FALSE, NOW()) RETURNING id`, [email.toLowerCase(), username, passwordHash, nombre, apellidoPaterno, apellidoMaterno]);
        return result[0]?.id;
    }

    static async deleteVerificationTokens(userId) {
        await executeQuery('DELETE FROM email_verification_tokens WHERE user_id = $1', [userId]);
    }

    static async createVerificationToken(userId, token, type, expiresAt) {
        await executeQuery('INSERT INTO email_verification_tokens (user_id, token, type, expires_at) VALUES ($1, $2, $3, $4)', [userId, token, type, expiresAt]);
    }

    static async getVerificationToken(token) {
        const result = await executeQuery(`SELECT evt.*, u.email, u.nombre FROM email_verification_tokens evt JOIN usuarios u ON u.id = evt.user_id WHERE evt.token = $1 AND evt.used_at IS NULL`, [token]);
        return result[0] || null;
    }

    static async activateUser(userId) {
        await executeQuery(`UPDATE usuarios SET email_verified = TRUE, email_verified_at = NOW(), status = 'activo' WHERE id = $1`, [userId]);
    }

    static async markTokenUsed(token) {
        await executeQuery('UPDATE email_verification_tokens SET used_at = NOW() WHERE token = $1', [token]);
    }

    static async getUnverifiedUser(email) {
        const result = await executeQuery('SELECT id, nombre, email_verified FROM usuarios WHERE email = $1', [email.toLowerCase()]);
        return result[0] || null;
    }
}

module.exports = UserDAO;
