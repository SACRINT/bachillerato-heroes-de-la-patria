/**
 * Adaptive Learning & AI Tools Service
 * Sistema completo de aprendizaje adaptativo e inteligencia artificial
 * Semanas 56-65: Lecciones adaptativas + Herramientas de IA
 */

import { executeQuery } from '../config/database';

// ============================================
// ADAPTIVE LEARNING SERVICE (Sem 56-60)
// ============================================

export interface LearningStyle {
    visual: number;
    auditivo: number;
    kinestesico: number;
    lectura_escritura: number;
}

class AdaptiveLearningService {
    /**
     * Test de estilos de aprendizaje VARK
     */
    async takeLearningStyleTest(userId: number, respuestas: number[]): Promise<LearningStyle> {
        // Algoritmo VARK simplificado (16 preguntas, 4 opciones c/u)
        let visual = 0, auditivo = 0, kinestesico = 0, lectura = 0;

        respuestas.forEach((respuesta, index) => {
            switch (respuesta) {
                case 0: visual++; break;
                case 1: auditivo++; break;
                case 2: lectura++; break;
                case 3: kinestesico++; break;
            }
        });

        const total = visual + auditivo + kinestesico + lectura;
        const result: LearningStyle = {
            visual: Math.round((visual / total) * 100),
            auditivo: Math.round((auditivo / total) * 100),
            kinestesico: Math.round((kinestesico / total) * 100),
            lectura_escritura: Math.round((lectura / total) * 100)
        };

        // Guardar resultado
        await executeQuery(`
            INSERT INTO learning_styles (user_id, visual, auditivo, kinestesico, lectura_escritura)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (user_id) DO UPDATE
            SET visual = $2, auditivo = $3, kinestesico = $4, lectura_escritura = $5, updated_at = CURRENT_TIMESTAMP
        `, [userId, result.visual, result.auditivo, result.kinestesico, result.lectura_escritura]);

        return result;
    }

    /**
     * Generar ruta de aprendizaje personalizada
     */
    async generateLearningPath(userId: number, materiaId: number): Promise<any[]> {
        // Obtener estilo de aprendizaje
        const style = await executeQuery(`
            SELECT * FROM learning_styles WHERE user_id = $1
        `, [userId]) as any[];

        // Obtener nivel actual del estudiante
        const nivel = await this.getStudentLevel(userId, materiaId);

        // Obtener contenidos disponibles
        const contenidos = await executeQuery(`
            SELECT * FROM contenidos_educativos
            WHERE materia_id = $1 AND nivel_dificultad <= $2
            ORDER BY orden
        `, [materiaId, nivel]) as any[];

        // Personalizar según estilo de aprendizaje
        const path = contenidos.map(contenido => {
            const preferencias = style[0] || {};
            const dominante = this.getDominantStyle(preferencias);

            return {
                ...contenido,
                formato_recomendado: this.getRecommendedFormat(dominante),
                prioridad: this.calculatePriority(contenido, preferencias)
            };
        });

        // Guardar ruta
        await executeQuery(`
            INSERT INTO learning_paths (user_id, materia_id, path_data, created_at)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        `, [userId, materiaId, JSON.stringify(path)]);

        return path.sort((a, b) => b.prioridad - a.prioridad);
    }

    /**
     * Evaluación adaptativa (ajusta dificultad según respuestas)
     */
    async conductAdaptiveAssessment(userId: number, materiaId: number): Promise<any> {
        let nivel = 5; // Nivel inicial (1-10)
        let correctas = 0;
        let incorrectas = 0;
        const preguntas = [];

        for (let i = 0; i < 10; i++) {
            // Obtener pregunta del nivel actual
            const pregunta = await this.getQuestionByLevel(materiaId, nivel);
            preguntas.push(pregunta);

            // Simular respuesta (en producción, esperar respuesta real del usuario)
            const respuestaCorrecta = Math.random() > 0.5; // Mock

            if (respuestaCorrecta) {
                correctas++;
                nivel = Math.min(10, nivel + 1); // Subir dificultad
            } else {
                incorrectas++;
                nivel = Math.max(1, nivel - 1); // Bajar dificultad
            }
        }

        const nivelFinal = Math.round((correctas / 10) * 10);

        // Guardar resultado
        await executeQuery(`
            INSERT INTO adaptive_assessments (user_id, materia_id, nivel_inicial, nivel_final, correctas, incorrectas)
            VALUES ($1, $2, 5, $3, $4, $5)
        `, [userId, materiaId, nivelFinal, correctas, incorrectas]);

        return {
            nivel_determinado: nivelFinal,
            correctas,
            incorrectas,
            recomendacion: this.getStudyRecommendation(nivelFinal)
        };
    }

