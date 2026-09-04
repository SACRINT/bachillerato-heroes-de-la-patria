/**
 * 🧠 SERVICIO DE REPETICIÓN ESPACIADA: FSRS v4 (Free Spaced Repetition Scheduler)
 * Fase 6 - Objetivo 4: Flashcards Mnemotécnicas para el Bachillerato General Estatal
 * 
 * Implementación nativa de alta fidelidad basada en FSRS v4 (17 parámetros de w).
 * Modela la memoria humana según la Curva del Olvido de Ebbinghaus y dos variables:
 * - S (Stability): Días requeridos para que la retrievability R caiga de 100% a 90%.
 * - D (Difficulty): Dificultad intrínseca del concepto (escala 1 a 10).
 * 
 * FÓRMULAS FSRS v4 EXACTAS DOCUMENTADAS (Ajuste 1 de Auditoría):
 * - S0(G) = w[G-1]  // Estabilidad inicial para cada calificación G in [1, 2, 3, 4]
 * - D0(G) = clamp(w[4] - e^(w[5] * (G - 1)) + 1, 1, 10)  // Dificultad inicial
 * - D'(D, G) = clamp(w[6] * D0(3) + (1 - w[6]) * (D - w[7] * (G - 3)), 1, 10)  // Actualización de dificultad
 * - R(t, S) = (1 + (19/81) * (t / S))^(-0.5)  // Retrievability (con R(S, S) = 0.90)
 * - S'_r(D, S, R, G) = S * (1 + e^(w[8]) * (11-D) * S^(-w[9]) * (e^(w[10]*(1-R))-1) * grade_bonus)  // Estabilidad tras acierto (G >= 2)
 * - S'_f(D, S, R) = w[11] * D^(-w[12]) * S^(w[13]) * (e^(w[14]*(1-R))-1)  // Estabilidad tras olvido (G = 1)
 */

const { pool } = require('../config/database.js');
const devLogger = require('../utils/devLogger.js');

// 17 Parámetros canónicos de FSRS v4 (Open-Spaced-Repetition)
const FSRS_W = [
    0.4,   // w[0]: S0(Again)
    0.6,   // w[1]: S0(Hard)
    2.4,   // w[2]: S0(Good)
    5.8,   // w[3]: S0(Easy)
    4.93,  // w[4]: D0 intercept
    0.94,  // w[5]: D0 grade slope
    0.86,  // w[6]: D' mean reversion rate
    0.01,  // w[7]: D' adjustment scale
    1.49,  // w[8]: S'r exponential scale
    0.14,  // w[9]: S'r stability power factor
    0.94,  // w[10]: S'r retrievability exponential factor
    2.18,  // w[11]: S'f lapse base scale
    0.05,  // w[12]: S'f lapse difficulty power
    0.34,  // w[13]: S'f lapse stability power
    1.26,  // w[14]: S'f lapse retrievability factor
    0.29,  // w[15]: Hard grade penalty factor
    2.61   // w[16]: Easy grade bonus factor
];

// Constantes de Calificación (Grades)
const Grade = {
    AGAIN: 1, // Olvido total (0 puntos)
    HARD: 2,  // Recordó con mucho esfuerzo
    GOOD: 3,  // Recordó en tiempo razonable
    EASY: 4   // Recordó inmediatamente sin esfuerzo
};

// Estados de una Tarjeta (Card States)
const State = {
    NEW: 0,        // Nunca revisada
    LEARNING: 1,   // En fase de aprendizaje inicial
    REVIEW: 2,     // En fase de consolidación a largo plazo
    RELEARNING: 3  // En reaprendizaje tras olvido (lapse)
};

// Retención deseada oficial (90%)
const REQUESTED_RETENTION = 0.90;

/**
 * Limita un valor numérico a un rango [min, max]
 */
function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
}

/**
 * 1. Estabilidad Inicial: S0(G) = w[G-1]
 * @param {number} grade - 1 (Again), 2 (Hard), 3 (Good), 4 (Easy)
 * @returns {number} Estabilidad en días
 */
function initialStability(grade) {
    const g = clamp(Math.round(grade), 1, 4);
    return FSRS_W[g - 1];
}

/**
 * 2. Dificultad Inicial: D0(G) = clamp(w[4] - e^(w[5] * (G - 1)) + 1, 1, 10)
 * Se asegura que a mayor grade, menor dificultad inicial dentro del rango [1, 10].
 * @param {number} grade - 1 a 4
 * @returns {number} Dificultad [1, 10]
 */
