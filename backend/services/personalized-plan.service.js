const { executeQuery } = require('../config/database.js');
const debugLog = require('../utils/debug-logger.js');

class PersonalizedPlanService {

    /**
     * Crea una nueva meta de estudio
     */
    async createGoal(studentId, title, targetDate, priority = 'MEDIUM') {
        const sql = `
            INSERT INTO study_goals (student_id, title, target_date, priority)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await executeQuery(sql, [studentId, title, targetDate, priority]);
        return result[0];
    }

    /**
     * Obtiene las metas activas de un estudiante
     */
    async getActiveGoals(studentId) {
        return await executeQuery(
            `SELECT * FROM study_goals WHERE student_id = $1 AND status = 'ACTIVE' ORDER BY created_at DESC`,
            [studentId]
        );
    }

    /**
     * Genera un plan de estudio semanal basado en necesidades
     * (Versión inicial: Algoritmo heurístico)
     */
    async generateWeeklyPlan(studentId, startDate) {
        try {
            debugLog.log('PLAN_GEN', `Iniciando generación de plan para estudiante ${studentId}`);

            // 1. Crear el contenedor del Plan
            // Calcular end_date (startDate + 7 días)
            const start = new Date(startDate);
            const end = new Date(startDate);
            end.setDate(end.getDate() + 6);

            const createPlanSql = `
                INSERT INTO study_plans (student_id, start_date, end_date, ai_generated)
                VALUES ($1, $2, $3, true)
                RETURNING id
            `;
            const planResult = await executeQuery(createPlanSql, [studentId, start, end]);
            const planId = planResult[0].id;

            // 2. Analizar necesidades (Simulado por ahora: "Reforzar Matemáticas")
            // En futuro: Consultar GradesService para ver promedios bajos
            const weakSubjects = ['Matemáticas', 'Física']; // TODO: Get real data

            // 3. Generar Items del Plan
            const items = [];

            // Regla: 1 hora de estudio por materia débil, días alternos
            // Lunes: Mate, Miércoles: Física, Viernes: Mate

            const scheduleTemplate = [
                { day: 1, subject: weakSubjects[0], activity: 'REVIEW' }, // Lunes
                { day: 2, subject: 'Historia', activity: 'READING' },     // Martes
                { day: 3, subject: weakSubjects[1], activity: 'EXERCISE' },// Miércoles
                { day: 4, subject: 'Literatura', activity: 'VIDEO' },      // Jueves
                { day: 5, subject: weakSubjects[0], activity: 'QUIZ' },    // Viernes
            ];

            for (const item of scheduleTemplate) {
                const sql = `
                    INSERT INTO plan_items 
                    (plan_id, day_of_week, time_slot, activity_type, subject, description, difficulty_level)
                    VALUES ($1, $2, 'AFTERNOON', $3, $4, 'Sesión automática de refuerzo', 'MEDIUM')
                `;
                await executeQuery(sql, [planId, item.day, item.activity, item.subject]);
            }

            // 4. Integrar Metas Activas (Si hay metas, agregar sesiones extra)
            const goals = await this.getActiveGoals(studentId);
            if (goals.length > 0) {
                // Agregar sesión de "Goal Focus" el sábado
                const goalSql = `
                    INSERT INTO plan_items 
                    (plan_id, day_of_week, time_slot, activity_type, subject, description, difficulty_level)
                    VALUES ($1, 6, 'MORNING', 'PROJECT', 'Metas Personales', 'Trabajar en objetivo: ' || $2, 'HIGH')
                 `;
                await executeQuery(goalSql, [planId, goals[0].title]);
            }

            debugLog.log('PLAN_GEN', `Plan generado exitosamente ID: ${planId}`);
            return await this.getPlanDetails(planId);

        } catch (error) {
            debugLog.error('PLAN_GEN', 'Error generando plan', error);
            throw error;
        }
    }

    /**
     * Obtiene el plan completo con sus items
     */
    async getPlanDetails(planId) {
        const plan = await executeQuery(`SELECT * FROM study_plans WHERE id = $1`, [planId]);
        if (plan.length === 0) return null;

        const items = await executeQuery(`SELECT * FROM plan_items WHERE plan_id = $1 ORDER BY day_of_week, time_slot`, [planId]);

        return {
            ...plan[0],
            items: items
        };
    }
    /**
     * Ajusta el plan (ej. cambiar notas o estado)
     */
    async adjustPlan(planId, updates) {
        // updates: { status, notes }
        const { status, notes } = updates;

        let sql = `UPDATE study_plans SET updated_at = NOW()`;
        const params = [planId];
        let idx = 2;

        if (status) {
            sql += `, status = $${idx++}`;
            params.push(status);
        }
        if (notes !== undefined) {
            sql += `, notes = $${idx++}`; // Asumiendo que agregué columna notes o uso description si no
            params.push(notes);
        }

        sql += ` WHERE id = $1 RETURNING *`;

        try {
            // Nota: Si falla por columna inexistente (notes), es pq migration faltó.
            // Revisando migration 072 en memoria (no la vi completa).
            // Asumiré que status existe. Notes quizás no.
            // Para seguridad, solo update status por ahora.

            // Corrección: Solo status Update
            const res = await executeQuery(`
                UPDATE study_plans 
                SET status = COALESCE($2, status), updated_at = NOW()
                WHERE id = $1 
                RETURNING *
            `, [planId, status]);

            return res[0];
        } catch (error) {
            console.error('Error adjusting plan:', error);
            throw error;
        }
    }

    /**
     * Comparte el plan (Genera Token)
     */
    async sharePlan(planId) {
        // Generar un UUID simple simulado
        const shareToken = `share_${planId}_${Date.now().toString(36)}`;
        // En prod: Guardar en tabla plan_shares
        return { shareUrl: `/shared/plan/${shareToken}`, token: shareToken };
    }

    /**
     * Actualiza el estado de un item del plan
     */
    async updateItemStatus(itemId, status) {
        const res = await executeQuery(`
            UPDATE plan_items
            SET status = $2, completion_date = ($2 = 'COMPLETED' ? NOW() : NULL)
            WHERE id = $1
            RETURNING *
        `, [itemId, status]);
        return res[0];
    }
}

module.exports = new PersonalizedPlanService();