    /**
     * Recomendaciones de estudio personalizadas
     */
    async getStudyRecommendations(userId: number): Promise<any[]> {
        const [calificaciones, estilo, progreso] = await Promise.all([
            executeQuery(`
                SELECT materia_id, AVG(calificacion) as promedio
                FROM calificaciones
                WHERE estudiante_id = (SELECT id FROM estudiantes WHERE usuario_id = $1)
                GROUP BY materia_id
            `, [userId]),
            executeQuery('SELECT * FROM learning_styles WHERE user_id = $1', [userId]),
            executeQuery(`
                SELECT materia_id, progreso_porcentaje
                FROM learning_progress
                WHERE user_id = $1
            `, [userId])
        ]);

        const recomendaciones = [];

        // Recomendar refuerzo en materias con bajo promedio
        for (const cal of calificaciones as any[]) {
            if (cal.promedio < 7) {
                recomendaciones.push({
                    tipo: 'refuerzo',
                    materia_id: cal.materia_id,
                    razon: 'Promedio bajo',
                    prioridad: 'alta',
                    recursos: await this.getRemedialResources(cal.materia_id, estilo[0])
                });
            }
        }

        // Recomendar avance en materias con buen progreso
        for (const prog of progreso as any[]) {
            if (prog.progreso_porcentaje > 80) {
                recomendaciones.push({
                    tipo: 'avance',
                    materia_id: prog.materia_id,
                    razon: 'Buen progreso, listo para avanzar',
                    prioridad: 'media',
                    recursos: await this.getAdvancedResources(prog.materia_id)
                });
            }
        }

        return recomendaciones;
    }

    /**
     * Seguimiento de progreso adaptativo
     */
    async trackProgress(userId: number, contenidoId: number, completado: boolean, tiempoGastado: number): Promise<void> {
        await executeQuery(`
            INSERT INTO learning_progress (user_id, contenido_id, completado, tiempo_gastado, fecha_acceso)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, contenido_id) DO UPDATE
            SET completado = $3, tiempo_gastado = learning_progress.tiempo_gastado + $4, 
                fecha_acceso = CURRENT_TIMESTAMP, accesos = learning_progress.accesos + 1
        `, [userId, contenidoId, completado, tiempoGastado]);

        // Actualizar estadísticas generales
        await this.updateOverallProgress(userId);
    }

    // Helper methods
    private async getStudentLevel(userId: number, materiaId: number): Promise<number> {
        const result = await executeQuery(`
            SELECT AVG(calificacion) as promedio
            FROM calificaciones c
            JOIN estudiantes e ON c.estudiante_id = e.id
            WHERE e.usuario_id = $1 AND c.materia_id = $2
        `, [userId, materiaId]) as any[];

        const promedio = result[0]?.promedio || 5;
        return Math.ceil(promedio); // 1-10
    }

    private getDominantStyle(styles: LearningStyle): string {
        const max = Math.max(styles.visual, styles.auditivo, styles.kinestesico, styles.lectura_escritura);
        if (max === styles.visual) return 'visual';
        if (max === styles.auditivo) return 'auditivo';
        if (max === styles.kinestesico) return 'kinestesico';
        return 'lectura';
    }

    private getRecommendedFormat(style: string): string {
        const formats = {
            visual: 'video, infografias, diagramas',
            auditivo: 'podcast, audio, conferencias',
            kinestesico: 'laboratorio, simulaciones, practica',
            lectura: 'documentos, articulos, libros'
        };
        return formats[style] || 'mixto';
    }

    private calculatePriority(contenido: any, preferencias: LearningStyle): number {
        // Algoritmo simple de priorización
        return contenido.importancia * (preferencias.visual / 100);
    }

    private async getQuestionByLevel(materiaId: number, nivel: number): Promise<any> {
        const result = await executeQuery(`
            SELECT * FROM banco_preguntas
            WHERE materia_id = $1 AND nivel_dificultad = $2
            ORDER BY RANDOM()
            LIMIT 1
        `, [materiaId, nivel]) as any[];
        return result[0] || {};
    }