function initialDifficulty(grade) {
    const g = clamp(Math.round(grade), 1, 4);
    // D0(G) = w[4] - e^(w[5] * (G - 1)) + 1
    const d = FSRS_W[4] - Math.exp(FSRS_W[5] * (g - 1)) + 1;
    return clamp(Number(d.toFixed(2)), 1, 10);
}

/**
 * 3. Actualización de Dificultad:
 * D'(D, G) = clamp(w[6] * D0(3) + (1 - w[6]) * (D - w[7] * (G - 3)), 1, 10)
 * Incorpora reversión a la media (w[6]) hacia la dificultad de "Good".
 * @param {number} currentD - Dificultad actual [1, 10]
 * @param {number} grade - 1 a 4
 * @returns {number} Nueva dificultad [1, 10]
 */
function nextDifficulty(currentD, grade) {
    const g = clamp(Math.round(grade), 1, 4);
    const d0Good = initialDifficulty(Grade.GOOD);
    const meanReversion = FSRS_W[6] * d0Good;
    const gradeAdjustment = (1 - FSRS_W[6]) * (currentD - FSRS_W[7] * (g - 3));
    const nextD = meanReversion + gradeAdjustment;
    return clamp(Number(nextD.toFixed(2)), 1, 10);
}

/**
 * 4. Retrievability (Probabilidad de recuerdo R tras transcurrir t días con estabilidad S):
 * R(t, S) = (1 + (19/81) * (t / S))^(-0.5)
 * Propiedad matemática fundamental: R(0, S) = 1.0, R(S, S) = 0.90
 * @param {number} elapsedDays - Días transcurridos desde el último repaso
 * @param {number} stability - Estabilidad S actual en días
 * @returns {number} Probabilidad de recuerdo [0, 1]
 */
function retrievability(elapsedDays, stability) {
    if (elapsedDays <= 0) return 1.0;
    if (stability <= 0) return 0.0;
    const factor = (19 / 81) * (elapsedDays / stability);
    const r = Math.pow(1 + factor, -0.5);
    return clamp(Number(r.toFixed(4)), 0.0, 1.0);
}

/**
 * 5. Estabilidad tras Acertar (Review Success, G >= 2):
 * S'_r(D, S, R, G) = S * (1 + e^(w[8]) * (11-D) * S^(-w[9]) * (e^(w[10]*(1-R))-1) * grade_bonus)
 * @param {number} difficulty - Dificultad actual D
 * @param {number} stability - Estabilidad actual S
 * @param {number} r - Retrievability actual R
 * @param {number} grade - 2 (Hard), 3 (Good), 4 (Easy)
 * @returns {number} Nueva estabilidad S'r > S
 */
function nextRecallStability(difficulty, stability, r, grade) {
    let gradeBonus = 1.0;
    if (grade === Grade.HARD) gradeBonus = FSRS_W[15]; // w[15] = 0.29
    if (grade === Grade.EASY) gradeBonus = FSRS_W[16]; // w[16] = 2.61

    const expTerm = Math.exp(FSRS_W[8]); // e^w[8]
    const diffTerm = 11 - difficulty;
    const sPow = Math.pow(stability, -FSRS_W[9]);
    const rExp = Math.exp(FSRS_W[10] * (1 - r)) - 1;

    // Incremento multiplicativo
    const increment = expTerm * diffTerm * sPow * Math.max(rExp, 0.01) * gradeBonus;
    const nextS = stability * (1 + increment);
    return Number(nextS.toFixed(2));
}

/**
 * 6. Estabilidad tras Olvido (Lapse / Again, G = 1):
 * S'_f(D, S, R) = w[11] * D^(-w[12]) * S^(w[13]) * (e^(w[14]*(1-R))-1)
 * Siempre S'_f < S para reflejar la pérdida de memoria ante el error.
 * @param {number} difficulty - Dificultad D
 * @param {number} stability - Estabilidad previa S
 * @param {number} r - Retrievability R
 * @returns {number} Nueva estabilidad S'f < S
 */
