/**
 * 🧠 PERSONALITY & ADAPTIVE LEARNING SERVICE (VAK + Spaced Repetition)
 * Bachillerato General Estatal "Héroes de la Patria"
 * Recuperado de código legacy y actualizado para FASE 5 (Semanas 18-20)
 */

const { executeQuery, getPool } = require('../data/database-access.js');
const devLogger = require('../utils/devLogger.js');

class PersonalityProfilingService {
    constructor() {
        this.tablesInitialized = false;
        this.initTables();
    }

    /**
     * Asegura que existan las tablas requeridas en PostgreSQL
     */
    async initTables() {
        if (this.tablesInitialized) return;
        try {
            const createProfilesTable = `
                CREATE TABLE IF NOT EXISTS student_personality_profiles (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER UNIQUE NOT NULL,
                    visual_score INTEGER DEFAULT 0,
                    auditory_score INTEGER DEFAULT 0,
                    kinesthetic_score INTEGER DEFAULT 0,
                    dominant_style VARCHAR(50) DEFAULT 'multimodal',
                    peak_performance_hour VARCHAR(50),
                    attention_span_minutes INTEGER DEFAULT 25,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );
            `;

            const createResponsesTable = `
                CREATE TABLE IF NOT EXISTS personality_assessment_responses (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    question_id VARCHAR(50) NOT NULL,
                    answer_value INTEGER NOT NULL,
                    category VARCHAR(50) NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            `;

            const createSpacedRepTable = `
                CREATE TABLE IF NOT EXISTS spaced_repetition_items (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    subject VARCHAR(100) NOT NULL,
                    topic VARCHAR(255) NOT NULL,
                    repetition_level INTEGER DEFAULT 1,
                    interval_days INTEGER DEFAULT 1,
                    last_score INTEGER DEFAULT 3,
                    next_review_date TIMESTAMP DEFAULT (NOW() + INTERVAL '1 day'),
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );
            `;

            await executeQuery(createProfilesTable);
            await executeQuery(createResponsesTable);
            await executeQuery(createSpacedRepTable);
            this.tablesInitialized = true;
            devLogger.log('[VAK-SERVICE] Tablas de perfilado y spaced repetition inicializadas');
        } catch (error) {
            devLogger.warn('[VAK-SERVICE] Error inicializando tablas (fallback seguro):', error.message);
        }
    }

    /**
     * Obtener perfil de aprendizaje del usuario
     */
    async getProfile(userId) {
        await this.initTables();
        try {
            const query = `SELECT * FROM student_personality_profiles WHERE user_id = $1`;
            const rows = await executeQuery(query, [userId]);
            if (rows && rows.length > 0) return rows[0];

            return {
                user_id: userId,
                visual_score: 15,
                auditory_score: 10,
                kinesthetic_score: 10,
                dominant_style: 'visual',
                attention_span_minutes: 25
            };
        } catch (e) {
            return {
                user_id: userId,
                visual_score: 15,
                auditory_score: 10,
                kinesthetic_score: 10,
                dominant_style: 'visual'
            };
        }
    }

    /**
     * Procesar Assessment (Quiz VAK)
     * Recibe: responses: [{ questionId: 'q1', category: 'visual', value: 5 }, ...]
     */
    async processVAKAssessment(userId, responses = []) {
        await this.initTables();
        let v = 0, a = 0, k = 0;

        for (const r of responses) {
            const val = parseInt(r.value) || 1;
            if (r.category === 'visual') v += val;
            else if (r.category === 'auditory') a += val;
            else if (r.category === 'kinesthetic') k += val;
        }

        // Si no hay respuestas válidas, asignar valores base
        if (v === 0 && a === 0 && k === 0) {
            v = 15; a = 10; k = 8;
        }

        // Determinar estilo dominante
        let dominant = 'multimodal';
        if (v > a && v > k) dominant = 'visual';
        else if (a > v && a > k) dominant = 'auditory';
        else if (k > v && k > a) dominant = 'kinesthetic';

        try {
            const upsertQuery = `
                INSERT INTO student_personality_profiles (user_id, visual_score, auditory_score, kinesthetic_score, dominant_style, updated_at)
                VALUES ($1, $2, $3, $4, $5, NOW())
                ON CONFLICT (user_id) DO UPDATE SET
                    visual_score = $2,
                    auditory_score = $3,
                    kinesthetic_score = $4,
                    dominant_style = $5,
                    updated_at = NOW()
                RETURNING *
            `;
            const rows = await executeQuery(upsertQuery, [userId, v, a, k, dominant]);
            devLogger.log(`[VAK-SERVICE] Usuario ${userId} perfilado: ${dominant} (V:${v} A:${a} K:${k})`);

            return rows[0] || { user_id: userId, visual_score: v, auditory_score: a, kinesthetic_score: k, dominant_style: dominant };
        } catch (error) {
            devLogger.warn('[VAK-SERVICE] Error en upsert VAK:', error.message);
            return { user_id: userId, visual_score: v, auditory_score: a, kinesthetic_score: k, dominant_style: dominant };
        }
    }

