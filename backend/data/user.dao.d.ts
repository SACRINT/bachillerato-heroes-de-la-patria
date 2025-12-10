/**
 * 🗄️ USER DAO (Data Access Object) - TypeScript
 * Capa de acceso a datos para la entidad Usuario.
 * Abstrae las consultas SQL y elimina la dependencia directa en el servicio.
 * ✅ FASE 4 - Migración a TypeScript
 */
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
declare class UserDAO {
    static get(id: number): Promise<UserRow | null>;
    static getByEmail(email: string): Promise<UserRow | null>;
    static getByUsername(username: string): Promise<UserRow | null>;
    static findByUsernameOrEmail(identifier: string): Promise<UserRow | null>;
    static create(userData: CreateUserData): Promise<Pick<UserRow, 'id' | 'email' | 'username' | 'role' | 'created_at'>>;
    static updatePassword(id: number, newPasswordHash: string): Promise<boolean>;
    static updateLastLogin(id: number): Promise<void>;
    static updateRole(id: number, newRole: string): Promise<Pick<UserRow, 'id' | 'email' | 'username' | 'role'> | null>;
    static invalidateSessions(id: number): Promise<void>;
    static checkEmailExists(email: string): Promise<EmailCheckResult | null>;
    static updateUserRegistration(id: number, passwordHash: string, nombre: string, apellidoPaterno: string, apellidoMaterno: string): Promise<void>;
    static createPendingUser(email: string, username: string, passwordHash: string, nombre: string, apellidoPaterno: string, apellidoMaterno: string): Promise<number | undefined>;
    static deleteVerificationTokens(userId: number): Promise<void>;
    static createVerificationToken(userId: number, token: string, type: string, expiresAt: Date): Promise<void>;
    static getVerificationToken(token: string): Promise<VerificationTokenRow | null>;
    static activateUser(userId: number): Promise<void>;
    static markTokenUsed(token: string): Promise<void>;
    static getUnverifiedUser(email: string): Promise<Pick<UserRow, 'id' | 'nombre'> & {
        email_verified: boolean;
    } | null>;
}
export default UserDAO;
//# sourceMappingURL=user.dao.d.ts.map