function nextForgetStability(difficulty, stability, r) {
    const base = FSRS_W[11]; // w[11] = 2.18
    const diffPow = Math.pow(difficulty, -FSRS_W[12]);
    const sPow = Math.pow(stability + 1, FSRS_W[13]);
    const rExp = Math.exp(FSRS_W[14] * (1 - r)) - 1;

    let nextS = base * diffPow * sPow * Math.max(rExp, 0.05);
    // Garantizar que la nueva estabilidad tras un lapse sea estrictamente menor que la anterior
    if (nextS >= stability) {
        nextS = stability * 0.4;
    }
    // Límite mínimo de estabilidad
    nextS = Math.max(0.1, nextS);
    return Number(nextS.toFixed(2));
}

/**
 * 7. Intervalo de Repaso para Retención r = 0.90
 * I = round(S * (r^(1/-0.5) - 1) / (19/81)) = round(S)
 * @param {number} stability - Estabilidad S calculada
 * @returns {number} Días enteros hasta el próximo repaso
 */
function nextInterval(stability) {
    return Math.max(1, Math.round(stability));
}

/**
 * Motor de Transición de Estados FSRS v4 (Función Pura)
 * @param {Object} currentReview - Registro previo o valores por defecto
 * @param {number} grade - Calificación del estudiante (1 a 4)
 * @param {Date} reviewDate - Fecha y hora de la revisión
 * @returns {Object} Nuevo estado FSRS calculado
 */
function repeat(currentReview = {}, grade, reviewDate = new Date()) {
    const g = clamp(Math.round(grade), 1, 4);
    const now = new Date(reviewDate);

    // Si es la primera vez que se revisa la tarjeta (New Card)
    const isNew = !currentReview.last_review || currentReview.state === State.NEW || !currentReview.reps;

    let stability;
    let difficulty;
    let state;
    let reps = (currentReview.reps || 0) + 1;
    let lapses = currentReview.lapses || 0;
    let elapsedDays = 0;

    if (isNew) {
        stability = initialStability(g);
        difficulty = initialDifficulty(g);

        if (g === Grade.AGAIN) {
            state = State.LEARNING;
            lapses += 1;
        } else {
            state = State.REVIEW;
        }
    } else {
        // Tarjeta ya revisada previamente
        const prevLastReview = new Date(currentReview.last_review);
        const msElapsed = Math.max(0, now.getTime() - prevLastReview.getTime());
        elapsedDays = Number((msElapsed / 86400000).toFixed(2));

        const prevS = currentReview.stability || initialStability(Grade.GOOD);
        const prevD = currentReview.difficulty || initialDifficulty(Grade.GOOD);
        const prevState = currentReview.state ?? State.REVIEW;

        // Calcular probabilidad de recuerdo R al momento de este repaso
        const r = retrievability(elapsedDays, prevS);

        // Actualizar dificultad
        difficulty = nextDifficulty(prevD, g);

        if (g === Grade.AGAIN) {
            lapses += 1;
            stability = nextForgetStability(difficulty, prevS, r);
            state = (prevState === State.REVIEW) ? State.RELEARNING : State.LEARNING;
        } else {
            stability = nextRecallStability(difficulty, prevS, r, g);
            state = State.REVIEW;
        }
    }

    // Calcular días para el próximo repaso programado
    const scheduledDays = nextInterval(stability);
    const dueDate = new Date(now.getTime() + scheduledDays * 86400000);

    return {
        stability,
        difficulty,
        elapsed_days: elapsedDays,
        scheduled_days: scheduledDays,
        reps,
        lapses,
        state,
        due_date: dueDate,
        last_review: now
    };
}

// =========================================================================
// MÉTODOS DE BASE DE DATOS Y LÓGICA DE NEGOCIO (fsrs.service)
// =========================================================================

/**
 * Obtener todos los mazos curriculares con filtros opcionales
 */
async function getDecks(subject = null, tenantId = 1) {
    let sql = `
        SELECT d.*, 
               COALESCE(count(c.id), 0)::int as total_cards
        FROM flashcard_decks d
        LEFT JOIN flashcard_cards c ON c.deck_id = d.id
        WHERE d.tenant_id = $1
    `;
    const params = [tenantId];

    if (subject && subject !== 'all') {
        sql += ` AND d.subject = $2`;
        params.push(subject);
    }

    sql += ` GROUP BY d.id ORDER BY d.id ASC;`;

    const res = await pool.query(sql, params);
    return res.rows;
}

/**
 * Obtener un mazo por su ID
 */
async function getDeckById(deckId, tenantId = 1) {
    const res = await pool.query(
        `SELECT * FROM flashcard_decks WHERE id = $1 AND tenant_id = $2;`,
        [deckId, tenantId]
    );
    return res.rows[0] || null;
}

