/**
 * @file extract_grades.js
 * @description Script de extracción de calificaciones para el Feature Store.
 */

const db = require('../utils/db_connector');

/**
 * Extrae todas las calificaciones del ciclo actual para procesar.
 * @param {string} periodo Periodo escolar actual (ej. '2025-A')
 */
async function extractGrades(periodo) {
    console.log(`[EXTRACT] Iniciando extracción de calificaciones para periodo: ${periodo}`);

    // Consulta optimizada para traer datos agrupados por estudiante
    // NOTA: Esta consulta asume que la tabla 'calificaciones' ya existe (Week 2 schema)
    const sql = `
        SELECT 
            c.estudiante_id,
            e.matricula,
            COALESCE(AVG(c.calificacion), 0) as promedio_general,
            COUNT(c.id) as total_materias,
            SUM(CASE WHEN c.calificacion < 6.0 THEN 1 ELSE 0 END) as materias_reprobadas,
            SUM(c.faltas) as total_faltas
        FROM calificaciones c
        JOIN estudiantes e ON c.estudiante_id = e.id
        WHERE c.periodo_escolar = $1
        GROUP BY c.estudiante_id, e.matricula
    `;

    try {
        const res = await db.query(sql, [periodo]);
        console.log(`[EXTRACT] Extracción completada. ${res.rowCount} estudiantes procesados.`);
        return res.rows;
    } catch (err) {
        console.error('[EXTRACT] Error fatal extrayendo calificaciones:', err);
        throw err;
    }
}

module.exports = { extractGrades };
