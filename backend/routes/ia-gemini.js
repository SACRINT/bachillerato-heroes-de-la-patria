/**
 * 🤖 GENERACIÓN IA CON IACOINS — Endpoint real con Gemini Flash
 * Bachillerato General Estatal "Héroes de la Patria"
 * FASE 3 — Componente 4
 *
 * Rutas:
 *   POST /api/ia/generate          — Generación de texto (corta o larga) con deducción de IACoins
 *   POST /api/ia/generate-exam     — Generación de examen (costo alto)
 *   POST /api/ia/generate-hint     — Pista para reto (costo mínimo)
 *   GET  /api/ia/costs             — Tabla de costos vigente
 *
 * Uso:
 *   curl -X POST /api/ia/generate \
 *     -H "Authorization: Bearer $TOKEN" \
 *     -d '{"prompt":"Explica la mitosis","type":"short"}'
 *
 * Requiere GEMINI_API_KEY en backend/.env para llamadas reales.
 * Sin key → modo demo (deduce coins igual, respuesta simulada).
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.js');
const { checkAndDeductCoins, callGemini, IACOINS_COSTS } = require('../middleware/iacoins-deduction.js');

// ============================================================
// GET /api/ia/costs
// Tabla de costos vigente (sin auth)
// ============================================================
router.get('/costs', (req, res) => {
    res.json({
        success: true,
        costs: IACOINS_COSTS,
        provider: 'Google Gemini Flash',
        model: 'gemini-2.0-flash',
        currency: 'IACoins',
        configured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10)
    });
});

// ============================================================
// GET /api/ia/health
// Estado de la integración IA (sin auth)
// ============================================================
router.get('/health', (req, res) => {
    const hasKey = !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 10);
    res.json({
        success: true,
        status: hasKey ? 'real' : 'demo',
        provider: 'Google Gemini Flash',
        model: 'gemini-2.0-flash',
        message: hasKey
            ? '✅ Gemini API key configurada — llamadas reales activas'
            : '⚠️ GEMINI_API_KEY no configurada — modo demo activo. Agrega tu key en backend/.env'
    });
});

// ============================================================
// VALIDATION MIDDLEWARES (ejecutan antes de la deducción)
// ============================================================
function validatePrompt(req, res, next) {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) {
        return res.status(400).json({
            success: false,
            message: 'El prompt es requerido (mínimo 5 caracteres)'
        });
    }
    next;
    next();
}

function validateExam(req, res, next) {
    const { topic } = req.body;
    if (!topic || typeof topic !== 'string' || topic.trim().length < 2) {
        return res.status(400).json({
            success: false,
            message: 'El tema del examen es requerido'
        });
    }
    next();
}

function validateHint(req, res, next) {
    const { challenge_title } = req.body;
    if (!challenge_title || typeof challenge_title !== 'string') {
        return res.status(400).json({
            success: false,
            message: 'El título del reto es requerido'
        });
    }
    next();
}

// ============================================================
// POST /api/ia/generate
// Generación de texto (corta o larga) con deducción de IACoins
// ============================================================
router.post('/generate',
    authenticateToken,
    validatePrompt,
    checkAndDeductCoins('ai_short'),
    async (req, res) => {
        try {
            const { prompt, type = 'short', subject, grade } = req.body;

            // Construir prompt contextualizado para BGE
            const contextPrompt = buildEducationalPrompt(prompt, type, subject, grade);

            const result = await callGemini(contextPrompt, type);

            // Registrar en historial de generaciones IA
            const { getPool } = require('../data/database-access.js');
            const pool = getPool();
            pool.connect().then(async client => {
                try {
                    await client.query(`
                        INSERT INTO iacoins_ai_generations
                            (user_id, ai_provider, model, prompt_preview, response_preview,
                             tokens_used, coins_spent, generation_type, is_demo)
                        VALUES ($1, 'google', $2, $3, $4, $5, $6, $7, $8)
                    `, [
                        req.user.id,
                        result.model,
                        prompt.substring(0, 200),
                        result.text.substring(0, 200),
                        result.tokensUsed,
                        req.iacoins?.deducted || IACOINS_COSTS.ai_short,
                        'text_short',
                        result.isDemo
                    ]);
                } catch (dbErr) {
                    console.warn('[IA-GEN] iacoins_ai_generations insert:', dbErr.message);
                } finally {
                    client.release();
                }
            }).catch(() => {});

            return res.json({
                success: true,
                data: {
                    text: result.text,
                    model: result.model,
                    tokens_used: result.tokensUsed,
                    is_demo: result.isDemo,
                    coins_spent: req.iacoins?.deducted || IACOINS_COSTS.ai_short,
                    balance_after: req.iacoins?.balanceAfter
                },
                message: result.isDemo
                    ? '⚠️ Respuesta demo — configura GEMINI_API_KEY para activar IA real'
                    : '✅ Generado con Gemini Flash'
            });

        } catch (err) {
            console.error('[IA-GEN] Error en /generate:', err);
            return res.status(500).json({ success: false, message: 'Error al generar contenido IA', error: err.message });
        }
    }
);

// ============================================================
// POST /api/ia/generate-long
// Generación de texto larga (más tokens, mayor costo)
// ============================================================
router.post('/generate-long',
    authenticateToken,
    validatePrompt,
    checkAndDeductCoins('ai_long'),
    async (req, res) => {
        try {
            const { prompt, subject, grade } = req.body;

            const contextPrompt = buildEducationalPrompt(prompt, 'long', subject, grade);
            const result = await callGemini(contextPrompt, 'long');

            return res.json({
                success: true,
                data: {
                    text: result.text,
                    model: result.model,
                    tokens_used: result.tokensUsed,
                    is_demo: result.isDemo,
                    coins_spent: req.iacoins?.deducted || IACOINS_COSTS.ai_long,
                    balance_after: req.iacoins?.balanceAfter
                }
            });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
);

// ============================================================
// POST /api/ia/generate-exam
// Generación de examen completo (alto costo)
// ============================================================
router.post('/generate-exam',
    authenticateToken,
    validateExam,
    checkAndDeductCoins('ai_exam'),
    async (req, res) => {
        try {
            const { topic, subject, grade, num_questions = 10, difficulty = 'medium' } = req.body;

            const examPrompt = buildExamPrompt(topic, subject, grade, num_questions, difficulty);
            const result = await callGemini(examPrompt, 'exam');

            return res.json({
                success: true,
                data: {
                    exam: result.text,
                    model: result.model,
                    tokens_used: result.tokensUsed,
                    is_demo: result.isDemo,
                    coins_spent: req.iacoins?.deducted || IACOINS_COSTS.ai_exam,
                    balance_after: req.iacoins?.balanceAfter,
                    metadata: { topic, subject, grade, num_questions, difficulty }
                }
            });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
);

// ============================================================
// POST /api/ia/generate-hint
// Pista para reto (costo mínimo)
// ============================================================
router.post('/generate-hint',
    authenticateToken,
    validateHint,
    checkAndDeductCoins('ai_hint'),
    async (req, res) => {
        try {
            const { challenge_id, challenge_title, user_progress } = req.body;

            const hintPrompt = `Eres un tutor amigable del Bachillerato "Héroes de la Patria". 
El estudiante está trabajando en el reto: "${challenge_title}".
Progreso actual: ${user_progress || 'recién iniciado'}.
Proporciona UNA pista breve y motivadora (máximo 3 oraciones) sin revelar la respuesta completa.
Usa emojis apropiados y lenguaje juvenil amigable.`;

            const result = await callGemini(hintPrompt, 'short');

            return res.json({
                success: true,
                data: {
                    hint: result.text,
                    is_demo: result.isDemo,
                    coins_spent: req.iacoins?.deducted || IACOINS_COSTS.ai_hint,
                    balance_after: req.iacoins?.balanceAfter
                }
            });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
);

// ============================================================
// HELPERS: Prompts contextualizados para BGE
// ============================================================
function buildEducationalPrompt(prompt, type, subject, grade) {
    const gradeContext = grade ? `Nivel educativo: ${grade} de bachillerato.` : 'Nivel bachillerato.';
    const subjectContext = subject ? `Materia: ${subject}.` : '';

    return `Eres un asistente educativo del Bachillerato General Estatal "Héroes de la Patria" de México.
${gradeContext} ${subjectContext}
Tu respuesta debe ser clara, educativa y apropiada para estudiantes de nivel medio superior.
${type === 'long' ? 'Proporciona una explicación detallada y completa.' : 'Responde de manera concisa y directa.'}
Usa español mexicano formal pero accesible. Cuando sea útil, usa ejemplos concretos.

Solicitud del estudiante:
${prompt}`;
}

function buildExamPrompt(topic, subject, grade, numQuestions, difficulty) {
    const difficultyMap = {
        easy: 'fácil (conceptos básicos)',
        medium: 'intermedio (aplicación de conceptos)',
        hard: 'difícil (análisis y síntesis)'
    };

    return `Eres un profesor del Bachillerato "Héroes de la Patria". 
Crea un examen de ${numQuestions} preguntas de opción múltiple (4 opciones cada una) sobre:
Tema: ${topic}
${subject ? `Materia: ${subject}` : ''}
${grade ? `Grado: ${grade}° de bachillerato` : ''}
Dificultad: ${difficultyMap[difficulty] || difficulty}

Formato para cada pregunta:
**Pregunta N:** [texto de la pregunta]
A) [opción]
B) [opción]  
C) [opción]
D) [opción]
**Respuesta correcta:** [letra]
**Explicación breve:** [por qué es correcta]

---
Asegúrate de que las preguntas sean apropiadas para bachillerato mexicano y cubran distintos aspectos del tema.`;
}

module.exports = router;