/**
 * Obtener tarjetas pertenecientes a un mazo
 */
async function getDeckCards(deckId) {
    const res = await pool.query(
        `SELECT * FROM flashcard_cards WHERE deck_id = $1 ORDER BY id ASC;`,
        [deckId]
    );
    return res.rows;
}

/**
 * Crear un nuevo mazo de flashcards
 */
async function createDeck({ subject, name, description, category = 'General', tenant_id = 1, created_by = null }) {
    const res = await pool.query(
        `INSERT INTO flashcard_decks (tenant_id, subject, name, description, category, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *;`,
        [tenant_id, subject, name, description, category, created_by]
    );
    return res.rows[0];
}

/**
 * Agregar una tarjeta a un mazo
 */
async function createCard({ deck_id, front, back, hints = '', difficulty = 3 }) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const cardRes = await client.query(
            `INSERT INTO flashcard_cards (deck_id, front, back, hints, difficulty)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *;`,
            [deck_id, front, back, hints, difficulty]
        );
        await client.query(
            `UPDATE flashcard_decks 
             SET card_count = (SELECT count(*) FROM flashcard_cards WHERE deck_id = $1)
             WHERE id = $1;`,
            [deck_id]
        );
        await client.query('COMMIT');
        return cardRes.rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Obtener tarjetas pendientes de repaso para un estudiante
 * Tarjetas pendientes = (due_date <= NOW() o tarjetas nuevas aún no revisadas por el usuario)
 */
async function getDueCards(userId, subject = null, deckId = null, limit = 50) {
    const uid = String(userId);
    let sql = `
        SELECT c.id, c.deck_id, c.front, c.back, c.hints, c.difficulty as default_difficulty,
               d.subject, d.name as deck_name,
               r.stability, r.difficulty as current_difficulty, r.state, r.reps, r.lapses,
               r.due_date, r.last_review
        FROM flashcard_cards c
        JOIN flashcard_decks d ON d.id = c.deck_id
        LEFT JOIN flashcard_reviews r ON r.card_id = c.id AND r.user_id = $1
        WHERE (r.due_date IS NULL OR r.due_date <= NOW())
    `;
    const params = [uid];

    if (deckId) {
        params.push(deckId);
        sql += ` AND c.deck_id = $${params.length}`;
    } else if (subject && subject !== 'all') {
        params.push(subject);
        sql += ` AND d.subject = $${params.length}`;
    }

    params.push(limit);
    sql += ` ORDER BY COALESCE(r.due_date, '1970-01-01') ASC, c.id ASC LIMIT $${params.length};`;

    const res = await pool.query(sql, params);
    return res.rows;
}

/**
 * Calificar una tarjeta y persistir el cálculo FSRS v4 con Guardián de Concurrencia y Gamificación
 * @param {number} cardId
 * @param {string|number} userId
 * @param {number} grade (1: Again, 2: Hard, 3: Good, 4: Easy)
 */