    private getStudyRecommendation(nivel: number): string {
        if (nivel < 5) return 'Requiere refuerzo intensivo en conceptos básicos';
        if (nivel < 7) return 'Reforzar conceptos intermedios';
        if (nivel < 9) return 'Continuar con material avanzado';
        return 'Excelente nivel, listo para retos avanzados';
    }

    private async getRemedialResources(materiaId: number, estilo: any): Promise<any[]> {
        return await executeQuery(`
            SELECT * FROM contenidos_educativos
            WHERE materia_id = $1 AND tipo_recurso = 'refuerzo'
            ORDER BY nivel_dificultad
            LIMIT 5
        `, [materiaId]) as any[];
    }

    private async getAdvancedResources(materiaId: number): Promise<any[]> {
        return await executeQuery(`
            SELECT * FROM contenidos_educativos
            WHERE materia_id = $1 AND nivel_dificultad >= 7
            ORDER BY nivel_dificultad DESC
            LIMIT 5
        `, [materiaId]) as any[];
    }

    private async updateOverallProgress(userId: number): Promise<void> {
        await executeQuery(`
            UPDATE usuarios
            SET progreso_general = (
                SELECT AVG(CASE WHEN completado THEN 100 ELSE 0 END)
                FROM learning_progress WHERE user_id = $1
            )
            WHERE id = $1
        `, [userId]);
    }
}

// ============================================
// AI TOOLS SERVICE (Sem 61-65)
// ============================================

class AIToolsService {
    /**
     * Tutor IA con LLM (mock - en producción usar OpenAI/Claude)
     */
    async chatWithAITutor(userId: number, mensaje: string, contexto?: any): Promise<string> {
        // TODO: Integrar con OpenAI API o similar
        // const response = await openai.chat.completions.create({
        //     model: "gpt-4",
        //     messages: [
        //         { role: "system", content: "Eres un tutor educativo experto..." },
        //         { role: "user", content: mensaje }
        //     ]
        // });

        // Mock response
        const respuesta = `Entiendo tu pregunta sobre "${mensaje}". Déjame explicarte...`;

        // Guardar conversación
        await executeQuery(`
            INSERT INTO ai_tutor_conversations (user_id, mensaje_usuario, respuesta_ia, contexto)
            VALUES ($1, $2, $3, $4)
        `, [userId, mensaje, respuesta, JSON.stringify(contexto || {})]);

        return respuesta;
    }

    /**
     * Generador de mapas conceptuales
     */
    async generateConceptMap(tema: string, materiaId: number): Promise<any> {
        // Obtener conceptos relacionados
        const conceptos = await executeQuery(`
            SELECT * FROM conceptos WHERE materia_id = $1 AND tema ILIKE $2
        `, [materiaId, `%${tema}%`]) as any[];

        // Construir grafo de relaciones
        const nodes = conceptos.map(c => ({
            id: c.id,
            label: c.nombre,
            nivel: c.nivel,
            descripcion: c.descripcion
        }));

        const edges = await executeQuery(`
            SELECT * FROM concepto_relaciones WHERE concepto_origen IN (${conceptos.map(c => c.id).join(',')})
        `, []) as any[];

        return {
            nodes,
            edges: edges.map(e => ({
                from: e.concepto_origen,
                to: e.concepto_destino,
                tipo: e.tipo_relacion
            }))
        };
    }

    /**
     * Grafo de conocimiento interactivo
     */
    async buildKnowledgeGraph(userId: number): Promise<any> {
        // Obtener todo lo que el usuario ha estudiado
        const progreso = await executeQuery(`
            SELECT lp.*, ce.tema, ce.materia_id
            FROM learning_progress lp
            JOIN contenidos_educativos ce ON lp.contenido_id = ce.id
            WHERE lp.user_id = $1 AND lp.completado = true
        `, [userId]) as any[];

        // Construir grafo de conocimiento personal
        const dominios = {};
        progreso.forEach(p => {
            if (!dominios[p.materia_id]) {
                dominios[p.materia_id] = [];
            }
            dominios[p.materia_id].push(p.tema);
        });

        return {
            usuario_id: userId,
            dominios_maestria: dominios,
            total_conceptos: progreso.length,
            fortalezas: await this.identifyStrengths(userId),
            debilidades: await this.identifyWeaknesses(userId)
        };
    }

