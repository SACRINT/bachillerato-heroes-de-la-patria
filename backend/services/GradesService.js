/**
 * 📊 GRADES SERVICE - v2.0.0
 * Refactorizado: 04 Diciembre 2025
 */

const GradesDAO = require('../data/grades.dao');
const devLogger = require('../utils/devLogger');

class ServiceError extends Error { constructor(message, statusCode = 500) { super(message); this.name = 'ServiceError'; this.statusCode = statusCode; } }

class GradesService {
  async getAll(options = {}) {
    try {
      const { rows, total } = await GradesDAO.getAll(options);
      return { success: true, data: rows.map(g => this._transformGrade(g)), total, pagination: { limit: options.limit || 100, offset: options.offset || 0 } };
    } catch (error) { devLogger.error('[GRADES] Error getAll:', error); throw new ServiceError('Error obteniendo calificaciones', 500); }
  }

  async getById(id) {
    try {
      const grade = await GradesDAO.getById(id);
      if (!grade) throw new ServiceError('Calificación no encontrada', 404);
      return { success: true, data: this._transformGrade(grade) };
    } catch (error) { devLogger.error('[GRADES] Error getById:', error); throw error; }
  }

  async getByStudent(estudianteId) {
    try {
      const grades = await GradesDAO.getByStudent(estudianteId);
      const grouped = {}; let sum = 0;
      grades.forEach(g => { if (!grouped[g.materia_nombre]) grouped[g.materia_nombre] = []; grouped[g.materia_nombre].push(g); sum += parseFloat(g.calificacion || 0); });
      return { success: true, data: { calificaciones: grades, porMateria: grouped, promedio: grades.length > 0 ? (sum / grades.length).toFixed(2) : null, total: grades.length } };
    } catch (error) { devLogger.error('[GRADES] Error getByStudent:', error); throw new ServiceError('Error obteniendo calificaciones del estudiante', 500); }
  }

  async create(data) {
    try {
      if (!data.estudianteId || !data.materiaId || data.calificacion === undefined) throw new ServiceError('Datos incompletos', 400);
      if (data.calificacion < 0 || data.calificacion > 10) throw new ServiceError('La calificación debe estar entre 0 y 10', 400);
      const grade = await GradesDAO.create(data);
      devLogger.log(`[GRADES] Calificación creada: ${grade.id}`);
      return { success: true, data: this._transformGrade(grade), message: 'Calificación registrada exitosamente' };
    } catch (error) { devLogger.error('[GRADES] Error create:', error); throw error; }
  }

  async update(id, data) {
    try {
      if (data.calificacion !== undefined && (data.calificacion < 0 || data.calificacion > 10)) throw new ServiceError('La calificación debe estar entre 0 y 10', 400);
      const grade = await GradesDAO.update(id, data);
      if (!grade) throw new ServiceError('Calificación no encontrada', 404);
      devLogger.log(`[GRADES] Calificación actualizada: ${id}`);
      return { success: true, data: this._transformGrade(grade), message: 'Calificación actualizada exitosamente' };
    } catch (error) { devLogger.error('[GRADES] Error update:', error); throw error; }
  }

  async delete(id) {
    try {
      const deleted = await GradesDAO.delete(id);
      if (!deleted) throw new ServiceError('Calificación no encontrada', 404);
      devLogger.log(`[GRADES] Calificación eliminada: ${id}`);
      return { success: true, message: 'Calificación eliminada exitosamente' };
    } catch (error) { devLogger.error('[GRADES] Error delete:', error); throw error; }
  }

  async getStats(options = {}) {
    try {
      const stats = await GradesDAO.getStats(options);
      return { success: true, data: { total: parseInt(stats.total), promedio: parseFloat(stats.promedio || 0).toFixed(2), minimo: parseFloat(stats.min || 0), maximo: parseFloat(stats.max || 0), desviacion: parseFloat(stats.desviacion || 0).toFixed(2) } };
    } catch (error) { devLogger.error('[GRADES] Error getStats:', error); throw new ServiceError('Error obteniendo estadísticas', 500); }
  }

  async bulkCreate(grades) {
    try {
      if (!Array.isArray(grades) || grades.length === 0) throw new ServiceError('Se requiere un array de calificaciones', 400);
      for (const g of grades) { if (!g.estudianteId || !g.materiaId || g.calificacion === undefined) throw new ServiceError('Datos incompletos en una o más calificaciones', 400); if (g.calificacion < 0 || g.calificacion > 10) throw new ServiceError('Calificación fuera de rango (0-10)', 400); }
      const results = await GradesDAO.bulkCreate(grades);
      devLogger.log(`[GRADES] Bulk create: ${results.length} calificaciones`);
      return { success: true, data: results.map(g => this._transformGrade(g)), count: results.length, message: `${results.length} calificaciones registradas exitosamente` };
    } catch (error) { devLogger.error('[GRADES] Error bulkCreate:', error); throw error; }
  }

  _transformGrade(grade) {
    return { id: grade.id, estudianteId: grade.estudiante_id, estudianteNombre: grade.estudiante_nombre ? `${grade.estudiante_nombre} ${grade.apellido_paterno || ''}`.trim() : null, materiaId: grade.materia_id, materiaNombre: grade.materia_nombre, calificacion: parseFloat(grade.calificacion), tipoEvaluacion: grade.tipo_evaluacion, periodoAcademico: grade.periodo_academico, observaciones: grade.observaciones, docenteId: grade.docente_id, createdAt: grade.created_at, updatedAt: grade.updated_at };
  }
}

module.exports = new GradesService();
module.exports.ServiceError = ServiceError;