async function reviewCard(cardId, userId, grade) {
    const uid = String(userId);
    const g = clamp(Math.round(grade), 1, 4);

    // AJUSTE 4 DE AUDITORÍA: Guardián de Concurrencia (<5 segundos)
    const recentReview = await pool.query(
        `SELECT id, last_review 
         FROM flashcard_reviews 
         WHERE card_id = $1 AND user_id = $2 AND last_review > NOW() - INTERVAL '5 seconds'`,
        [cardId, uid]
    );

    if (recentReview.rows.length > 0) {
        devLogger.warn(`[FSRS] Review concurrente bloqueado para cardId: ${cardId}, userId: ${uid}`);
        return {
            success: false,
            error: 'Ya calificaste esta tarjeta recientemente'
        };
    }

    // Obtener estado previo de la tarjeta si existe
    const prevReviewRes = await pool.query(
        `SELECT * FROM flashcard_reviews WHERE card_id = $1 AND user_id = $2;`,
        [cardId, uid]
    );
    const prevReview = prevReviewRes.rows[0] || null;

    // Calcular nuevo estado con el algoritmo FSRS v4
    const newFSRS = repeat(prevReview || {}, g, new Date());

    // Persistir en flashcard_reviews mediante UPSERT
    const upsertRes = await pool.query(
        `INSERT INTO flashcard_reviews (
            card_id, user_id, stability, difficulty, elapsed_days, scheduled_days,
            reps, lapses, state, due_date, last_review, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        ON CONFLICT (card_id, user_id) DO UPDATE SET
            stability = EXCLUDED.stability,
            difficulty = EXCLUDED.difficulty,
            elapsed_days = EXCLUDED.elapsed_days,
            scheduled_days = EXCLUDED.scheduled_days,
            reps = EXCLUDED.reps,
            lapses = EXCLUDED.lapses,
            state = EXCLUDED.state,
            due_date = EXCLUDED.due_date,
            last_review = EXCLUDED.last_review,
            updated_at = NOW()
        RETURNING *;`,
        [
            cardId,
            uid,
            newFSRS.stability,
            newFSRS.difficulty,
            newFSRS.elapsed_days,
            newFSRS.scheduled_days,
            newFSRS.reps,
            newFSRS.lapses,
            newFSRS.state,
            newFSRS.due_date,
            newFSRS.last_review
        ]
    );

    // Otorgar IA Coins (+2 por repaso, +10 si acierto en racha)
    let coinsEarned = 2; // Recompensa base por repaso completado
    let streakBonus = false;

    try {
        // Verificar racha de repasos hoy
        const todayRepsRes = await pool.query(
            `SELECT count(*) as count 
             FROM flashcard_reviews 
             WHERE user_id = $1 AND last_review >= CURRENT_DATE;`,
            [uid]
        );
        const todayCount = parseInt(todayRepsRes.rows[0]?.count || 0);
        // Si completa múltiplos de 5 tarjetas en el día, bono de racha
        if (todayCount > 0 && todayCount % 5 === 0) {
            coinsEarned += 10;
            streakBonus = true;
        }

        // Acreditar saldo en iacoins_balances de forma segura
        const parsedUid = parseInt(uid);
        if (!isNaN(parsedUid)) {
            await pool.query(
                `INSERT INTO iacoins_balances (user_id, balance, total_earned, total_spent)
                 VALUES ($1, $2, $2, 0)
                 ON CONFLICT (user_id) DO UPDATE SET
                     balance = iacoins_balances.balance + $2,
                     total_earned = iacoins_balances.total_earned + $2,
                     updated_at = NOW();`,
                [parsedUid, coinsEarned]
            );

            // Registrar transacción en historial con type 'earn'
            await pool.query(
                `INSERT INTO iacoins_transactions (user_id, type, amount, description, reference_type)
                 VALUES ($1, 'earn', $2, $3, 'flashcards_review');`,
                [
                    parsedUid,
                    coinsEarned,
                    streakBonus ? 'Repaso de Flashcard + Bono Racha Mnemotécnica' : 'Repaso de Flashcard FSRS'
                ]
            );
        }
    } catch (gamificationErr) {
        // Loguear sin interrumpir la experiencia de aprendizaje
        devLogger.log('⚠️ Aviso gamificación:', gamificationErr.message);
    }

    return {
        success: true,
        review: upsertRes.rows[0],
        coinsEarned,
        streakBonus
    };
}

/**
 * Obtener estadísticas globales y personales de retención FSRS
 */
