/**
 * 🤖 MIDDLEWARE: Deducción de IACoins para llamadas IA — Gemini Flash
 * Bachillerato General Estatal "Héroes de la Patria"
 *
 * Funciones:
 *   - checkAndDeductCoins(action): Factory de middleware que verifica saldo y descuenta
 *   - callGemini(prompt, type): Llama a Google Gemini o devuelve demo si key ausente
 *   - IACOINS_COSTS: Tabla de costos por tipo de generación (configurable vía .env)
 *
 * Comportamiento sin GEMINI_API_KEY:
 *   - Las llamadas IA se degradan a modo demo (respuesta simulada)
 *   - Log claro: [IA-DEMO] GEMINI_API_KEY no configurada
 *   - La deducción de IACoins SÍ se ejecuta igual (como si fuera real)
 *
 * Configuración (backend/.env):
 *   GEMINI_API_KEY=         ← Pega tu clave aquí para activar llamadas reales
 *   IACOINS_COST_AI_SHORT=10
 *   IACOINS_COST_AI_LONG=25
 *   IACOINS_COST_AI_EXAM=50
 *   IACOINS_COST_AI_HINT=5
 */

const { getPool } = require('../data/database-access.js');

// ============================================================
// TABLA DE COSTOS (configurable desde .env)
// ============================================================
const IACOINS_COSTS = {
    ai_short:  parseInt(process.env.IACOINS_COST_AI_SHORT)  || 10,  // Texto corto (<200 palabras)
    ai_long:   parseInt(process.env.IACOINS_COST_AI_LONG)   || 25,  // Texto largo (>200 palabras)
    ai_exam:   parseInt(process.env.IACOINS_COST_AI_EXAM)   || 50,  // Generación de examen
    ai_hint:   parseInt(process.env.IACOINS_COST_AI_HINT)   || 5,   // Pista en reto
    ai_concept:parseInt(process.env.IACOINS_COST_AI_CONCEPT)|| 15,  // Constructor de conceptos
    ai_chat:   parseInt(process.env.IACOINS_COST_AI_CHAT)   || 8,   // Chat IA
};

// Exportar tabla para uso externo (real-ai.js, etc.)
exports.IACOINS_COSTS = IACOINS_COSTS;

// ============================================================
// HELPER: Ejecutar query con fallback
// ============================================================
async function runQuery(sql, params = []) {
    const pool = getPool();
    const client = await pool.connect();
    try {
        const result = await client.query(sql, params);
        return result.rows;
    } finally {
        client.release();
    }
}

// ============================================================
// HELPER: Obtener balance actual del usuario
// ============================================================
async function getBalance(userId) {
    try {
        // Intentar con iacoins_balance (tabla principal GamificationDAO)
        const rows = await runQuery(
            `SELECT balance FROM iacoins_balance WHERE user_id = $1`, [userId]
        );
        if (rows.length > 0) return rows[0].balance;

        // Fallback con iacoins_balances (tabla legado)
        const rows2 = await runQuery(
            `SELECT balance FROM iacoins_balances WHERE user_id = $1`, [userId]
        );
        return rows2[0]?.balance || 0;
    } catch (err) {
        // Tabla aún no existe: retornar 0 (tabla demo)
        console.warn('[IACOINS-MW] No se pudo leer balance (tabla puede no existir):', err.message);
        return 0;
    }
}

// ============================================================
// HELPER: Deducir IACoins del balance del usuario
// ============================================================
async function deductCoins(userId, amount, description, generationType) {
    // Deducir de iacoins_balance (tabla principal GamificationDAO)
    await runQuery(`
        UPDATE iacoins_balance
        SET balance      = balance - $1,
            total_spent  = COALESCE(total_spent, 0) + $1,
            updated_at   = NOW()
        WHERE user_id = $2
    `, [amount, userId]).catch(e => console.warn('[IACOINS-MW] iacoins_balance update:', e.message));

    // Deducir de iacoins_balances (tabla legado)
    await runQuery(`
        UPDATE iacoins_balances
        SET balance    = balance - $1,
            total_spent = total_spent + $1,
            updated_at  = NOW()
        WHERE user_id = $2
    `, [amount, userId]).catch(e => console.warn('[IACOINS-MW] iacoins_balances update:', e.message));

    // Registrar transacción
    await runQuery(`
        INSERT INTO iacoins_transactions
            (user_id, type, amount, description, reference_type, metadata)
        VALUES ($1, 'spend', $2, $3, $4, $5)
    `, [
        userId, amount, description,
        generationType || 'ai_generation',
        JSON.stringify({ ai_provider: 'google', ai_model: 'gemini-2.0-flash' })
    ]).catch(e => console.warn('[IACOINS-MW] iacoins_transactions insert:', e.message));

    // Registrar en iacoins_ai_generations
    await runQuery(`
        INSERT INTO iacoins_ai_generations
            (user_id, ai_provider, model, coins_spent, generation_type, is_demo)
        VALUES ($1, 'google', 'gemini-2.0-flash', $2, $3, $4)
    `, [userId, amount, generationType || 'text', false])
    .catch(e => console.warn('[IACOINS-MW] iacoins_ai_generations insert:', e.message));
}

// ============================================================
// MIDDLEWARE FACTORY: checkAndDeductCoins(action)
// ============================================================
/**
 * Middleware que verifica saldo de IACoins y deduce antes de continuar.
 * @param {string} action - Clave de IACOINS_COSTS (ej: 'ai_short', 'ai_exam')
 * @param {object} options
 * @param {boolean} options.skipOnError - Si true, permite continuar aunque falle la deducción
 */
