/**
 * 🧮 PRACTICE PROBLEMS SERVICE
 * Propósito: Generación infinita de problemas y evaluación (Fase 5 - Semana 35)
 */

const { executeQuery } = require('../config/database');

class PracticeProblemsService {

    // --- GENERATION ENGINE ---

    async generateProblem(topic, difficulty = 1) {
        // 1. Obtener una plantilla aleatoria del tema y nivel
        const templates = await executeQuery(
            'SELECT * FROM problem_templates WHERE topic = $1 AND difficulty_level = $2 ORDER BY RANDOM() LIMIT 1',
            [topic, difficulty]
        );

        if (templates.length === 0) throw new Error('No hay plantillas disponibles para este tema');
        const template = templates[0];

        // 2. Generar variables aleatorias
        const variables = this._generateVariables(template.variable_ranges_json);

        // 3. Renderizar enunciado
        let statement = template.statement_template;
        for (const [key, value] of Object.entries(variables)) {
            statement = statement.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }

        // 4. Calcular respuesta correcta
        const correctAnswer = this._calculateAnswer(template.solution_logic_json, variables);

        // 5. Persistir instancia generada
        const insertQuery = `
            INSERT INTO generated_problems (template_id, variables_json, statement_rendered, correct_answer)
            VALUES ($1, $2, $3, $4)
            RETURNING id, statement_rendered, variables_json
        `;
        const result = await executeQuery(insertQuery, [template.id, JSON.stringify(variables), statement, correctAnswer]);

        return {
            id: result[0].id,
            statement: result[0].statement_rendered,
            hintSteps: template.hint_steps_json ? template.hint_steps_json.length : 0
        };
    }

    _generateVariables(ranges) {
        const vars = {};
        for (const [key, config] of Object.entries(ranges)) {
            const min = config.min;
            const max = config.max;
            vars[key] = Math.floor(Math.random() * (max - min + 1)) + min;
        }
        return vars;
    }

    _calculateAnswer(logic, variables) {
        // EVALUACIÓN SEGURA: Usamos Function constructor restringido o mathjs en producción.
        // Por simplicidad en este prototipo, parseamos fórmulas simples.
        try {
            const formula = logic.formula; // e.g., "a + b"
            // Reemplazar vars en formula
            let expression = formula;
            for (const [key, value] of Object.entries(variables)) {
                expression = expression.replace(new RegExp(`${key}`, 'g'), value);
            }
            // eslint-disable-next-line no-eval
            return eval(expression).toString();
        } catch (e) {
            console.error('Error calculando respuesta', e);
            return "0";
        }
    }

    // --- SUBMISSION & MASTERY ---

    async submitAnswer(userId, problemId, userAnswer, timeSpent) {
        // 1. Obtener problema original
        const problemRes = await executeQuery('SELECT * FROM generated_problems WHERE id = $1', [problemId]);
        if (problemRes.length === 0) throw new Error('Problema no encontrado');
        const problem = problemRes[0];

        // 2. Verificar respuesta (Normalización básica)
        const isCorrect = problem.correct_answer.trim() === userAnswer.trim();

        // 3. Registrar intento
        await executeQuery(
            `INSERT INTO problem_attempts (user_id, problem_id, user_answer, is_correct, time_spent_seconds)
             VALUES ($1, $2, $3, $4, $5)`,
            [userId, problemId, userAnswer, isCorrect, timeSpent]
        );

        // 4. Actualizar Mastery (Simplificado)
        if (isCorrect) {
            await this._updateMastery(userId, problem.template_id);
        }

        return {
            correct: isCorrect,
            correctAnswer: problem.correct_answer,
            feedback: isCorrect ? '¡Excelente trabajo!' : 'Inténtalo de nuevo'
        };
    }

    async _updateMastery(userId, templateId) {
        // Obtener topic del template
        const tpl = await executeQuery('SELECT topic FROM problem_templates WHERE id = $1', [templateId]);
        const topic = tpl[0].topic;

        // Incrementar score
        const query = `
            INSERT INTO topic_mastery (user_id, topic, mastery_score, problems_solved)
            VALUES ($1, $2, 5, 1)
            ON CONFLICT (user_id, topic)
            DO UPDATE SET 
                mastery_score = LEAST(100, topic_mastery.mastery_score + 5),
                problems_solved = topic_mastery.problems_solved + 1,
                last_practiced_at = CURRENT_TIMESTAMP
        `;
        await executeQuery(query, [userId, topic]);
    }
}

module.exports = new PracticeProblemsService();
