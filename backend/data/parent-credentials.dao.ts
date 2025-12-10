
import { executeQuery } from '../config/database';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

export interface ParentCredential {
    id: number;
    student_id: number;
    username: string;
    password_hash: string;
    status: 'active' | 'claimed' | 'expired';
    created_at: Date;
    expires_at: Date | null;
}

export class ParentCredentialsDAO {

    static async initTable(): Promise<void> {
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
        await executeQuery(query);
    }

    /**
     * Genera credenciales para una lista de estudiantes
     * @param studentIds Lista de IDs de estudiantes
     * @returns Lista de credenciales generadas (incluyendo password temporal en texto plano SOLO AQUI)
     */
    static async generateBatch(studentIds: number[]): Promise<Array<{ student_id: number, username: string, temp_pass: string }>> {
        await this.initTable();

        const results = [];

        for (const studentId of studentIds) {
            // Verificar si ya tiene credencial activa
            const existing = await executeQuery(
                "SELECT id FROM parent_credentials WHERE student_id = $1 AND status = 'active'",
                [studentId]
            );

            if (existing && existing.length > 0) {
                // Skip or regenerate? Let's skip for now to avoid duplicates, 
                // or we could invalidate old ones. Strategy: Skip.
                continue;
            }

            // Get student matricula for username
            const studentRows = await executeQuery("SELECT matricula FROM students WHERE id = $1", [studentId]);
            if (!studentRows || studentRows.length === 0) continue;

            const matricula = studentRows[0].matricula;
            const username = `P-${matricula}`;

            // Generate secure random password (8 chars)
            const tempPass = crypto.randomBytes(4).toString('hex').toUpperCase();
            const hash = await bcrypt.hash(tempPass, 10);

            await executeQuery(
                `INSERT INTO parent_credentials (student_id, username, password_hash, status)
                 VALUES ($1, $2, $3, 'active')`,
                [studentId, username, hash]
            );

            results.push({
                student_id: studentId,
                username: username,
                temp_pass: tempPass
            });
        }

        return results;
    }

    static async verifyCredential(username: string, password: string): Promise<ParentCredential | null> {
        const rows = await executeQuery(
            "SELECT * FROM parent_credentials WHERE username = $1 AND status = 'active'",
            [username]
        );

        if (!rows || rows.length === 0) return null;

        const cred = rows[0];
        const match = await bcrypt.compare(password, cred.password_hash);

        return match ? cred : null;
    }

    static async markAsClaimed(id: number): Promise<void> {
        await executeQuery(
            "UPDATE parent_credentials SET status = 'claimed' WHERE id = $1",
            [id]
        );
    }

    static async getAllActive(): Promise<any[]> {
        return await executeQuery(`
            SELECT pc.id, pc.username, pc.status, s.nombre_completo, s.matricula, s.grado, s.grupo
            FROM parent_credentials pc
            JOIN students s ON pc.student_id = s.id
            WHERE pc.status = 'active'
            ORDER BY s.grado, s.grupo, s.matricula
        `);
    }
}

export default ParentCredentialsDAO;
