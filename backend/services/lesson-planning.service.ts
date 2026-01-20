/**
 * Lesson Planning Service
 * Sistema de planeación de clases para docentes
 */

import { executeQuery } from '../config/database';

export interface LessonPlan {
    id?: number;
    docente_id: number;
    materia_id: number;
    fecha: Date;
    unidad: string;
    tema: string;
    objetivos: string[];
    competencias: string[];
    contenido: string;
    actividades: any[];
    recursos: string[];
    evaluacion: string;
    tareas: string;
    observaciones?: string;
    status: 'borrador' | 'publicado' | 'archivado';
}

export interface Activity {
    tipo: 'inicio' | 'desarrollo' | 'cierre';
    descripcion: string;
    duracion: number; // minutos
    recursos_necesarios?: string[];
}

class LessonPlanningService {

    /**
     * Crear nueva planeación de clase
     */
    async createLessonPlan(data: LessonPlan): Promise<any> {
        const result = await executeQuery(`
            INSERT INTO planeaciones_clase (
                docente_id, materia_id, fecha, unidad, tema,
                objetivos, competencias, contenido, actividades,
                recursos, evaluacion, tareas, observaciones, status,
                created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP)
            RETURNING *
        `, [
            data.docente_id,
            data.materia_id,
            data.fecha,
            data.unidad,
            data.tema,
            JSON.stringify(data.objetivos),
            JSON.stringify(data.competencias),
            data.contenido,
            JSON.stringify(data.actividades),
            JSON.stringify(data.recursos),
            data.evaluacion,
            data.tareas,
            data.observaciones || null,
            data.status || 'borrador'
        ]) as any[];

        return result[0];
    }

    /**
     * Obtener planeaciones de un docente
     */
    async getTeacherLessonPlans(docenteId: number, filters?: {
        materia_id?: number;
        fecha_inicio?: Date;
        fecha_fin?: Date;
        status?: string;
    }): Promise<any[]> {
        let query = `
            SELECT 
                p.*,
                m.nombre as materia_nombre,
                m.grupo,
                m.semestre as grado
            FROM planeaciones_clase p
            JOIN materias m ON p.materia_id = m.id
            WHERE p.docente_id = $1
        `;
        const params: any[] = [docenteId];
        let paramIndex = 2;

        if (filters?.materia_id) {
            query += ` AND p.materia_id = $${paramIndex}`;
            params.push(filters.materia_id);
            paramIndex++;
        }

        if (filters?.fecha_inicio) {
            query += ` AND p.fecha >= $${paramIndex}`;
            params.push(filters.fecha_inicio);
            paramIndex++;
        }

        if (filters?.fecha_fin) {
            query += ` AND p.fecha <= $${paramIndex}`;
            params.push(filters.fecha_fin);
            paramIndex++;
        }

        if (filters?.status) {
            query += ` AND p.status = $${paramIndex}`;
            params.push(filters.status);
            paramIndex++;
        }

        query += ` ORDER BY p.fecha DESC`;

        return await executeQuery(query, params) as any[];
    }

