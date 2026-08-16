/**
 * 📝 GRADING ENGINE SERVICE
 * Propósito: Evaluar respuestas de texto libre usando heurística NLP simple (Fase 6 - Semana 45)
 */

const { executeQuery } = require('../config/database.js');

class GradingEngineService {

    async submitEssay(userId, questionId, text) {
        // 1. Save Submission
        const subQuery = `
            INSERT INTO essay_submissions (user_id, question_id, answer_text)
            VALUES ($1, $2, $3)
            RETURNING id
        `;
        const subRes = await executeQuery(subQuery, [userId, questionId, text]);
        const subId = subRes[0].id;

        // 2. Fetch Rules (Mock)
        // const rules = await executeQuery('SELECT * FROM nlp_grading_rules WHERE question_id = $1', [questionId]);
        const requiredKeywords = ["historia", "importante", "cambio"]; // Mock rules

        // 3. Analyze (Heuristic)
        const lowerText = text.toLowerCase();
        let keywordMatches = 0;
        let missingWords = [];

        requiredKeywords.forEach(word => {
            if (lowerText.includes(word)) keywordMatches++;
            else missingWords.push(word);
        });

        const keywordScore = (keywordMatches / requiredKeywords.length) * 100;

        // Simple word count check
        const wordCount = text.split(/\s+/).length;
        const lengthPenalty = wordCount < 10 ? 0.5 : 1.0;

        const finalScore = keywordScore * lengthPenalty;

        let feedback = "Buen intento.";
        if (keywordScore === 100) feedback = "Excelente, cubriste todos los puntos clave.";
        else feedback = `Te faltó mencionar: ${missingWords.join(", ")}.`;

        // 4. Save Grade
        const gradeQuery = `
            INSERT INTO automated_grades (submission_id, score, keyword_match_score, feedback_text)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const gradeRes = await executeQuery(gradeQuery, [subId, finalScore, keywordScore, feedback]);

        return {
            submissionId: subId,
            grade: gradeRes[0]
        };
    }

    async getSubmission(submissionId) {
        const res = await executeQuery(`
            SELECT s.*, g.score, g.feedback_text 
            FROM essay_submissions s
            LEFT JOIN automated_grades g ON s.id = g.submission_id
            WHERE s.id = $1
         `, [submissionId]);
        return res[0];
    }
}

module.exports = new GradingEngineService();