exports.checkAndDeductCoins = function checkAndDeductCoins(action, options = {}) {
    const cost = IACOINS_COSTS[action];
    if (!cost) {
        throw new Error(`[IACOINS-MW] Acción desconocida: "${action}". Acciones válidas: ${Object.keys(IACOINS_COSTS).join(', ')}`);
    }

    return async (req, res, next) => {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'No autenticado' });
        }

        try {
            const currentBalance = await getBalance(userId);

            if (currentBalance < cost) {
                return res.status(402).json({
                    success: false,
                    code: 'INSUFFICIENT_IACOINS',
                    message: `Saldo insuficiente de IACoins. Tienes ${currentBalance} pero esta acción cuesta ${cost}.`,
                    currentBalance,
                    required: cost,
                    action
                });
            }

            // Deducir coins
            await deductCoins(userId, cost, `Generación IA (${action})`, action);

            // Adjuntar info al request para uso downstream
            req.iacoins = {
                deducted: cost,
                action,
                balanceBefore: currentBalance,
                balanceAfter: currentBalance - cost
            };

            console.log(`[IACOINS-MW] ✅ Usuario ${userId} | Acción: ${action} | Costo: ${cost} | Balance: ${currentBalance} → ${currentBalance - cost}`);
            next();

        } catch (err) {
            console.error('[IACOINS-MW] Error en deducción:', err);
            if (options.skipOnError) {
                req.iacoins = { deducted: 0, action, error: err.message };
                return next();
            }
            res.status(500).json({
                success: false,
                message: 'Error al verificar saldo de IACoins',
                error: err.message
            });
        }
    };
};

// ============================================================
// GEMINI: Llamada real o demo según GEMINI_API_KEY
// ============================================================
/**
 * Llama a Google Gemini Flash. Si la key no está configurada,
 * retorna respuesta demo con log [IA-DEMO].
 *
 * @param {string} prompt - Texto a enviar
 * @param {string} type - 'short'|'long'|'exam'|'concept'|'chat'
 * @param {object} options - { temperature, maxTokens }
 * @returns {{ text: string, tokensUsed: number, isDemo: boolean }}
 */
exports.callGemini = async function callGemini(prompt, type = 'short', options = {}) {
    const apiKey = process.env.GEMINI_API_KEY;
    const isConfigured = apiKey && apiKey.trim().length > 10;

    // ---- MODO DEMO ----
    if (!isConfigured) {
        console.warn('[IA-DEMO] GEMINI_API_KEY no configurada — devolviendo respuesta simulada');
        const demoResponses = {
            short:   `[DEMO] Esta es una respuesta simulada de corta extensión para: "${prompt.substring(0, 60)}...". Configura GEMINI_API_KEY en backend/.env para activar llamadas reales.`,
            long:    `[DEMO] Respuesta larga simulada.\n\nEl tema "${prompt.substring(0, 80)}" es un concepto importante en el ámbito educativo. Esta respuesta es un placeholder mientras configuras tu GEMINI_API_KEY en el archivo backend/.env.\n\nUna vez configurada la key, recibirás respuestas reales de Google Gemini Flash.`,
            exam:    `[DEMO] Examen simulado:\n1. ¿Qué es [Concepto A]? (Opción A, B, C, D)\n2. ¿Cuál es la diferencia entre [X] e [Y]?\n3. Define con tus propias palabras: [Término]\n\n(Respuestas generadas demo — configura GEMINI_API_KEY)`,
            concept: `[DEMO] Mapa conceptual simulado:\n\n• Concepto Central → Subconcepeto A → Detalle 1\n                   → Subconcepto B → Detalle 2\n\n(Configura GEMINI_API_KEY para mapas reales)`,
            chat:    `[DEMO] Hola, soy el asistente IA de BGE (modo demo). Recibí tu mensaje: "${prompt.substring(0, 50)}". Para respuestas reales, configura GEMINI_API_KEY en backend/.env.`
        };
        return {
            text: demoResponses[type] || demoResponses.short,
            tokensUsed: 0,
            isDemo: true,
            model: 'demo'
        };
    }

    // ---- MODO REAL (Gemini Flash) ----
    try {
        const maxOutputTokens = {
            short:   512,
            long:    2048,
            exam:    1500,
            concept: 1024,
            chat:    800
        }[type] || 512;

        const temperature = options.temperature || (type === 'exam' ? 0.3 : 0.7);

        // Usando fetch nativo (Node 18+) — sin dependencias npm extra
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature,
                        maxOutputTokens,
                        topP: 0.95,
                        topK: 64
                    },
                    safetySettings: [
                        { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                        { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
                    ]
                })
            }
        );

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`Gemini API error ${response.status}: ${errBody.substring(0, 200)}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta';
        const tokensUsed = data.usageMetadata?.totalTokenCount || 0;

        console.log(`[IA-REAL] ✅ Gemini Flash respondió | Tokens: ${tokensUsed} | Tipo: ${type}`);

        return { text, tokensUsed, isDemo: false, model: 'gemini-2.0-flash' };

    } catch (geminiErr) {
        console.error('[IA-REAL] ❌ Error llamando a Gemini:', geminiErr.message);
        // Fallback a demo en caso de error de red/API
        return {
            text: `[ERROR-IA] No se pudo conectar con Gemini: ${geminiErr.message}. Intenta de nuevo más tarde.`,
            tokensUsed: 0,
            isDemo: true,
            error: geminiErr.message,
            model: 'error-fallback'
        };
    }
};