    /**
     * Actualizar planeación
     */
    async updateLessonPlan(id: number, data: Partial<LessonPlan>): Promise<any> {
        const updates: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        const allowedFields = [
            'unidad', 'tema', 'objetivos', 'competencias', 'contenido',
            'actividades', 'recursos', 'evaluacion', 'tareas', 'observaciones', 'status'
        ];

        for (const field of allowedFields) {
            if (data[field as keyof LessonPlan] !== undefined) {
                updates.push(`${field} = $${paramIndex}`);

                // JSON fields
                if (['objetivos', 'competencias', 'actividades', 'recursos'].includes(field)) {
                    params.push(JSON.stringify(data[field as keyof LessonPlan]));
                } else {
                    params.push(data[field as keyof LessonPlan]);
                }
                paramIndex++;
            }
        }

        if (updates.length === 0) {
            throw new Error('No hay campos para actualizar');
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(id);

        const result = await executeQuery(`
            UPDATE planeaciones_clase
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `, params) as any[];

        return result[0];
    }

    /**
     * Eliminar planeación (soft delete)
     */
    async deleteLessonPlan(id: number): Promise<void> {
        await executeQuery(`
            UPDATE planeaciones_clase
            SET status = 'archivado', deleted_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `, [id]);
    }

    /**
     * Duplicar planeación para reutilizar
     */
    async duplicateLessonPlan(id: number, nuevaFecha: Date): Promise<any> {
        const original = await executeQuery(`
            SELECT * FROM planeaciones_clase WHERE id = $1
        `, [id]) as any[];

        if (!original || original.length === 0) {
            throw new Error('Planeación no encontrada');
        }

        const plan = original[0];

        return await this.createLessonPlan({
            docente_id: plan.docente_id,
            materia_id: plan.materia_id,
            fecha: nuevaFecha,
            unidad: plan.unidad,
            tema: plan.tema,
            objetivos: JSON.parse(plan.objetivos),
            competencias: JSON.parse(plan.competencias),
            contenido: plan.contenido,
            actividades: JSON.parse(plan.actividades),
            recursos: JSON.parse(plan.recursos),
            evaluacion: plan.evaluacion,
            tareas: plan.tareas,
            status: 'borrador'
        });
    }

    /**
     * Generar template de planeación basado en tema
     */
    async generateTemplate(tema: string, materia_id: number): Promise<Partial<LessonPlan>> {
        // Template básico que puede ser mejorado con IA
        return {
            tema,
            objetivos: [
                'Comprender los conceptos fundamentales del tema',
                'Aplicar el conocimiento en situaciones prácticas',
                'Desarrollar habilidades de pensamiento crítico'
            ],
            actividades: [
                {
                    tipo: 'inicio',
                    descripcion: 'Activación de conocimientos previos mediante preguntas detonadoras',
                    duracion: 10,
                    recursos_necesarios: ['Pizarrón', 'Marcadores']
                },
                {
                    tipo: 'desarrollo',
                    descripcion: 'Explicación del tema con ejemplos prácticos',
                    duracion: 30,
                    recursos_necesarios: ['Presentación', 'Material digital']
                },
                {
                    tipo: 'cierre',
                    descripcion: 'Conclusiones y resolución de dudas',
                    duracion: 10,
                    recursos_necesarios: []
                }
            ],
            recursos: ['Libro de texto', 'Material audiovisual', 'Plataforma digital'],
            evaluacion: 'Evaluación formativa mediante participación y ejercicios en clase',
            tareas: 'Ejercicios de reforzamiento del tema',
            status: 'borrador'
        };
    }

    /**
     * Obtener estadísticas de planeación
     */
    async getPlanningStats(docenteId: number): Promise<any> {
        const stats = await executeQuery(`
            SELECT 
                COUNT(*) as total_planeaciones,
                COUNT(CASE WHEN status = 'publicado' THEN 1 END) as publicadas,
                COUNT(CASE WHEN status = 'borrador' THEN 1 END) as borradores,
                COUNT(CASE WHEN fecha >= CURRENT_DATE THEN 1 END) as proximas,
                COUNT(CASE WHEN fecha < CURRENT_DATE AND status = 'publicado' THEN 1 END) as completadas
            FROM planeaciones_clase
            WHERE docente_id = $1 AND deleted_at IS NULL
        `, [docenteId]) as any[];

        return stats[0];
    }

    /**
     * Obtener planeaciones de la semana
     */
    async getWeeklyPlans(docenteId: number): Promise<any[]> {
        return await executeQuery(`
            SELECT 
                p.*,
                m.nombre as materia_nombre,
                m.grupo,
                m.semestre as grado,
                EXTRACT(DOW FROM p.fecha) as dia_semana
            FROM planeaciones_clase p
            JOIN materias m ON p.materia_id = m.id
            WHERE p.docente_id = $1
            AND p.fecha >= DATE_TRUNC('week', CURRENT_DATE)
            AND p.fecha < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days'
            AND p.deleted_at IS NULL
            ORDER BY p.fecha, m.nombre
        `, [docenteId]) as any[];
    }
}

export default new LessonPlanningService();
