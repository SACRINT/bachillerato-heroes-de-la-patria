/**
 * 🗄️ USER DAO (Data Access Object) - TypeScript
 * Capa de acceso a datos para la entidad Usuario.
 * Abstrae las consultas SQL y elimina la dependencia directa en el servicio.
 * ✅ FASE 4 - Migración a TypeScript
 */

import { executeQuery } from '../config/database';
import { User, QueryResult } from '../types';

// =====================================================
// INTERFACES ESPECÍFICAS DE USUARIO
// =====================================================

export interface UserRow {
    id: number;
    email: string;
    username: string;
    role: string;
    status: string;
    created_at: Date;
    updated_at: Date;
    last_login: Date | null;
    password_hash: string;
    nombre?: string;
    apellido_paterno?: string;
    apellido_materno?: string;
    email_verified?: boolean;
    email_verified_at?: Date;
}

export interface CreateUserData {
    email: string;
    password_hash: string;
    username: string;
    nombre: string;
    apellido_paterno: string;
    apellido_materno?: string;
    role: string;
    active?: boolean;
}

export interface EmailCheckResult {
    id: number;
    email_verified: boolean;
}

export interface VerificationTokenRow {
    user_id: number;
    token: string;
    type: string;
    expires_at: Date;
    used_at: Date | null;
    email: string;
    nombre: string;
}

// =====================================================
// USER DAO CLASS
// =====================================================

class UserDAO {

    static async get(id: number): Promise<UserRow | null> {
        const query = `SELECT id, email, username, role, status, created_at, updated_at, last_login, password_hash FROM usuarios WHERE id = $1`;
        const result = await executeQuery(query, [id]);
        return result[0] || null;
    }

    static async getByEmail(email: string): Promise<UserRow | null> {
        const result = await executeQuery(`SELECT * FROM usuarios WHERE email = $1`, [email]);
        return result[0] || null;
    }

    static async getByUsername(username: string): Promise<UserRow | null> {
        const result = await executeQuery(`SELECT * FROM usuarios WHERE username = $1`, [username]);
        return result[0] || null;
    }

    static async findByUsernameOrEmail(identifier: string): Promise<UserRow | null> {
        const result = await executeQuery(`SELECT * FROM usuarios WHERE username = $1 OR email = $2`, [identifier, identifier]);
        return result[0] || null;
    }

    static async create(userData: CreateUserData): Promise<Pick<UserRow, 'id' | 'email' | 'username' | 'role' | 'created_at'>> {
        const { email, password_hash, username, nombre, apellido_paterno, apellido_materno, role, active } = userData;
        const query = `INSERT INTO usuarios (email, password_hash, username, nombre, apellido_paterno, apellido_materno, role, active, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING id, email, username, role, created_at`;
        const params = [email, password_hash, username, nombre, apellido_paterno, apellido_materno || null, role, active !== false];
        const result = await executeQuery(query, params);
        return result[0];
    }

    static async updatePassword(id: number, newPasswordHash: string): Promise<boolean> {
        await executeQuery(`UPDATE usuarios SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [newPasswordHash, id]);
        return true;
    }

    static async updateLastLogin(id: number): Promise<void> {
        await executeQuery(`UPDATE usuarios SET last_login = NOW() WHERE id = $1`, [id]);
    }

    static async updateRole(id: number, newRole: string): Promise<Pick<UserRow, 'id' | 'email' | 'username' | 'role'> | null> {
        const result = await executeQuery(`UPDATE usuarios SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, username, role`, [newRole, id]);
        return result[0] || null;
    }

    static async invalidateSessions(id: number): Promise<void> {
        console.log(`[UserDAO] Sesiones invalidadas para usuario ${id}`);
    }

    // =====================================================
    // MÉTODOS DE VERIFICACIÓN DE EMAIL (Fase 3 DAL)
    // =====================================================

    static async checkEmailExists(email: string): Promise<EmailCheckResult | null> {
        const result = await executeQuery('SELECT id, email_verified FROM usuarios WHERE email = $1', [email.toLowerCase()]);
        return result[0] || null;
    }

    static async updateUserRegistration(
        id: number,
        passwordHash: string,
        nombre: string,
        apellidoPaterno: string,
        apellidoMaterno: string
    ): Promise<void> {
        await executeQuery(
            `UPDATE usuarios SET password_hash = $1, nombre = $2, apellido_paterno = $3, apellido_materno = $4 WHERE id = $5`,
            [passwordHash, nombre, apellidoPaterno, apellidoMaterno, id]
        );
    }

    static async createPendingUser(
        email: string,
        username: string,
        passwordHash: string,
        nombre: string,
        apellidoPaterno: string,
        apellidoMaterno: string
    ): Promise<number | undefined> {
        const result = await executeQuery(
            `INSERT INTO usuarios (uuid, email, username, password_hash, role, status, nombre, apellido_paterno, apellido_materno, email_verified, created_at) VALUES (gen_random_uuid(), $1, $2, $3, 'estudiante', 'pendiente', $4, $5, $6, FALSE, NOW()) RETURNING id`,
            [email.toLowerCase(), username, passwordHash, nombre, apellidoPaterno, apellidoMaterno]
        );
        return result[0]?.id;
    }

    static async deleteVerificationTokens(userId: number): Promise<void> {
        await executeQuery('DELETE FROM email_verification_tokens WHERE user_id = $1', [userId]);
    }

    static async createVerificationToken(
        userId: number,
        token: string,
        type: string,
        expiresAt: Date
    ): Promise<void> {
        await executeQuery('INSERT INTO email_verification_tokens (user_id, token, type, expires_at) VALUES ($1, $2, $3, $4)', [userId, token, type, expiresAt]);
    }

    static async getVerificationToken(token: string): Promise<VerificationTokenRow | null> {
        const result = await executeQuery(
            `SELECT evt.*, u.email, u.nombre FROM email_verification_tokens evt JOIN usuarios u ON u.id = evt.user_id WHERE evt.token = $1 AND evt.used_at IS NULL`,
            [token]
        );
        return result[0] || null;
    }

    static async activateUser(userId: number): Promise<void> {
        await executeQuery(`UPDATE usuarios SET email_verified = TRUE, email_verified_at = NOW(), status = 'activo' WHERE id = $1`, [userId]);
    }

    static async markTokenUsed(token: string): Promise<void> {
        await executeQuery('UPDATE email_verification_tokens SET used_at = NOW() WHERE token = $1', [token]);
    }

    static async getUnverifiedUser(email: string): Promise<Pick<UserRow, 'id' | 'nombre'> & { email_verified: boolean } | null> {
        const result = await executeQuery('SELECT id, nombre, email_verified FROM usuarios WHERE email = $1', [email.toLowerCase()]);
        return result[0] || null;
    }
}

export default UserDAO;

// CommonJS compatibility
module.exports = UserDAO;