    /**
     * Análisis de sentimiento en foros/comentarios
     */
    async analyzeSentiment(texto: string): Promise<any> {
        // TODO: Usar API de análisis de sentimiento (Google Cloud NLP, AWS Comprehend, etc.)

        // Mock análisis simple basado en palabras clave
        const positiveWords = ['excelente', 'bueno', 'genial', 'interesante', 'útil'];
        const negativeWords = ['malo', 'difícil', 'confuso', 'aburrido', 'frustrante'];

        const textoLower = texto.toLowerCase();
        let score = 0;

        positiveWords.forEach(word => {
            if (textoLower.includes(word)) score += 1;
        });

        negativeWords.forEach(word => {
            if (textoLower.includes(word)) score -= 1;
        });

        const sentiment = score > 0 ? 'positivo' : score < 0 ? 'negativo' : 'neutral';

        return {
            texto,
            sentimiento: sentiment,
            score: score / 10,
            confianza: Math.abs(score) > 2 ? 'alta' : 'media'
        };
    }

    /**
     * Predicción de deserción (ML model)
     */
    async predictDropoutRisk(estudianteId: number): Promise<any> {
        // Recopilar features
        const features = await this.collectStudentFeatures(estudianteId);

        // TODO: Usar modelo ML real (TensorFlow.js, scikit-learn API, etc.)
        // const prediction = await mlModel.predict(features);

        // Mock prediction basado en heurísticas
        let riesgo = 0;

        if (features.promedio < 6) riesgo += 30;
        if (features.asistencia < 80) riesgo += 25;
        if (features.tareas_completadas < 70) riesgo += 20;
        if (features.dias_sin_login > 7) riesgo += 15;
        if (features.interacciones_profesor < 5) riesgo += 10;

        const nivelRiesgo = riesgo > 60 ? 'alto' : riesgo > 30 ? 'medio' : 'bajo';

        // Guardar predicción
        await executeQuery(`
            INSERT INTO dropout_predictions (estudiante_id, riesgo_porcentaje, nivel_riesgo, features)
            VALUES ($1, $2, $3, $4)
        `, [estudianteId, riesgo, nivelRiesgo, JSON.stringify(features)]);

        // Si riesgo alto, generar alerta
        if (nivelRiesgo === 'alto') {
            await this.generateDropoutAlert(estudianteId, riesgo, features);
        }

        return {
            estudiante_id: estudianteId,
            riesgo_porcentaje: riesgo,
            nivel: nivelRiesgo,
            factores_riesgo: this.identifyRiskFactors(features),
            recomendaciones: this.getInterventionRecommendations(nivelRiesgo)
        };
    }

    /**
     * Asistente de voz (preparado para Web Speech API)
     */
    async processVoiceCommand(userId: number, audioData: string): Promise<any> {
        // TODO: Integrar con Web Speech API o Google Speech-to-Text

        // Mock transcription
        const transcription = "buscar información sobre la revolución mexicana";

        // Procesar comando
        const intent = await this.parseIntent(transcription);

        // Ejecutar acción
        const result = await this.executeVoiceAction(userId, intent);

        return {
            transcription,
            intent,
            result,
            response_audio: "audio_response_url.mp3" // TTS response
        };
    }

    // Helper methods
    private async collectStudentFeatures(estudianteId: number): Promise<any> {
        const [calificaciones, asistencia, tareas, logins] = await Promise.all([
            executeQuery('SELECT AVG(calificacion) as promedio FROM calificaciones WHERE estudiante_id = $1', [estudianteId]),
            executeQuery('SELECT (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM clases_programadas))::INT as porcentaje FROM asistencia WHERE estudiante_id = $1 AND presente = true', [estudianteId]),
            executeQuery('SELECT (COUNT(CASE WHEN status = \'completado\' THEN 1 END) * 100.0 / COUNT(*))::INT as porcentaje FROM entregas_tareas WHERE estudiante_id = $1', [estudianteId]),
            executeQuery('SELECT EXTRACT(DAY FROM CURRENT_TIMESTAMP - MAX(last_login)) as dias FROM user_streaks us JOIN estudiantes e ON us.user_id = e.usuario_id WHERE e.id = $1', [estudianteId])
        ]);

        return {
            promedio: (calificaciones as any[])[0]?.promedio || 0,
            asistencia: (asistencia as any[])[0]?.porcentaje || 0,
            tareas_completadas: (tareas as any[])[0]?.porcentaje || 0,
            dias_sin_login: (logins as any[])[0]?.dias || 0,
            interacciones_profesor: 5 // Mock
        };
    }

