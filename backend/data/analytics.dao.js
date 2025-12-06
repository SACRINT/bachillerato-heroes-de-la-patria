/**
 * 📊 ANALYTICS DAO
 * Data Access Object para estadísticas, ML y análisis predictivo
 * 
 * Refactorizado: 05 Diciembre 2025
 */

const { pool } = require('../config/database');

class AnalyticsDAO {

    // =========================================================================
    // RECOMMENDATIONS
    // =========================================================================

    /**
     * Obtener items populares por tipo
     * @param {string} type - courses, materials, activities, resources
     * @param {number} limit
     * @returns {Promise<Array>}
     */
    static async getPopularItems(type, limit = 10) {
        const tableMap = {
            'courses': 'cursos',
            'materials': 'materiales',
            'activities': 'actividades',
            'resources': 'recursos'
        };
        const tableName = tableMap[type] || 'cursos';

        const result = await pool.query(`
            SELECT id, titulo as title, descripcion, 
                   COALESCE(views, 0) as popularity_score, categoria
            FROM ${tableName}
            WHERE activo = true
            ORDER BY COALESCE(views, 0) DESC, created_at DESC
            LIMIT $1
        `, [limit]);
        return result.rows;
    }

    /**
     * Registrar interacción de usuario
     * @param {number} userId
     * @param {string} type
     * @param {number} itemId
     * @param {string} interactionType
     * @param {number|null} rating
     * @returns {Promise<void>}
     */
    static async recordInteraction(userId, type, itemId, interactionType, rating = null) {
        await pool.query(`
            INSERT INTO user_item_interactions (user_id, item_type, item_id, interaction_type, rating, created_at)
            VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        `, [userId, type, itemId, interactionType, rating]);
    }

    /**
     * Obtener items similares por categoría
     * @param {string} type
     * @param {number} itemId
     * @param {number} limit
     * @returns {Promise<Array>}
     */
    static async getSimilarItems(type, itemId, limit = 5) {
        const tableMap = {
            'courses': 'cursos',
            'materials': 'materiales',
            'activities': 'actividades',
            'resources': 'recursos'
        };
        const tableName = tableMap[type] || 'cursos';

        const result = await pool.query(`
            SELECT s.id, s.titulo as title, s.descripcion, s.categoria
            FROM ${tableName} s
            WHERE s.id != $1
              AND s.activo = true
              AND s.categoria = (SELECT categoria FROM ${tableName} WHERE id = $1)
            ORDER BY s.created_at DESC
            LIMIT $2
        `, [itemId, limit]);
        return result.rows;
    }

    /**
     * Estadísticas de recomendaciones
     * @returns {Promise<Object>}
     */
    static async getRecommendationStats() {
        const [totalResult, byTypeResult, topItemsResult, topUsersResult] = await Promise.all([
            pool.query(`SELECT COUNT(*) as total FROM user_item_interactions`),
            pool.query(`SELECT interaction_type, COUNT(*) as count FROM user_item_interactions GROUP BY interaction_type ORDER BY count DESC`),
            pool.query(`SELECT item_type, item_id, COUNT(*) as interactions FROM user_item_interactions GROUP BY item_type, item_id ORDER BY interactions DESC LIMIT 10`),
            pool.query(`SELECT user_id, COUNT(*) as interactions FROM user_item_interactions GROUP BY user_id ORDER BY interactions DESC LIMIT 10`)
        ]);

        return {
            total_interactions: parseInt(totalResult.rows[0]?.total || 0),
            by_type: byTypeResult.rows,
            top_items: topItemsResult.rows,
            top_users: topUsersResult.rows
        };
    }

