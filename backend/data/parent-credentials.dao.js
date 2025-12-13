"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParentCredentialsDAO = void 0;
const database_1 = require("../config/database");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
class ParentCredentialsDAO {
    static async initTable() {
        const query = `
            CREATE TABLE IF NOT EXISTS parent_credentials (
                id SERIAL PRIMARY KEY,
                student_id INTEGER NOT NULL REFERENCES students(id),
                username VARCHAR(50) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'claimed', 'expired')),
                created_at TIMESTAMP DEFAULT NOW(),
                expires_at TIMESTAMP,
                CONSTRAINT fk_student_credential FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_parent_creds_username ON parent_credentials(username);
            CREATE INDEX IF NOT EXISTS idx_parent_creds_student ON parent_credentials(student_id);
        `;
        await (0, database_1.executeQuery)(query);
    }
    /**
     * Genera credenciales para una lista de estudiantes
     * @param studentIds Lista de IDs de estudiantes
     * @returns Lista de credenciales generadas (incluyendo password temporal en texto plano SOLO AQUI)
     */
    static async generateBatch(studentIds) {
        await this.initTable();
        const results = [];
        for (const studentId of studentIds) {
            // Verificar si ya tiene credencial activa
            const existing = await (0, database_1.executeQuery)("SELECT id FROM parent_credentials WHERE student_id = $1 AND status = 'active'", [studentId]);
            if (existing && existing.length > 0) {
                // Skip or regenerate? Let's skip for now to avoid duplicates, 
                // or we could invalidate old ones. Strategy: Skip.
                continue;
            }
            // Get student matricula for username
            const studentRows = await (0, database_1.executeQuery)("SELECT matricula FROM students WHERE id = $1", [studentId]);
            if (!studentRows || studentRows.length === 0)
                continue;
            const matricula = studentRows[0].matricula;
            const username = `P-${matricula}`;
            // Generate secure random password (8 chars)
            const tempPass = crypto.randomBytes(4).toString('hex').toUpperCase();
            const hash = await bcrypt.hash(tempPass, 10);
            await (0, database_1.executeQuery)(`INSERT INTO parent_credentials (student_id, username, password_hash, status)
                 VALUES ($1, $2, $3, 'active')`, [studentId, username, hash]);
            results.push({
                student_id: studentId,
                username: username,
                temp_pass: tempPass
            });
        }
        return results;
    }
    static async verifyCredential(username, password) {
        const rows = await (0, database_1.executeQuery)("SELECT * FROM parent_credentials WHERE username = $1 AND status = 'active'", [username]);
        if (!rows || rows.length === 0)
            return null;
        const cred = rows[0];
        const match = await bcrypt.compare(password, cred.password_hash);
        return match ? cred : null;
    }
    static async markAsClaimed(id) {
        await (0, database_1.executeQuery)("UPDATE parent_credentials SET status = 'claimed' WHERE id = $1", [id]);
    }
    static async getAllActive() {
        return await (0, database_1.executeQuery)(`
            SELECT pc.id, pc.username, pc.status, s.nombre_completo, s.matricula, s.grado, s.grupo
            FROM parent_credentials pc
            JOIN students s ON pc.student_id = s.id
            WHERE pc.status = 'active'
            ORDER BY s.grado, s.grupo, s.matricula
        `);
    }
}
exports.ParentCredentialsDAO = ParentCredentialsDAO;
exports.default = ParentCredentialsDAO;
//# sourceMappingURL=parent-credentials.dao.js.map