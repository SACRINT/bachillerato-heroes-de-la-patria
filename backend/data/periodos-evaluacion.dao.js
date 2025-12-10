"use strict";
/**
 * 📅 PERIODOS EVALUACION DAO - TypeScript
 * Acceso a datos para los periodos de evaluación (Parciales)
 * Migración TypeScript: 07 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
// =====================================================
// PERIODOS EVALUACION DAO CLASS
// =====================================================
class PeriodosEvaluacionDAO {
    /**
     * Obtener periodo por ID
     */
    static async get(id) {
        const query = `SELECT * FROM periodos_evaluacion WHERE id = $1`;
        const result = await (0, database_1.executeQuery)(query, [id]);
        return result[0] || null;
    }
    /**
     * Obtener periodo por código y ciclo (e.g., 'P1', '2025-2026')
     */
    static async getByCodigo(codigo, cicloEscolar) {
        const query = `
            SELECT * FROM periodos_evaluacion 
            WHERE codigo = $1 AND ciclo_escolar = $2
        `;
        const result = await (0, database_1.executeQuery)(query, [codigo, cicloEscolar]);
        return result[0] || null;
    }
    /**
     * Listar todos los periodos (ordenado por fecha)
     */
    static async list(filters = {}) {
        let query = `SELECT * FROM periodos_evaluacion WHERE 1=1`;
        const params = [];
        if (filters.cicloEscolar) {
            params.push(filters.cicloEscolar);
            query += ` AND ciclo_escolar = $${params.length}`;
        }
        if (filters.estado) {
            params.push(filters.estado);
            query += ` AND estado = $${params.length}`;
        }
        query += ` ORDER BY ciclo_escolar DESC, created_at ASC`;
        return await (0, database_1.executeQuery)(query, params);
    }
    /**
     * Crear nuevo periodo
     */
    static async create(data) {
        const query = `
            INSERT INTO periodos_evaluacion (
                nombre, codigo, ciclo_escolar, fecha_inicio_captura, fecha_fin_captura, estado
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const params = [
            data.nombre,
            data.codigo,
            data.ciclo_escolar,
            data.fecha_inicio_captura || null,
            data.fecha_fin_captura || null,
            data.estado || 'pendiente'
        ];
        const result = await (0, database_1.executeQuery)(query, params);
        return result[0];
    }
    /**
     * Actualizar periodo
     */
    static async update(id, data) {
        const fields = [];
        const values = [];
        let idx = 1;
        if (data.nombre !== undefined) {
            fields.push(`nombre = $${idx++}`);
            values.push(data.nombre);
        }
        if (data.fecha_inicio_captura !== undefined) {
            fields.push(`fecha_inicio_captura = $${idx++}`);
            values.push(data.fecha_inicio_captura);
        }
        if (data.fecha_fin_captura !== undefined) {
            fields.push(`fecha_fin_captura = $${idx++}`);
            values.push(data.fecha_fin_captura);
        }
        if (data.estado !== undefined) {
            fields.push(`estado = $${idx++}`);
            values.push(data.estado);
        }
        values.push(id);
        const query = `
            UPDATE periodos_evaluacion 
            SET ${fields.join(', ')} 
            WHERE id = $${idx}
            RETURNING *
        `;
        return (await (0, database_1.executeQuery)(query, values))[0];
    }
}
exports.default = PeriodosEvaluacionDAO;
module.exports = PeriodosEvaluacionDAO;
//# sourceMappingURL=periodos-evaluacion.dao.js.map