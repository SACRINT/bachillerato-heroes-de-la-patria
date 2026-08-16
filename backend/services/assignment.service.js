"use strict";
/**
 * Assignment Service
 * Sistema de asignación de tareas y trabajos
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require('../config/database.js');
class AssignmentService {
    /**
     * Crear nueva tarea
     */
    async createAssignment(data) {
        const result = await (0, database_1.executeQuery)(`
            INSERT INTO tareas (
                docente_id, materia_id, titulo, descripcion, tipo,
                fecha_asignacion, fecha_entrega, puntaje_maximo,
                criterios_evaluacion, archivos_adjuntos, instrucciones_especiales,
                permite_entrega_tardia, penalizacion_tardia, status,
                created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP)
            RETURNING *
        `, [
            data.docente_id,
            data.materia_id,
            data.titulo,
            data.descripcion,
            data.tipo,
            data.fecha_asignacion,
            data.fecha_entrega,
            data.puntaje_maximo,
            JSON.stringify(data.criterios_evaluacion || {}),
            JSON.stringify(data.archivos_adjuntos || []),
            data.instrucciones_especiales,
            data.permite_entrega_tardia !== false,
            data.penalizacion_tardia || 0,
            data.status || 'borrador'
        ]);
        // Si la tarea se publica, crear registros para todos los estudiantes
        if (result[0].status === 'publicado') {
            await this.assignToStudents(result[0].id, data.materia_id);
        }
        return result[0];
    }
    /**
     * Asignar tarea a todos los estudiantes de la materia
     */
    async assignToStudents(tareaId, materiaId) {
        await (0, database_1.executeQuery)(`
            INSERT INTO entregas_tareas (tarea_id, estudiante_id, status, created_at)
            SELECT $1, im.estudiante_id, 'pendiente', CURRENT_TIMESTAMP
            FROM inscripciones_materias im
            WHERE im.materia_id = $2 AND im.status = 'activo'
            ON CONFLICT DO NOTHING
        `, [tareaId, materiaId]);
    }
    /**
     * Obtener tareas de un docente
     */
    async getTeacherAssignments(docenteId, filters) {
        let query = `
            SELECT 
                t.*,
                m.nombre as materia_nombre,
                m.grupo,
                m.semestre as grado,
                (SELECT COUNT(*) FROM entregas_tareas et WHERE et.tarea_id = t.id) as total_estudiantes,
                (SELECT COUNT(*) FROM entregas_tareas et WHERE et.tarea_id = t.id AND et.status = 'entregado') as entregas_recibidas,
                (SELECT COUNT(*) FROM entregas_tareas et WHERE et.tarea_id = t.id AND et.status = 'calificado') as entregas_calificadas
            FROM tareas t
            JOIN materias m ON t.materia_id = m.id
            WHERE t.docente_id = $1 AND t.deleted_at IS NULL
        `;
        const params = [docenteId];
        let paramIndex = 2;
        if (filters === null || filters === void 0 ? void 0 : filters.materia_id) {
            query += ` AND t.materia_id = $${paramIndex}`;
            params.push(filters.materia_id);
            paramIndex++;
        }
        if (filters === null || filters === void 0 ? void 0 : filters.tipo) {
            query += ` AND t.tipo = $${paramIndex}`;
            params.push(filters.tipo);
            paramIndex++;
        }
        if (filters === null || filters === void 0 ? void 0 : filters.status) {
            query += ` AND t.status = $${paramIndex}`;
            params.push(filters.status);
            paramIndex++;
        }
        query += ` ORDER BY t.fecha_entrega DESC`;
        return await (0, database_1.executeQuery)(query, params);
    }
    /**
     * Obtener entregas de una tarea
     */
    async getAssignmentSubmissions(tareaId) {
        return await (0, database_1.executeQuery)(`
            SELECT 
                et.*,
                e.nombre || ' ' || e.apellido_paterno as estudiante_nombre,
                e.matricula,
                e.foto_url,
                CASE 
                    WHEN et.fecha_entrega > t.fecha_entrega THEN true
                    ELSE false
                END as entrega_tardia
            FROM entregas_tareas et
            JOIN estudiantes e ON et.estudiante_id = e.id
            JOIN tareas t ON et.tarea_id = t.id
            WHERE et.tarea_id = $1
            ORDER BY et.fecha_entrega DESC NULLS LAST, e.apellido_paterno
        `, [tareaId]);
    }
    /**
     * Calificar entrega
     */
    async gradeSubmission(entregaId, calificacion, retroalimentacion) {
        const result = await (0, database_1.executeQuery)(`
            UPDATE entregas_tareas
            SET 
                calificacion = $1,
                retroalimentacion = $2,
                status = 'calificado',
                fecha_calificacion = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *
        `, [calificacion, retroalimentacion, entregaId]);
        return result[0];
    }
    /**
     * Calificación masiva (mismo puntaje a varios)
     */
    async bulkGrade(entregaIds, calificacion, retroalimentacion) {
        const result = await (0, database_1.executeQuery)(`
            UPDATE entregas_tareas
            SET 
                calificacion = $1,
                retroalimentacion = $2,
                status = 'calificado',
                fecha_calificacion = CURRENT_TIMESTAMP
            WHERE id = ANY($3::int[])
        `, [calificacion, retroalimentacion, entregaIds]);
        return result.rowCount || 0;
    }
    /**
     * Actualizar tarea
     */
    async updateAssignment(id, data) {
        const updates = [];
        const params = [];
        let paramIndex = 1;
        const allowedFields = [
            'titulo', 'descripcion', 'tipo', 'fecha_entrega',
            'puntaje_maximo', 'criterios_evaluacion', 'archivos_adjuntos',
            'instrucciones_especiales', 'permite_entrega_tardia',
            'penalizacion_tardia', 'status'
        ];
        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                updates.push(`${field} = $${paramIndex}`);
                // JSON fields
                if (['criterios_evaluacion', 'archivos_adjuntos'].includes(field)) {
                    params.push(JSON.stringify(data[field]));
                }
                else {
                    params.push(data[field]);
                }
                paramIndex++;
            }
        }
        if (updates.length === 0) {
            throw new Error('No hay campos para actualizar');
        }
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(id);
        const result = await (0, database_1.executeQuery)(`
            UPDATE tareas
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `, params);
        return result[0];
    }
    /**
     * Publicar tarea (cambia de borrador a publicado y asigna a estudiantes)
     */
    async publishAssignment(id) {
        const tarea = await (0, database_1.executeQuery)(`
            SELECT * FROM tareas WHERE id = $1
        `, [id]);
        if (!tarea || tarea.length === 0) {
            throw new Error('Tarea no encontrada');
        }
        const result = await this.updateAssignment(id, { status: 'publicado' });
        await this.assignToStudents(id, tarea[0].materia_id);
        return result;
    }
    /**
     * Cerrar tarea (no se permiten más entregas)
     */
    async closeAssignment(id) {
        return await this.updateAssignment(id, { status: 'cerrado' });
    }
    /**
     * Eliminar tarea (soft delete)
     */
    async deleteAssignment(id) {
        await (0, database_1.executeQuery)(`
            UPDATE tareas
            SET status = 'cancelado', deleted_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `, [id]);
    }
    /**
     * Obtener estadísticas de tareas
     */
    async getAssignmentStats(docenteId) {
        const stats = await (0, database_1.executeQuery)(`
            SELECT 
                COUNT(*) as total_tareas,
                COUNT(CASE WHEN status = 'publicado' THEN 1 END) as activas,
                COUNT(CASE WHEN status = 'borrador' THEN 1 END) as borradores,
                COUNT(CASE WHEN fecha_entrega < CURRENT_DATE AND status = 'publicado' THEN 1 END) as vencidas,
                COALESCE(SUM((
                    SELECT COUNT(*) 
                    FROM entregas_tareas et 
                    WHERE et.tarea_id = tareas.id AND et.status = 'pendiente'
                )), 0) as entregas_pendientes
            FROM tareas
            WHERE docente_id = $1 AND deleted_at IS NULL
        `, [docenteId]);
        return stats[0];
    }
    /**
     * Obtener tareas próximas a vencer
     */
    async getUpcomingDeadlines(docenteId, dias = 7) {
        return await (0, database_1.executeQuery)(`
            SELECT 
                t.*,
                m.nombre as materia_nombre,
                m.grupo,
                (SELECT COUNT(*) FROM entregas_tareas et WHERE et.tarea_id = t.id AND et.status = 'pendiente') as entregas_pendientes
            FROM tareas t
            JOIN materias m ON t.materia_id = m.id
            WHERE t.docente_id = $1
            AND t.status = 'publicado'
            AND t.fecha_entrega BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${dias} days'
            AND t.deleted_at IS NULL
            ORDER BY t.fecha_entrega ASC
        `, [docenteId]);
    }
    /**
     * Enviar recordatorio a estudiantes con tarea pendiente
     */
    async sendReminders(tareaId) {
        const pendingStudents = await (0, database_1.executeQuery)(`
            SELECT 
                e.id,
                e.nombre || ' ' || e.apellido_paterno as nombre_completo,
                u.email,
                t.titulo as tarea_titulo,
                t.fecha_entrega
            FROM entregas_tareas et
            JOIN estudiantes e ON et.estudiante_id = e.id
            JOIN usuarios u ON e.usuario_id = u.id
            JOIN tareas t ON et.tarea_id = t.id
            WHERE et.tarea_id = $1 AND et.status = 'pendiente'
        `, [tareaId]);
        // TODO: Implementar envío real de emails con EmailService
        // Por ahora, crear notificaciones internas
        for (const student of pendingStudents) {
            await (0, database_1.executeQuery)(`
                INSERT INTO notificaciones (
                    usuario_email, tipo, titulo, mensaje, prioridad, created_at
                ) VALUES ($1, 'recordatorio_tarea', $2, $3, 'media', CURRENT_TIMESTAMP)
            `, [
                student.email,
                `Recordatorio: ${student.tarea_titulo}`,
                `Tienes una tarea pendiente de entrega. Fecha límite: ${new Date(student.fecha_entrega).toLocaleDateString('es-MX')}`
            ]);
        }
        return pendingStudents.length;
    }
}
exports.default = new AssignmentService();