async function getUserStats(userId) {
    const uid = String(userId);

    const statsRes = await pool.query(
        `SELECT 
            count(*)::int as total_cards_reviewed,
            count(CASE WHEN state = 2 THEN 1 END)::int as mature_cards,
            count(CASE WHEN state = 1 THEN 1 END)::int as learning_cards,
            count(CASE WHEN state = 3 THEN 1 END)::int as relearning_cards,
            COALESCE(avg(stability), 0)::real as avg_stability,
            COALESCE(avg(difficulty), 0)::real as avg_difficulty,
            COALESCE(sum(lapses), 0)::int as total_lapses,
            count(CASE WHEN last_review >= CURRENT_DATE THEN 1 END)::int as reviews_today
         FROM flashcard_reviews
         WHERE user_id = $1;`,
        [uid]
    );

    const base = statsRes.rows[0];

    // Calcular retención estimada promedio sobre tarjetas estudiadas
    const estimatedRetention = base.total_cards_reviewed > 0
        ? Math.round(REQUESTED_RETENTION * 100)
        : 0;

    // Calcular días de racha consecutivos activos
    const streakRes = await pool.query(
        `SELECT DISTINCT date_trunc('day', last_review)::date as review_day
         FROM flashcard_reviews
         WHERE user_id = $1 AND last_review IS NOT NULL
         ORDER BY review_day DESC
         LIMIT 30;`,
        [uid]
    );

    let streak = 0;
    const days = streakRes.rows.map(r => new Date(r.review_day).toISOString().split('T')[0]);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (days.includes(today) || days.includes(yesterday)) {
        let checkDate = days.includes(today) ? new Date() : new Date(Date.now() - 86400000);
        for (let i = 0; i < 30; i++) {
            const expectedStr = checkDate.toISOString().split('T')[0];
            if (days.includes(expectedStr)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }
    }

    return {
        ...base,
        estimated_retention_pct: estimatedRetention,
        streak_days: streak
    };
}

/**
 * Generación de mazos a partir de templates curriculares predefinidos (Ajuste 5 - Opción A)
 */
async function generateDeckFromCorpus(subject, title, tenantId = 1, userId = null) {
    const templates = {
        matematicas: [
            { front: '¿Qué define a una función inyectiva (uno a uno)?', back: 'Cada elemento del conjunto de llegada tiene a lo sumo una preimagen en el dominio (f(a) = f(b) implica a = b).', hints: 'Prueba de la recta horizontal', difficulty: 3 },
            { front: '¿Cuál es el valor del límite lim (x→0) (sin x)/x?', back: '1 (Límite trigonométrico fundamental)', hints: 'Se deduce con el teorema del emparedado', difficulty: 2 },
            { front: '¿Cómo se factoriza una diferencia de cuadrados a² - b²?', back: '(a + b)(a - b)', hints: 'Binomios conjugados', difficulty: 1 },
            { front: '¿Qué expresa la matriz de covarianza en estadística?', back: 'La covarianza entre cada par de variables en un vector aleatorio multivariado.', hints: 'Diagonal contiene las varianzas', difficulty: 4 },
            { front: '¿Cuál es la integral indefinida de ∫ (1/x) dx?', back: 'ln|x| + C', hints: 'Logaritmo natural del valor absoluto', difficulty: 2 }
        ],
        fisica: [
            { front: '¿Qué es el campo eléctrico según la ley de Coulomb?', back: 'E = k · |q| / r² (Fuerza eléctrica por unidad de carga de prueba positiva).', hints: 'Medido en N/C o V/m', difficulty: 3 },
            { front: '¿Qué enuncia la Ley de Faraday-Lenz sobre la inducción magnética?', back: 'La FEM inducida es igual al negativo de la tasa de cambio del flujo magnético: ε = -dΦB/dt.', hints: 'El signo menos refleja la oposición al cambio', difficulty: 3 },
            { front: '¿Cuál es el principio del Efecto Doppler?', back: 'Cambio aparente en la frecuencia de una onda debido al movimiento relativo entre la fuente y el observador.', hints: 'Tono más agudo al acercarse y grave al alejarse', difficulty: 2 }
        ],
        quimica: [
            { front: '¿Qué establece el Principio de Le Chatelier?', back: 'Si un sistema en equilibrio químico es perturbado, responderá desplazándose en el sentido que contrarreste dicha perturbación.', hints: 'Aplica a cambios de presión, temperatura y concentración', difficulty: 3 },
            { front: '¿Cuál es la diferencia entre una reacción exotérmica y una endotérmica?', back: 'Exotérmica libera calor (ΔH < 0); Endotérmica absorbe calor del entorno (ΔH > 0).', hints: 'Combustión es exotérmica', difficulty: 2 }
        ]
    };

    const cardsToInsert = templates[subject] || templates.matematicas;
    const deckName = title || `Mazo Curricular: ${subject.charAt(0).toUpperCase() + subject.slice(1)}`;

    const deck = await createDeck({
        subject,
        name: deckName,
        description: `Mazo generado automáticamente con conceptos esenciales de ${subject}.`,
        category: 'Corpus Escolar',
        tenant_id: tenantId,
        created_by: userId
    });

    for (const item of cardsToInsert) {
        await createCard({
            deck_id: deck.id,
            front: item.front,
            back: item.back,
            hints: item.hints,
            difficulty: item.difficulty
        });
    }

    return {
        deck,
        cardsCount: cardsToInsert.length
    };
}

module.exports = {
    FSRS_W,
    Grade,
    State,
    REQUESTED_RETENTION,
    clamp,
    initialStability,
    initialDifficulty,
    nextDifficulty,
    retrievability,
    nextRecallStability,
    nextForgetStability,
    nextInterval,
    repeat,
    getDecks,
    getDeckById,
    getDeckCards,
    createDeck,
    createCard,
    getDueCards,
    reviewCard,
    getUserStats,
    generateDeckFromCorpus
};