    /**
     * Recomendación heurística de formato de lección según perfil VAK
     */
    getLessonRecommendation(dominantStyle = 'visual', topic = 'Tema General') {
        const recommendations = {
            visual: {
                format: 'Infografía y Video Ilustrado',
                contentType: 'video_diagram',
                recommendedResources: [
                    `Mapa conceptual detallado de ${topic}`,
                    `Infografía resumen con diagramas explicativos`,
                    `Video con animaciones y esquemas visuales paso a paso`
                ],
                pedagogicalTip: 'Utiliza esquemas de colores y tarjetas visuales para retener mejor los conceptos clave.'
            },
            auditory: {
                format: 'Podcast y Debate Guiado',
                contentType: 'audio_podcast',
                recommendedResources: [
                    `Episodio de audio explicativo de 10 minutos sobre ${topic}`,
                    `Debate socrático guiado con el Tutor IA`,
                    `Resumen narrado con analogías verbales`
                ],
                pedagogicalTip: 'Lee los conceptos en voz alta o graba notas de voz con tus propias explicaciones.'
            },
            kinesthetic: {
                format: 'Laboratorio y Simulador Práctico',
                contentType: 'interactive_lab',
                recommendedResources: [
                    `Simulador interactivo de ${topic} con manipulación de variables`,
                    `Guía de ejercicios prácticos aplicados a la vida real`,
                    `Reto interactivo gamificado con retroalimentación inmediata`
                ],
                pedagogicalTip: 'Aprende haciendo: realiza ejercicios prácticos y construye modelos o simulaciones.'
            },
            multimodal: {
                format: 'Lección Híbrida Interactiva',
                contentType: 'multimedia_hybrid',
                recommendedResources: [
                    `Módulo interactivo con video, infografía y ejercicios prácticos de ${topic}`
                ],
                pedagogicalTip: 'Alterna entre lectura visual y resolución de ejercicios prácticos para mayor retención.'
            }
        };

        const result = recommendations[dominantStyle.toLowerCase()] || recommendations.visual;
        return {
            dominantStyle,
            topic,
            ...result
        };
    }

    /**
     * Agendar Repaso Espaciado (Spaced Repetition Heurístico)
     * Intervalos: 1 día -> 3 días -> 7 días -> 14 días -> 30 días
     * @param {number} performanceScore - Calificación de autoevaluación (1: No lo sé, 3: Dudoso, 5: Dominado)
     */
    async scheduleSpacedRepetition(userId, subject, topic, performanceScore = 4) {
        await this.initTables();
        const score = parseInt(performanceScore) || 3;

        // Intervalos fijos progresivos según nivel
        const intervals = [1, 3, 7, 14, 30];

        try {
            // Buscar si ya existe el ítem para este tema
            const checkQuery = `
                SELECT id, repetition_level, interval_days
                FROM spaced_repetition_items
                WHERE user_id = $1 AND topic = $2
                LIMIT 1
            `;
            const existing = await executeQuery(checkQuery, [userId, topic]);

            let newLevel = 1;
            let intervalDays = 1;

            if (existing && existing.length > 0) {
                const currentLevel = existing[0].repetition_level || 1;
                if (score >= 4) {
                    // Avance de nivel
                    newLevel = Math.min(5, currentLevel + 1);
                    intervalDays = intervals[newLevel - 1];
                } else if (score <= 2) {
                    // Fallo: reinicio a nivel 1
                    newLevel = 1;
                    intervalDays = 1;
                } else {
                    // Dudoso: mantiene nivel
                    newLevel = currentLevel;
                    intervalDays = intervals[currentLevel - 1] || 3;
                }

                const nextDate = new Date();
                nextDate.setDate(nextDate.getDate() + intervalDays);

                const updateQuery = `
                    UPDATE spaced_repetition_items
                    SET repetition_level = $1, interval_days = $2, last_score = $3, next_review_date = $4, updated_at = NOW()
                    WHERE id = $5
                    RETURNING *
                `;
                const updated = await executeQuery(updateQuery, [newLevel, intervalDays, score, nextDate.toISOString(), existing[0].id]);
                return updated[0];
            } else {
                // Primer agendamiento
                newLevel = score >= 4 ? 2 : 1;
                intervalDays = intervals[newLevel - 1];
                const nextDate = new Date();
                nextDate.setDate(nextDate.getDate() + intervalDays);

                const insertQuery = `
                    INSERT INTO spaced_repetition_items (user_id, subject, topic, repetition_level, interval_days, last_score, next_review_date)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    RETURNING *
                `;
                const inserted = await executeQuery(insertQuery, [userId, subject, topic, newLevel, intervalDays, score, nextDate.toISOString()]);
                return inserted[0];
            }
        } catch (e) {
            devLogger.warn('[VAK-SERVICE] Error en scheduleSpacedRepetition:', e.message);
            const nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + 3);
            return {
                user_id: userId,
                subject,
                topic,
                repetition_level: score >= 4 ? 2 : 1,
                interval_days: score >= 4 ? 3 : 1,
                next_review_date: nextDate.toISOString()
            };
        }
    }

    /**
     * Obtener temas pendientes de repaso para hoy
     */
    async getDueReviews(userId) {
        await this.initTables();
        try {
            const query = `
                SELECT id, subject, topic, repetition_level, interval_days, next_review_date
                FROM spaced_repetition_items
                WHERE user_id = $1 AND next_review_date <= (NOW() + INTERVAL '1 day')
                ORDER BY next_review_date ASC
            `;
            const rows = await executeQuery(query, [userId]);
            return rows || [];
        } catch (e) {
            devLogger.warn('[VAK-SERVICE] Error en getDueReviews:', e.message);
            return [];
        }
    }
}

module.exports = new PersonalityProfilingService();
