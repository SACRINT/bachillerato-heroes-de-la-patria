/**
 * 📝 ASSESSMENT ENGINE SERVICE
 * Propósito: Generación aleatoria de exámenes y calificación (Fase 5 - Semana 37)
 */

const { executeQuery } = require('../config/database.js');
const problemsService = require('./practice-problems.service.js'); // Reuse generative improvements

class AssessmentService {

    // --- BLUEPRINTS & GENERATION ---

    async getBlueprints() {
        return await executeQuery('SELECT * FROM exam_blueprints WHERE is_active = TRUE');
    }

    async generateAssessment(userId, blueprintId) {
        // 1. Get Blueprint
        const bpRes = await executeQuery('SELECT * FROM exam_blueprints WHERE id = $1', [blueprintId]);
        if (bpRes.length === 0) throw new Error('Blueprint not found');
        const blueprint = bpRes[0];

        // 2. Select Questions based on config
        const selectedQuestions = [];
        const config = blueprint.structure_config_json; // Array of rules

        for (const rule of config) {
            // Fetch potential questions randomly
            const questions = await executeQuery(
                `SELECT id, question_type, content_json FROM question_bank 
                 WHERE topic = $1 AND difficulty_level = $2 
                 ORDER BY RANDOM() LIMIT $3`,
                [rule.topic, rule.difficulty, rule.count]
            );

            // Add to selection
            questions.forEach(q => {
                selectedQuestions.push({
                    bank_id: q.id,
                    type: 'static',
                    content: q.content_json
                });
            });

            // (Future: Logic to mix in generative problems via problem_templates)
        }

        if (selectedQuestions.length === 0) throw new Error('No questions available for this blueprint configuration');

        // 3. Persist Assessment
        const query = `
            INSERT INTO generated_assessments (user_id, blueprint_id, questions_seed_json, status, created_at)
            VALUES ($1, $2, $3, 'assigned', CURRENT_TIMESTAMP)
            RETURNING id, status
        `;
        const res = await executeQuery(query, [userId, blueprintId, JSON.stringify(selectedQuestions)]);
        return {
            id: res[0].id,
            title: blueprint.title,
            questions: selectedQuestions.map((q, idx) => ({
                index: idx,
                content: q.content
            }))
        };
    }

    // --- TAKING ASSESSMENT ---

    async getAssessment(assessmentId, userId) {
        const res = await executeQuery('SELECT * FROM generated_assessments WHERE id = $1 AND user_id = $2', [assessmentId, userId]);
        if (res.length === 0) return null;

        const assessment = res[0];
        const questionsOriginal = assessment.questions_seed_json;

        // Hide correct answers if they were somehow in the seed (they shouldn't be in content_json, but safety first)
        const sanitizedQuestions = questionsOriginal.map((q, idx) => ({
            index: idx,
            type: q.type,
            content: q.content
        }));

        return {
            ...assessment,
            questions: sanitizedQuestions
        };
    }

    async submitAssessment(assessmentId, userId, answers) {
        // answers: [{ index: 0, answer: "A" }, ...]

        // 1. Verify status
        const assessment = await this.getAssessment(assessmentId, userId);
        if (!assessment || assessment.status === 'submitted') throw new Error('Invalid assessment or already submitted');

        // 2. Auto-grade Objectively (MCQ)
        let totalScore = 0;
        let gradedCount = 0;
        const questions = assessment.questions_seed_json;

        for (const ans of answers) {
            const questionData = questions[ans.index];
            let score = 0;
            let feedback = '';

            if (questionData.type === 'static') {
                // Fetch correct answer from DB
                const qDb = await executeQuery('SELECT * FROM question_bank WHERE id = $1', [questionData.bank_id]);
                if (qDb.length > 0) {
                    const q = qDb[0];
                    if (q.question_type === 'multiple_choice') {
                        const correctIdx = q.correct_answer_json.index;
                        if (parseInt(ans.answer) === correctIdx) {
                            score = 10; // Simple point system
                        }
                    }
                    // For open_text, score remains 0, marked for manual grading? 
                    // Or simple keyword match
                }
            }

            totalScore += score;

            // Save answer
            await executeQuery(
                `INSERT INTO assessment_answers (assessment_id, question_index, answer_payload, score_obtained)
                 VALUES ($1, $2, $3, $4)`,
                [assessmentId, ans.index, JSON.stringify(ans.answer), score]
            );
        }

        // 3. Update Assessment Status
        await executeQuery(
            "UPDATE generated_assessments SET status = 'submitted', submitted_at = CURRENT_TIMESTAMP, final_score = $1 WHERE id = $2",
            [totalScore, assessmentId]
        );

        return { success: true, score: totalScore };
    }
}

module.exports = new AssessmentService();