    /**
         * Health check de recomendaciones
         * @returns {Promise<Object>}
         */
    static async getRecommendationsHealth() {
        await pool.query('SELECT 1');
        const tables = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name IN ('user_item_interactions', 'cursos', 'materiales')
        `);
        return { tables_found: tables.rows.map(r => r.table_name) };
    }

    /**
     * Obtener items populares (con nombres de tabla alternos)
     * @param {string} type 
     * @param {number} limit 
     * @returns {Promise<Array>}
     */
    static async getPopularItemsAlt(type, limit = 10) {
        const tableMap = {
            'courses': 'cursos_disponibles',
            'materials': 'materiales_estudio',
            'activities': 'actividades_extra',
            'resources': 'recursos_academicos'
        };
        const tableName = tableMap[type] || 'cursos_disponibles';

        const result = await pool.query(`
            SELECT
                id AS item_id,
                nombre,
                descripcion,
                categoria,
                COALESCE(visualizaciones, 0) AS popularity_score
            FROM ${tableName}
            WHERE activo = true
            ORDER BY visualizaciones DESC NULLS LAST, created_at DESC
            LIMIT $1
        `, [limit]);

        return result.rows.map((row, index) => ({
            ...row,
            score: 1.0 - (index / limit)
        }));
    }

    /**
     * Obtener items similares por categoría (con nombres de tabla alternos)
     * @param {string} type 
     * @param {number} itemId 
     * @param {number} limit 
     * @returns {Promise<Array>}
     */
    static async getSimilarItemsAlt(type, itemId, limit = 5) {
        const tableMap = {
            'courses': 'cursos_disponibles',
            'materials': 'materiales_estudio',
            'activities': 'actividades_extra',
            'resources': 'recursos_academicos'
        };
        const tableName = tableMap[type];
        if (!tableName) return [];

        const result = await pool.query(`
            SELECT
                s.id AS item_id,
                s.nombre,
                s.descripcion,
                s.categoria
            FROM ${tableName} s
            WHERE s.activo = true
              AND s.categoria = (SELECT categoria FROM ${tableName} WHERE id = $1)
              AND s.id != $1
            ORDER BY s.created_at DESC
            LIMIT $2
        `, [itemId, limit]);
        return result.rows;
    }

    /**
     * Analytics de interacciones con filtros de fecha
     * @param {Object} filters - { dateFrom, dateTo }
     * @returns {Promise<Object>}
     */
    static async getInteractionAnalytics(filters = {}) {
        let whereClause = '1=1';
        const params = [];
        let paramIndex = 1;

        if (filters.dateFrom) {
            whereClause += ` AND created_at >= $${paramIndex}`;
            params.push(new Date(filters.dateFrom));
            paramIndex++;
        }
        if (filters.dateTo) {
            whereClause += ` AND created_at <= $${paramIndex}`;
            params.push(new Date(filters.dateTo));
            paramIndex++;
        }

        const [totalResult, byTypeResult, topItemsResult, topUsersResult] = await Promise.all([
            pool.query(`SELECT COUNT(*) AS total FROM recommendation_interactions WHERE ${whereClause}`, params),
            pool.query(`
                SELECT interaction_type, COUNT(*) AS count
                FROM recommendation_interactions
                WHERE ${whereClause}
                GROUP BY interaction_type
                ORDER BY count DESC
            `, params),
            pool.query(`
                SELECT item_type, item_id, COUNT(*) AS interaction_count,
                       AVG(CASE WHEN rating IS NOT NULL THEN rating ELSE NULL END) AS avg_rating
                FROM recommendation_interactions
                WHERE ${whereClause}
                GROUP BY item_type, item_id
                ORDER BY interaction_count DESC
                LIMIT 20
            `, params),
            pool.query(`
                SELECT user_id, COUNT(*) AS interaction_count
                FROM recommendation_interactions
                WHERE ${whereClause}
                GROUP BY user_id
                ORDER BY interaction_count DESC
                LIMIT 20
            `, params)
        ]);

        return {
            total_interactions: parseInt(totalResult.rows[0].total),
            interactions_by_type: byTypeResult.rows,
            top_items: topItemsResult.rows,
            top_users: topUsersResult.rows
        };
    }

    // =========================================================================
    // PREDICTIVE ANALYTICS
    // =========================================================================

    /**
     * Calificaciones históricas de estudiante
     * @param {string} studentId
     * @returns {Promise<Array>}
     */
    static async getHistoricalGrades(studentId) {
        const query = `
            SELECT DATE_TRUNC('month', fecha_registro) as date,
                   AVG(calificacion) as grade
            FROM calificaciones
            WHERE estudiante_id = $1
            GROUP BY DATE_TRUNC('month', fecha_registro)
            ORDER BY date ASC
        `;
        const result = await pool.query(query, [studentId]);
        return result.rows.map(row => ({
            date: row.date,
            value: parseFloat(row.grade)
        }));
    }

    /**
     * Inscripciones históricas
     * @returns {Promise<Array>}
     */
    static async getHistoricalEnrollments() {
        const query = `
            SELECT DATE_TRUNC('month', fecha_inscripcion) as date,
                   COUNT(*) as count
            FROM inscripciones
            GROUP BY DATE_TRUNC('month', fecha_inscripcion)
            ORDER BY date ASC
        `;
        const result = await pool.query(query);
        return result.rows.map(row => ({
            date: row.date,
            value: parseInt(row.count)
        }));
    }

    /**
     * Deserciones históricas
     * @returns {Promise<Array>}
     */
    static async getHistoricalDropout() {
        const query = `
            SELECT DATE_TRUNC('month', fecha_baja) as date,
                   COUNT(*) as dropout_count
            FROM usuarios
            WHERE status = 'baja' AND fecha_baja IS NOT NULL
            GROUP BY DATE_TRUNC('month', fecha_baja)
            ORDER BY date ASC
        `;
        const result = await pool.query(query);
        return result.rows.map(row => ({
            date: row.date,
            value: parseInt(row.dropout_count)
        }));
    }

    /**
     * Tendencia de calificaciones
     * @param {string} startDate
     * @param {string} endDate
     * @returns {Promise<Array>}
     */
    static async getGradesTrend(startDate, endDate) {
        const query = `
            SELECT DATE_TRUNC('week', fecha_registro) as date,
                   AVG(calificacion) as value
            FROM calificaciones
            WHERE fecha_registro BETWEEN $1 AND $2
            GROUP BY DATE_TRUNC('week', fecha_registro)
            ORDER BY date ASC
        `;
        const result = await pool.query(query, [startDate, endDate]);
        return result.rows.map(row => ({
            ds: row.date,
            y: parseFloat(row.value)
        }));
    }

    /**
     * Summary de predictive analytics
     * @returns {Promise<Object>}
     */
    static async getPredictiveSummary() {
        const result = await pool.query(`
            SELECT COUNT(DISTINCT estudiante_id) as count FROM calificaciones
        `);
        return {
            total_students_with_grades: parseInt(result.rows[0]?.count || 0)
        };
    }

    // =========================================================================
    // ML PREDICTIONS
    // =========================================================================

    /**
     * Features de estudiante para predicción
     * @param {string} studentId
     * @returns {Promise<Object|null>}
     */
    static async getStudentFeatures(studentId) {
        const query = `
            SELECT 
                u.uuid,
                u.nombre,
                u.apellido_paterno,
                COALESCE(
                    (SELECT AVG(c.calificacion) FROM calificaciones c WHERE c.estudiante_id = u.uuid),
                    0
                ) as avg_grade,
                COALESCE(
                    (SELECT COUNT(*) * 100.0 / NULLIF(
                        (SELECT COUNT(*) FROM asistencias WHERE estudiante_id = u.uuid), 0)
                    FROM asistencias WHERE estudiante_id = u.uuid AND presente = true),
                    100
                ) as attendance_rate,
                EXTRACT(YEAR FROM AGE(u.fecha_nacimiento)) as age,
                CASE WHEN u.genero = 'M' THEN 1 ELSE 0 END as is_male,
                COALESCE(
                    (SELECT COUNT(*) FROM inscripciones WHERE estudiante_id = u.uuid),
                    1
                ) as enrolled_courses
            FROM usuarios u
            WHERE u.uuid = $1 AND u.role = 'estudiante'
        `;
        const result = await pool.query(query, [studentId]);
        return result.rows[0] || null;
    }

    /**
     * Estudiantes activos para análisis de riesgo
     * @param {number} limit
     * @returns {Promise<Array>}
     */
    static async getActiveStudents(limit = 100) {
        const result = await pool.query(`
            SELECT uuid, nombre, apellido_paterno, email
            FROM usuarios
            WHERE role = 'estudiante' AND status = 'activo'
            LIMIT $1
        `, [limit]);
        return result.rows;
    }

    // =========================================================================
    // PERFORMANCE DB STATS
    // =========================================================================

    /**
     * Estadísticas de tablas
     * @param {string|null} tableName
     * @returns {Promise<Array>}
     */
    static async getTableStats(tableName = null) {
        let query = `
            SELECT
                relname as table_name,
                n_live_tup as row_count,
                n_dead_tup as dead_rows,
                last_vacuum,
                last_autovacuum,
                last_analyze,
                last_autoanalyze
            FROM pg_stat_user_tables
        `;
        const params = [];
        if (tableName) {
            query += ' WHERE relname = $1';
            params.push(tableName);
        }
        query += ' ORDER BY n_live_tup DESC';

        const result = await pool.query(query, params);
        return result.rows;
    }

    /**
     * Uso de índices
     * @param {string|null} tableName
     * @param {boolean} unusedOnly
     * @returns {Promise<Array>}
     */
    static async getIndexUsage(tableName = null, unusedOnly = false) {
        let query = `
            SELECT
                schemaname,
                relname as table_name,
                indexrelname as index_name,
                idx_scan as times_used,
                idx_tup_read as rows_read,
                idx_tup_fetch as rows_fetched,
                pg_size_pretty(pg_relation_size(indexrelid)) as index_size
            FROM pg_stat_user_indexes
            WHERE schemaname = 'public'
        `;
        const params = [];
        let paramIdx = 0;

        if (tableName) {
            query += ` AND relname = $${++paramIdx}`;
            params.push(tableName);
        }
        if (unusedOnly) {
            query += ' AND idx_scan = 0';
        }
        query += ' ORDER BY idx_scan DESC';

        const result = await pool.query(query, params);
        return result.rows;
    }

    /**
     * Health check del sistema
     * @returns {Promise<Object>}
     */
    static async getSystemHealth() {
        const [tablesResult, unusedIndexesResult] = await Promise.all([
            pool.query(`
                SELECT relname as table_name, n_live_tup as row_count
                FROM pg_stat_user_tables
                ORDER BY n_live_tup DESC LIMIT 10
            `),
            pool.query(`
                SELECT COUNT(*) as count
                FROM pg_stat_user_indexes
                WHERE idx_scan = 0 AND schemaname = 'public'
            `)
        ]);

        return {
            top_tables: tablesResult.rows,
            unused_indexes_count: parseInt(unusedIndexesResult.rows[0]?.count || 0)
        };
    }

    /**
     * Verificar existencia de tabla
     * @param {string} tableName
     * @returns {Promise<boolean>}
     */
    static async tableExists(tableName) {
        const result = await pool.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = $1
            ) as exists
        `, [tableName]);
        return result.rows[0]?.exists || false;
    }

    /**
     * Ejecutar comando de mantenimiento
     * @param {string} command
     * @returns {Promise<void>}
     */
    static async executeMaintenanceCommand(command) {
        await pool.query(command);
    }

    // =========================================================================
    // ML PREDICTIONS
    // =========================================================================

    /**
     * Extraer features de un estudiante para ML
     * @param {string} studentId - UUID del estudiante
     * @returns {Promise<Object>}
     */
    static async getStudentFeatures(studentId) {
        const query = `
            WITH student_data AS (
                SELECT
                    u.uuid AS student_id,
                    u.date_of_birth,
                    u.gender,
                    u.status,
                    COUNT(DISTINCT a.id) AS total_attendance_records,
                    SUM(CASE WHEN a.estado = 'presente' THEN 1 ELSE 0 END) AS days_present,
                    ROUND(
                        SUM(CASE WHEN a.estado = 'presente' THEN 1 ELSE 0 END)::NUMERIC /
                        NULLIF(COUNT(DISTINCT a.id), 0) * 100,
                        2
                    ) AS attendance_rate,
                    AVG(c.calificacion) AS avg_grade,
                    MIN(c.calificacion) AS min_grade,
                    MAX(c.calificacion) AS max_grade,
                    STDDEV(c.calificacion) AS grade_stddev,
                    COUNT(DISTINCT al.id) FILTER (WHERE al.action = 'LOGIN') AS login_count,
                    COUNT(DISTINCT te.id) AS assignments_submitted
                FROM usuarios u
                LEFT JOIN asistencia a ON u.uuid = a.estudiante_id
                LEFT JOIN calificaciones c ON u.uuid = c.estudiante_id
                LEFT JOIN audit_logs al ON u.uuid = al.user_id
                LEFT JOIN tareas_estudiantes te ON u.uuid = te.estudiante_id
                WHERE u.uuid = $1 AND u.role = 'estudiante'
                GROUP BY u.uuid, u.date_of_birth, u.gender, u.status
            )
            SELECT
                student_id,
                COALESCE(attendance_rate, 0) AS attendance_rate,
                COALESCE(avg_grade, 7.0) AS avg_grade,
                COALESCE(min_grade, 6.0) AS min_grade,
                COALESCE(max_grade, 8.0) AS max_grade,
                COALESCE(grade_stddev, 0) AS grade_stddev,
                COALESCE(login_count, 0) AS login_count,
                COALESCE(assignments_submitted, 0) AS assignments_submitted,
                EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) AS age,
                CASE WHEN gender = 'M' THEN 1 ELSE 0 END AS gender_male,
                CASE WHEN gender = 'F' THEN 1 ELSE 0 END AS gender_female
            FROM student_data
        `;
        const result = await pool.query(query, [studentId]);
        return result.rows[0] || null;
    }

    /**
     * Obtener tendencia de calificaciones por semana
     * @param {string} startDate
     * @param {string} endDate
     * @returns {Promise<Array>}
     */
    static async getGradesTrend(startDate = '2024-01-01', endDate = '2025-12-31') {
        const query = `
            SELECT
                DATE_TRUNC('week', fecha_evaluacion) AS date,
                AVG(calificacion) AS value
            FROM calificaciones
            WHERE fecha_evaluacion >= $1 AND fecha_evaluacion <= $2
                AND calificacion IS NOT NULL
            GROUP BY DATE_TRUNC('week', fecha_evaluacion)
            ORDER BY date ASC
        `;
        const result = await pool.query(query, [startDate, endDate]);
        return result.rows.map(row => ({
            date: row.date.toISOString().split('T')[0],
            value: parseFloat(row.value)
        }));
    }
}

module.exports = AnalyticsDAO;