    private identifyRiskFactors(features: any): string[] {
        const factors = [];
        if (features.promedio < 6) factors.push('Bajo rendimiento académico');
        if (features.asistencia < 80) factors.push('Ausentismo frecuente');
        if (features.tareas_completadas < 70) factors.push('Incumplimiento de tareas');
        if (features.dias_sin_login > 7) factors.push('Baja participación en plataforma');
        return factors;
    }

    private getInterventionRecommendations(nivel: string): string[] {
        if (nivel === 'alto') {
            return [
                'Reunión urgente con  padres y tutor',
                'Asignar mentor o tutor personalizado',
                'Plan de recuperación académica',
                'Sesiones de orientación psicopedagógica'
            ];
        } else if (nivel === 'medio') {
            return [
                'Monitoreo cercano del progreso',
                'Tutorías de refuerzo',
                'Comunicación con padres'
            ];
        }
        return ['Continuar con seguimiento regular'];
    }

    private async generateDropoutAlert(estudianteId: number, riesgo: number, features: any): Promise<void> {
        await executeQuery(`
            INSERT INTO notifications (user_id, tipo, titulo, mensaje, prioridad)
            SELECT 
                usuario_id,
                'dropout_alert',
                'Alerta de Riesgo de Deserción',
                'Estudiante en riesgo alto de deserción (${riesgo}%). Requiere intervención inmediata.',
                'critica'
            FROM estudiantes WHERE id = $1
        `, [estudianteId]);
    }

    private async identifyStrengths(userId: number): Promise<string[]> {
        const result = await executeQuery(`
            SELECT m.nombre
            FROM calificaciones c
            JOIN materias m ON c.materia_id = m.id
            JOIN estudiantes e ON c.estudiante_id = e.id
            WHERE e.usuario_id = $1
            GROUP BY m.nombre
            HAVING AVG(c.calificacion) >= 9
        `, [userId]) as any[];
        return result.map(r => r.nombre);
    }

    private async identifyWeaknesses(userId: number): Promise<string[]> {
        const result = await executeQuery(`
            SELECT m.nombre
            FROM calificaciones c
            JOIN materias m ON c.materia_id = m.id
            JOIN estudiantes e ON c.estudiante_id = e.id
            WHERE e.usuario_id = $1
            GROUP BY m.nombre
            HAVING AVG(c.calificacion) < 7
        `, [userId]) as any[];
        return result.map(r => r.nombre);
    }

    private async parseIntent(text: string): Promise<any> {
        // Simple intent parsing
        if (text.includes('buscar')) {
            return { action: 'search', query: text.replace('buscar', '').trim() };
        }
        if (text.includes('calificaciones')) {
            return { action: 'get_grades' };
        }
        if (text.includes('tareas')) {
            return { action: 'get_tasks' };
        }
        return { action: 'chat', message: text };
    }

    private async executeVoiceAction(userId: number, intent: any): Promise<any> {
        switch (intent.action) {
            case 'search':
                return await this.searchContent(intent.query);
            case 'get_grades':
                return await this.getUserGrades(userId);
            case 'get_tasks':
                return await this.getUserTasks(userId);
            default:
                return await this.chatWithAITutor(userId, intent.message);
        }
    }

    private async searchContent(query: string): Promise<any[]> {
        return await executeQuery(`
            SELECT * FROM contenidos_educativos
            WHERE tema ILIKE $1 OR descripcion ILIKE $1
            LIMIT 5
        `, [`%${query}%`]) as any[];
    }

    private async getUserGrades(userId: number): Promise<any[]> {
        return await executeQuery(`
            SELECT * FROM calificaciones c
            JOIN estudiantes e ON c.estudiante_id = e.id
            WHERE e.usuario_id = $1
            ORDER BY c.fecha DESC
            LIMIT 10
        `, [userId]) as any[];
    }

    private async getUserTasks(userId: number): Promise<any[]> {
        return await executeQuery(`
            SELECT * FROM entregas_tareas et
            JOIN estudiantes e ON et.estudiante_id = e.id
            WHERE e.usuario_id = $1 AND et.status = 'pendiente'
            ORDER BY et.fecha_limite
        `, [userId]) as any[];
    }
}

// Export instances
export const adaptiveLearningService = new AdaptiveLearningService();
export const aiToolsService = new AIToolsService();
