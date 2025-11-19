/**
 * 📊 GRADES SERVICE - v1.0.0
 * Capa de servicios para gestión de calificaciones
 *
 * SEMANA 2 - Plan 24 Semanas
 * Fecha: 19 Noviembre 2025
 *
 * Features:
 * - CRUD de calificaciones
 * - Cálculo de promedios
 * - Reportes por estudiante/grupo
 * - Historial académico
 * - Validaciones de rango
 */

const { pool } = require('../config/database');
const devLogger = require('../utils/devLogger');

/**
 * Clase de error personalizada para servicios
 */
class ServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'ServiceError';
    this.statusCode = statusCode;
  }
}

class GradesService {

  /**
   * Obtener calificaciones con filtros
   * @param {Object} options - Filtros
   * @returns {Promise<Object>} Calificaciones y metadata
   */
  async getAll(options = {}) {
    const {
      estudianteId,
      docenteId,
      materia,
      parcial,
      ciclo,
      page = 1,
      limit = 50
    } = options;

    devLogger.log('[GradesService] Obteniendo calificaciones');

    try {
      let query = `
        SELECT
          c.id, c.estudiante_id, c.docente_id, c.materia,
          c.parcial, c.calificacion, c.observaciones, c.ciclo,
          c.created_at, c.updated_at,
          e.nombre as estudiante_nombre,
          e.apellido_paterno as estudiante_apellido,
          e.matricula
        FROM calificaciones c
        LEFT JOIN estudiantes e ON c.estudiante_id = e.id
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 1;

      if (estudianteId) {
        query += ` AND c.estudiante_id = $${paramCount}`;
        params.push(estudianteId);
        paramCount++;
      }

      if (docenteId) {
        query += ` AND c.docente_id = $${paramCount}`;
        params.push(docenteId);
        paramCount++;
      }

      if (materia) {
        query += ` AND c.materia ILIKE $${paramCount}`;
        params.push(`%${materia}%`);
        paramCount++;
      }

      if (parcial) {
        query += ` AND c.parcial = $${paramCount}`;
        params.push(parcial);
        paramCount++;
      }

      if (ciclo) {
        query += ` AND c.ciclo = $${paramCount}`;
        params.push(ciclo);
        paramCount++;
      }

      // Count
      const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) FROM');
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count, 10);

      // Paginate
      query += ` ORDER BY c.created_at DESC`;
      query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      params.push(limit, (page - 1) * limit);

      const result = await pool.query(query, params);

      return {
        success: true,
        data: result.rows.map(g => this._transformGrade(g)),
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      devLogger.error('[GradesService] Error en getAll:', error.message);
      throw new ServiceError('Error al obtener calificaciones', 500);
    }
  }

  /**
   * Obtener calificación por ID
   * @param {number} id - ID de la calificación
   * @returns {Promise<Object>} Calificación
   */
  async getById(id) {
    if (!id || isNaN(id)) {
      throw new ServiceError('ID inválido', 400);
    }

    devLogger.log(`[GradesService] Obteniendo calificación ID: ${id}`);

    try {
      const result = await pool.query(`
        SELECT c.*, e.nombre as estudiante_nombre, e.apellido_paterno, e.matricula
        FROM calificaciones c
        LEFT JOIN estudiantes e ON c.estudiante_id = e.id
        WHERE c.id = $1
      `, [id]);

      if (result.rows.length === 0) {
        throw new ServiceError('Calificación no encontrada', 404);
      }

      return {
        success: true,
        data: this._transformGrade(result.rows[0])
      };
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      devLogger.error('[GradesService] Error en getById:', error.message);
      throw new ServiceError('Error al obtener calificación', 500);
    }
  }

  /**
   * Obtener calificaciones de un estudiante
   * @param {number} estudianteId - ID del estudiante
   * @returns {Promise<Object>} Calificaciones del estudiante
   */
  async getByStudent(estudianteId) {
    if (!estudianteId || isNaN(estudianteId)) {
      throw new ServiceError('ID de estudiante inválido', 400);
    }

    devLogger.log(`[GradesService] Calificaciones del estudiante: ${estudianteId}`);

    try {
      const result = await pool.query(`
        SELECT c.*, e.nombre, e.apellido_paterno, e.matricula
        FROM calificaciones c
        LEFT JOIN estudiantes e ON c.estudiante_id = e.id
        WHERE c.estudiante_id = $1
        ORDER BY c.materia, c.parcial
      `, [estudianteId]);

      // Calcular promedios por materia
      const byMateria = {};
      result.rows.forEach(g => {
        if (!byMateria[g.materia]) {
          byMateria[g.materia] = { grades: [], sum: 0, count: 0 };
        }
        byMateria[g.materia].grades.push(g);
        byMateria[g.materia].sum += parseFloat(g.calificacion || 0);
        byMateria[g.materia].count++;
      });

      const promediosPorMateria = Object.entries(byMateria).map(([materia, data]) => ({
        materia,
        promedio: (data.sum / data.count).toFixed(2),
        calificaciones: data.grades.map(g => this._transformGrade(g))
      }));

      // Promedio general
      const allGrades = result.rows.map(g => parseFloat(g.calificacion || 0));
      const promedioGeneral = allGrades.length > 0
        ? (allGrades.reduce((a, b) => a + b, 0) / allGrades.length).toFixed(2)
        : '0.00';

      return {
        success: true,
        data: {
          estudianteId,
          promedioGeneral,
          totalCalificaciones: result.rows.length,
          porMateria: promediosPorMateria
        }
      };
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      devLogger.error('[GradesService] Error en getByStudent:', error.message);
      throw new ServiceError('Error al obtener calificaciones', 500);
    }
  }

  /**
   * Crear nueva calificación
   * @param {Object} data - Datos de la calificación
   * @returns {Promise<Object>} Calificación creada
   */
  async create(data) {
    const { estudiante_id, docente_id, materia, parcial, calificacion, observaciones, ciclo } = data;

    // Validaciones
    if (!estudiante_id) {
      throw new ServiceError('ID de estudiante requerido', 400);
    }
    if (!materia) {
      throw new ServiceError('Materia requerida', 400);
    }
    if (calificacion === undefined || calificacion === null) {
      throw new ServiceError('Calificación requerida', 400);
    }

    // Validar rango de calificación (0-10)
    const cal = parseFloat(calificacion);
    if (isNaN(cal) || cal < 0 || cal > 10) {
      throw new ServiceError('Calificación debe estar entre 0 y 10', 400);
    }

    devLogger.log('[GradesService] Creando calificación');

    try {
      // Verificar si ya existe calificación para mismo estudiante/materia/parcial
      const existing = await pool.query(`
        SELECT id FROM calificaciones
        WHERE estudiante_id = $1 AND materia = $2 AND parcial = $3 AND ciclo = $4
      `, [estudiante_id, materia, parcial || 1, ciclo || 'actual']);

      if (existing.rows.length > 0) {
        throw new ServiceError('Ya existe una calificación para esta materia/parcial', 409);
      }

      const result = await pool.query(`
        INSERT INTO calificaciones
        (estudiante_id, docente_id, materia, parcial, calificacion, observaciones, ciclo, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *
      `, [estudiante_id, docente_id, materia, parcial || 1, cal, observaciones, ciclo || 'actual']);

      devLogger.log(`[GradesService] Calificación creada ID: ${result.rows[0].id}`);

      return {
        success: true,
        data: this._transformGrade(result.rows[0]),
        message: 'Calificación registrada exitosamente'
      };
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      devLogger.error('[GradesService] Error en create:', error.message);
      throw new ServiceError('Error al crear calificación', 500);
    }
  }

  /**
   * Actualizar calificación
   * @param {number} id - ID de la calificación
   * @param {Object} data - Datos a actualizar
   * @returns {Promise<Object>} Calificación actualizada
   */
  async update(id, data) {
    if (!id || isNaN(id)) {
      throw new ServiceError('ID inválido', 400);
    }

    // Verificar que existe
    const existing = await pool.query('SELECT id FROM calificaciones WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      throw new ServiceError('Calificación no encontrada', 404);
    }

    // Validar calificación si se actualiza
    if (data.calificacion !== undefined) {
      const cal = parseFloat(data.calificacion);
      if (isNaN(cal) || cal < 0 || cal > 10) {
        throw new ServiceError('Calificación debe estar entre 0 y 10', 400);
      }
      data.calificacion = cal;
    }

    devLogger.log(`[GradesService] Actualizando calificación ID: ${id}`);

    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && ['calificacion', 'observaciones', 'materia', 'parcial'].includes(key)) {
          fields.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      });

      fields.push(`updated_at = NOW()`);
      values.push(id);

      const result = await pool.query(`
        UPDATE calificaciones
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `, values);

      return {
        success: true,
        data: this._transformGrade(result.rows[0]),
        message: 'Calificación actualizada exitosamente'
      };
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      devLogger.error('[GradesService] Error en update:', error.message);
      throw new ServiceError('Error al actualizar calificación', 500);
    }
  }

  /**
   * Eliminar calificación
   * @param {number} id - ID de la calificación
   * @returns {Promise<Object>} Resultado
   */
  async delete(id) {
    if (!id || isNaN(id)) {
      throw new ServiceError('ID inválido', 400);
    }

    const existing = await pool.query('SELECT id FROM calificaciones WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      throw new ServiceError('Calificación no encontrada', 404);
    }

    devLogger.log(`[GradesService] Eliminando calificación ID: ${id}`);

    try {
      await pool.query('DELETE FROM calificaciones WHERE id = $1', [id]);

      return {
        success: true,
        message: 'Calificación eliminada exitosamente'
      };
    } catch (error) {
      devLogger.error('[GradesService] Error en delete:', error.message);
      throw new ServiceError('Error al eliminar calificación', 500);
    }
  }

  /**
   * Obtener estadísticas de calificaciones
   * @param {Object} options - Filtros opcionales
   * @returns {Promise<Object>} Estadísticas
   */
  async getStats(options = {}) {
    const { ciclo, materia } = options;

    devLogger.log('[GradesService] Obteniendo estadísticas');

    try {
      let whereClause = '1=1';
      const params = [];
      let paramCount = 1;

      if (ciclo) {
        whereClause += ` AND ciclo = $${paramCount}`;
        params.push(ciclo);
        paramCount++;
      }

      if (materia) {
        whereClause += ` AND materia = $${paramCount}`;
        params.push(materia);
        paramCount++;
      }

      const stats = await pool.query(`
        SELECT
          COUNT(*) as total,
          AVG(calificacion) as promedio,
          MIN(calificacion) as minima,
          MAX(calificacion) as maxima,
          COUNT(*) FILTER (WHERE calificacion >= 6) as aprobados,
          COUNT(*) FILTER (WHERE calificacion < 6) as reprobados
        FROM calificaciones
        WHERE ${whereClause}
      `, params);

      const byMateria = await pool.query(`
        SELECT materia, AVG(calificacion) as promedio, COUNT(*) as total
        FROM calificaciones
        WHERE ${whereClause}
        GROUP BY materia
        ORDER BY promedio DESC
      `, params);

      const distribution = await pool.query(`
        SELECT
          CASE
            WHEN calificacion >= 9 THEN 'Excelente (9-10)'
            WHEN calificacion >= 8 THEN 'Muy Bien (8-9)'
            WHEN calificacion >= 7 THEN 'Bien (7-8)'
            WHEN calificacion >= 6 THEN 'Suficiente (6-7)'
            ELSE 'Insuficiente (0-6)'
          END as rango,
          COUNT(*) as total
        FROM calificaciones
        WHERE ${whereClause}
        GROUP BY rango
        ORDER BY rango
      `, params);

      return {
        success: true,
        data: {
          general: {
            total: parseInt(stats.rows[0].total, 10),
            promedio: parseFloat(stats.rows[0].promedio || 0).toFixed(2),
            minima: parseFloat(stats.rows[0].minima || 0).toFixed(2),
            maxima: parseFloat(stats.rows[0].maxima || 0).toFixed(2),
            aprobados: parseInt(stats.rows[0].aprobados, 10),
            reprobados: parseInt(stats.rows[0].reprobados, 10),
            tasaAprobacion: stats.rows[0].total > 0
              ? ((stats.rows[0].aprobados / stats.rows[0].total) * 100).toFixed(1)
              : '0.0'
          },
          porMateria: byMateria.rows.map(m => ({
            materia: m.materia,
            promedio: parseFloat(m.promedio || 0).toFixed(2),
            total: parseInt(m.total, 10)
          })),
          distribucion: distribution.rows
        }
      };
    } catch (error) {
      devLogger.error('[GradesService] Error en getStats:', error.message);
      throw new ServiceError('Error al obtener estadísticas', 500);
    }
  }

  /**
   * Registrar calificaciones en lote
   * @param {Array} grades - Array de calificaciones
   * @returns {Promise<Object>} Resultado
   */
  async bulkCreate(grades) {
    if (!Array.isArray(grades) || grades.length === 0) {
      throw new ServiceError('Se requiere un array de calificaciones', 400);
    }

    devLogger.log(`[GradesService] Registrando ${grades.length} calificaciones en lote`);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const created = [];
      const errors = [];

      for (const grade of grades) {
        try {
          const cal = parseFloat(grade.calificacion);
          if (isNaN(cal) || cal < 0 || cal > 10) {
            errors.push({ grade, error: 'Calificación fuera de rango' });
            continue;
          }

          const result = await client.query(`
            INSERT INTO calificaciones
            (estudiante_id, docente_id, materia, parcial, calificacion, observaciones, ciclo, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            ON CONFLICT (estudiante_id, materia, parcial, ciclo) DO UPDATE
            SET calificacion = EXCLUDED.calificacion, updated_at = NOW()
            RETURNING *
          `, [
            grade.estudiante_id,
            grade.docente_id,
            grade.materia,
            grade.parcial || 1,
            cal,
            grade.observaciones,
            grade.ciclo || 'actual'
          ]);

          created.push(result.rows[0]);
        } catch (err) {
          errors.push({ grade, error: err.message });
        }
      }

      await client.query('COMMIT');

      return {
        success: true,
        data: {
          created: created.length,
          errors: errors.length,
          errorDetails: errors
        },
        message: `${created.length} calificaciones registradas, ${errors.length} errores`
      };
    } catch (error) {
      await client.query('ROLLBACK');
      devLogger.error('[GradesService] Error en bulkCreate:', error.message);
      throw new ServiceError('Error al registrar calificaciones', 500);
    } finally {
      client.release();
    }
  }

  /**
   * Transformar datos de calificación
   * @private
   */
  _transformGrade(grade) {
    if (!grade) return null;

    return {
      id: grade.id,
      estudianteId: grade.estudiante_id,
      estudianteNombre: grade.estudiante_nombre
        ? `${grade.estudiante_nombre} ${grade.apellido_paterno || ''}`.trim()
        : null,
      matricula: grade.matricula,
      docenteId: grade.docente_id,
      materia: grade.materia,
      parcial: grade.parcial,
      calificacion: parseFloat(grade.calificacion || 0).toFixed(2),
      observaciones: grade.observaciones,
      ciclo: grade.ciclo,
      createdAt: grade.created_at,
      updatedAt: grade.updated_at
    };
  }
}

module.exports = new GradesService();
module.exports.ServiceError = ServiceError;
