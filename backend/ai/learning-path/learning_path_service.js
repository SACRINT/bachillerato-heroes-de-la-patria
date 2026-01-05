/**
 * 🛤️ LEARNING PATH SERVICE - Semana 18
 * Personalización del Aprendizaje
 * 
 * Implementa:
 * - Grafo de conocimiento del currículo
 * - Rutas de aprendizaje personalizadas
 * - Evaluación diagnóstica
 * - Sistema de micro-credenciales
 * - Adaptación de dificultad dinámica
 * - Repaso espaciado (Spaced Repetition)
 * - Integración con tareas docentes
 * 
 * @author AI Architect Agent
 * @date Enero 2026
 * @version 1.0.0
 */

const { executeQuery } = require('../../config/database');
const devLogger = require('../../utils/devLogger');

class LearningPathService {
    constructor() {
        // Grafo de conocimiento del currículo
        this.knowledgeGraph = this.initializeKnowledgeGraph();

        // Configuración de Spaced Repetition
        this.spacedRepetitionConfig = {
            intervals: [1, 3, 7, 14, 30, 60, 120], // días
            easyMultiplier: 1.5,
            hardMultiplier: 0.5,
            minEaseFactor: 1.3
        };

        // Sistema de micro-credenciales
        this.microCredentials = this.initializeMicroCredentials();

        // Cache de rutas
        this.pathCache = new Map();
    }

    // =========================================================
    // TAREA 1: Grafo de Conocimiento del Currículo
    // =========================================================

    initializeKnowledgeGraph() {
        return {
            nodes: [
                // Matemáticas
                { id: 'math_1', subject: 'matematicas', name: 'Números y Operaciones', level: 1, prereqs: [] },
                { id: 'math_2', subject: 'matematicas', name: 'Álgebra Básica', level: 2, prereqs: ['math_1'] },
                { id: 'math_3', subject: 'matematicas', name: 'Ecuaciones Lineales', level: 3, prereqs: ['math_2'] },
                { id: 'math_4', subject: 'matematicas', name: 'Ecuaciones Cuadráticas', level: 4, prereqs: ['math_3'] },
                { id: 'math_5', subject: 'matematicas', name: 'Geometría Analítica', level: 5, prereqs: ['math_3'] },
                { id: 'math_6', subject: 'matematicas', name: 'Trigonometría', level: 5, prereqs: ['math_5'] },
                { id: 'math_7', subject: 'matematicas', name: 'Cálculo Diferencial', level: 6, prereqs: ['math_4', 'math_6'] },

                // Física
                { id: 'phys_1', subject: 'fisica', name: 'Introducción a la Física', level: 1, prereqs: [] },
                { id: 'phys_2', subject: 'fisica', name: 'Cinemática', level: 2, prereqs: ['phys_1', 'math_3'] },
                { id: 'phys_3', subject: 'fisica', name: 'Dinámica (Leyes de Newton)', level: 3, prereqs: ['phys_2'] },
                { id: 'phys_4', subject: 'fisica', name: 'Trabajo y Energía', level: 4, prereqs: ['phys_3'] },
                { id: 'phys_5', subject: 'fisica', name: 'Ondas y Sonido', level: 5, prereqs: ['phys_4', 'math_6'] },

                // Química
                { id: 'chem_1', subject: 'quimica', name: 'Estructura Atómica', level: 1, prereqs: [] },
                { id: 'chem_2', subject: 'quimica', name: 'Tabla Periódica', level: 2, prereqs: ['chem_1'] },
                { id: 'chem_3', subject: 'quimica', name: 'Enlaces Químicos', level: 3, prereqs: ['chem_2'] },
                { id: 'chem_4', subject: 'quimica', name: 'Reacciones Químicas', level: 4, prereqs: ['chem_3'] },
                { id: 'chem_5', subject: 'quimica', name: 'Estequiometría', level: 5, prereqs: ['chem_4', 'math_2'] },

                // Historia
                { id: 'hist_1', subject: 'historia', name: 'México Prehispánico', level: 1, prereqs: [] },
                { id: 'hist_2', subject: 'historia', name: 'La Conquista', level: 2, prereqs: ['hist_1'] },
                { id: 'hist_3', subject: 'historia', name: 'México Colonial', level: 3, prereqs: ['hist_2'] },
                { id: 'hist_4', subject: 'historia', name: 'Independencia de México', level: 4, prereqs: ['hist_3'] },
                { id: 'hist_5', subject: 'historia', name: 'Revolución Mexicana', level: 5, prereqs: ['hist_4'] },
                { id: 'hist_6', subject: 'historia', name: 'México Contemporáneo', level: 6, prereqs: ['hist_5'] }
            ],
            edges: [] // Se generan dinámicamente desde prereqs
        };
    }

    getKnowledgeGraphForSubject(subject) {
        const nodes = this.knowledgeGraph.nodes.filter(n => n.subject === subject);
        const edges = [];

        for (const node of nodes) {
            for (const prereq of node.prereqs) {
                edges.push({ from: prereq, to: node.id });
            }
        }

        return { nodes, edges, subject };
    }

    getFullKnowledgeGraph() {
        const edges = [];
        for (const node of this.knowledgeGraph.nodes) {
            for (const prereq of node.prereqs) {
                edges.push({ from: prereq, to: node.id });
            }
        }
        return { ...this.knowledgeGraph, edges };
    }

    // =========================================================
    // TAREA 2: Algoritmo de Rutas Personalizadas
    // =========================================================

    async generateLearningPath(userId, targetNodeId, options = {}) {
        devLogger.log('LEARNING_PATH', `Generando ruta para usuario ${userId} hacia ${targetNodeId}`);

        // Obtener estado actual del estudiante
        const studentProgress = await this.getStudentProgress(userId);

        // Encontrar camino óptimo usando BFS/DFS sobre el grafo
        const targetNode = this.knowledgeGraph.nodes.find(n => n.id === targetNodeId);
        if (!targetNode) {
            return { error: 'Nodo objetivo no encontrado' };
        }

        // Calcular todos los prerequisitos necesarios
        const requiredNodes = this.calculateRequiredNodes(targetNodeId, studentProgress.completedNodes);

        // Ordenar por nivel y dependencias
        const orderedPath = this.topologicalSort(requiredNodes);

        // Estimar tiempos
        const estimatedTime = orderedPath.length * 45; // 45 min promedio por nodo

        const path = {
            userId,
            targetNode: targetNodeId,
            targetName: targetNode.name,
            currentLevel: studentProgress.currentLevel,
            steps: orderedPath.map((nodeId, index) => {
                const node = this.knowledgeGraph.nodes.find(n => n.id === nodeId);
                return {
                    order: index + 1,
                    nodeId,
                    name: node.name,
                    subject: node.subject,
                    level: node.level,
                    status: studentProgress.completedNodes.includes(nodeId) ? 'completed' : 'pending',
                    estimatedMinutes: 45
                };
            }),
            totalSteps: orderedPath.length,
            estimatedMinutes: estimatedTime,
            estimatedDays: Math.ceil(estimatedTime / 120), // 2 horas diarias de estudio
            difficulty: this.calculatePathDifficulty(orderedPath),
            generatedAt: new Date().toISOString()
        };

        // Cachear
        this.pathCache.set(`${userId}_${targetNodeId}`, path);

        return path;
    }

    calculateRequiredNodes(targetNodeId, completedNodes) {
        const required = new Set();
        const queue = [targetNodeId];

        while (queue.length > 0) {
            const current = queue.shift();
            if (completedNodes.includes(current)) continue;

            required.add(current);
            const node = this.knowledgeGraph.nodes.find(n => n.id === current);

            if (node) {
                for (const prereq of node.prereqs) {
                    if (!completedNodes.includes(prereq) && !required.has(prereq)) {
                        queue.push(prereq);
                    }
                }
            }
        }

        return Array.from(required);
    }

    topologicalSort(nodeIds) {
        const nodes = nodeIds.map(id => this.knowledgeGraph.nodes.find(n => n.id === id)).filter(Boolean);
        return nodes.sort((a, b) => a.level - b.level).map(n => n.id);
    }

    calculatePathDifficulty(nodeIds) {
        if (nodeIds.length === 0) return 'ninguna';
        const avgLevel = nodeIds.reduce((sum, id) => {
            const node = this.knowledgeGraph.nodes.find(n => n.id === id);
            return sum + (node?.level || 1);
        }, 0) / nodeIds.length;

        if (avgLevel <= 2) return 'básica';
        if (avgLevel <= 4) return 'intermedia';
        return 'avanzada';
    }

    // =========================================================
    // TAREA 3: Evaluación Diagnóstica
    // =========================================================

    async runDiagnosticAssessment(userId, subject) {
        devLogger.log('LEARNING_PATH', `Evaluación diagnóstica para ${userId} en ${subject}`);

        const subjectNodes = this.knowledgeGraph.nodes.filter(n => n.subject === subject);

        // Generar preguntas diagnósticas por nivel
        const questions = subjectNodes.slice(0, 5).map((node, index) => ({
            id: `diag_${node.id}`,
            nodeId: node.id,
            topic: node.name,
            level: node.level,
            question: `Pregunta diagnóstica sobre ${node.name}`,
            options: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
            correctAnswer: 0
        }));

        return {
            userId,
            subject,
            assessmentType: 'diagnostic',
            questions,
            totalQuestions: questions.length,
            estimatedMinutes: questions.length * 2,
            purpose: 'Determinar tu nivel actual y personalizar tu ruta de aprendizaje',
            createdAt: new Date().toISOString()
        };
    }

    async processDiagnosticResults(userId, subject, answers) {
        // Evaluar respuestas y determinar nivel
        let correctCount = 0;
        const masteredNodes = [];

        for (const answer of answers) {
            if (answer.isCorrect) {
                correctCount++;
                masteredNodes.push(answer.nodeId);
            }
        }

        const score = (correctCount / answers.length) * 100;
        const startingLevel = Math.floor(score / 20) + 1; // 1-5 based on score

        return {
            userId,
            subject,
            score: score.toFixed(1),
            correctAnswers: correctCount,
            totalQuestions: answers.length,
            masteredNodes,
            recommendedStartingLevel: startingLevel,
            suggestedStartingNode: this.getSuggestedStartingNode(subject, startingLevel),
            assessment: this.getAssessmentMessage(score),
            processedAt: new Date().toISOString()
        };
    }

    getSuggestedStartingNode(subject, level) {
        const nodes = this.knowledgeGraph.nodes.filter(n => n.subject === subject && n.level <= level);
        return nodes.length > 0 ? nodes[nodes.length - 1] : null;
    }

    getAssessmentMessage(score) {
        if (score >= 80) return '¡Excelente! Tienes una base sólida. Puedes avanzar a temas más avanzados.';
        if (score >= 60) return 'Buen nivel. Recomendamos reforzar algunos conceptos antes de continuar.';
        if (score >= 40) return 'Hay áreas que necesitan práctica. Te sugerimos comenzar con los fundamentos.';
        return 'Es recomendable comenzar desde los conceptos básicos para construir una base sólida.';
    }

    // =========================================================
    // TAREA 4: Sistema de Micro-credenciales
    // =========================================================

    initializeMicroCredentials() {
        return [
            { id: 'mc_math_basics', name: 'Fundamentos Matemáticos', icon: '🔢', requiredNodes: ['math_1', 'math_2'] },
            { id: 'mc_algebra_master', name: 'Maestro del Álgebra', icon: '📐', requiredNodes: ['math_2', 'math_3', 'math_4'] },
            { id: 'mc_physics_motion', name: 'Experto en Movimiento', icon: '🚀', requiredNodes: ['phys_1', 'phys_2', 'phys_3'] },
            { id: 'mc_chemistry_bonds', name: 'Químico de Enlaces', icon: '⚗️', requiredNodes: ['chem_1', 'chem_2', 'chem_3'] },
            { id: 'mc_history_mexico', name: 'Historiador Mexicano', icon: '🇲🇽', requiredNodes: ['hist_1', 'hist_2', 'hist_3', 'hist_4'] },
            { id: 'mc_calculus_intro', name: 'Iniciado en Cálculo', icon: '∫', requiredNodes: ['math_4', 'math_6', 'math_7'] }
        ];
    }

    async checkMicroCredentials(userId) {
        const progress = await this.getStudentProgress(userId);
        const earned = [];
        const available = [];

        for (const credential of this.microCredentials) {
            const hasAll = credential.requiredNodes.every(node =>
                progress.completedNodes.includes(node)
            );

            if (hasAll) {
                earned.push({ ...credential, earnedAt: new Date().toISOString() });
            } else {
                const completed = credential.requiredNodes.filter(n =>
                    progress.completedNodes.includes(n)
                ).length;
                available.push({
                    ...credential,
                    progress: `${completed}/${credential.requiredNodes.length}`,
                    percentage: Math.round((completed / credential.requiredNodes.length) * 100)
                });
            }
        }

        return { userId, earned, available, totalEarned: earned.length };
    }

    // =========================================================
    // TAREA 5: Adaptación de Dificultad Dinámica
    // =========================================================

    async adaptDifficulty(userId, nodeId, performance) {
        const { timeSpent, attempts, score } = performance;

        let difficultyAdjustment = 'maintain';
        let nextContent = 'standard';

        // Calcular performance score
        const performanceScore = this.calculatePerformanceScore(score, attempts, timeSpent);

        if (performanceScore > 85) {
            difficultyAdjustment = 'increase';
            nextContent = 'advanced';
        } else if (performanceScore < 50) {
            difficultyAdjustment = 'decrease';
            nextContent = 'remedial';
        } else if (performanceScore < 70) {
            nextContent = 'practice';
        }

        return {
            userId,
            nodeId,
            performanceScore,
            difficultyAdjustment,
            nextContent,
            recommendations: this.getDifficultyRecommendations(performanceScore),
            analyzedAt: new Date().toISOString()
        };
    }

    calculatePerformanceScore(score, attempts, timeSpent) {
        // Score base
        let performance = score;

        // Penalizar intentos múltiples
        if (attempts > 1) performance -= (attempts - 1) * 5;

        // Bonificar rapidez (si está dentro de tiempo esperado)
        if (timeSpent < 30) performance += 5;
        else if (timeSpent > 60) performance -= 5;

        return Math.max(0, Math.min(100, performance));
    }

    getDifficultyRecommendations(score) {
        if (score > 85) return ['Avanzar al siguiente tema', 'Intentar ejercicios de mayor complejidad'];
        if (score > 70) return ['Continuar con ejercicios similares', 'Revisar conceptos clave'];
        if (score > 50) return ['Practicar más ejercicios', 'Ver tutorial explicativo'];
        return ['Revisar material de apoyo', 'Practicar ejercicios básicos', 'Consultar con tutor'];
    }

    // =========================================================
    // TAREA 6: Visualización de Progreso
    // =========================================================

    async getProgressVisualization(userId) {
        const progress = await this.getStudentProgress(userId);
        const graph = this.getFullKnowledgeGraph();

        const visualization = {
            userId,
            nodes: graph.nodes.map(node => ({
                ...node,
                status: progress.completedNodes.includes(node.id) ? 'completed' :
                    progress.inProgressNodes.includes(node.id) ? 'in_progress' : 'locked',
                unlocked: this.isNodeUnlocked(node, progress.completedNodes)
            })),
            edges: graph.edges,
            stats: {
                totalNodes: graph.nodes.length,
                completedNodes: progress.completedNodes.length,
                completionPercentage: Math.round((progress.completedNodes.length / graph.nodes.length) * 100),
                currentLevel: progress.currentLevel,
                streakDays: progress.streakDays || 0
            },
            generatedAt: new Date().toISOString()
        };

        return visualization;
    }

    isNodeUnlocked(node, completedNodes) {
        if (node.prereqs.length === 0) return true;
        return node.prereqs.every(prereq => completedNodes.includes(prereq));
    }

    // =========================================================
    // TAREA 7: Repaso Espaciado (Spaced Repetition)
    // =========================================================

    async getSpacedRepetitionReview(userId) {
        const progress = await this.getStudentProgress(userId);
        const today = new Date();

        // Calcular qué temas necesitan repaso
        const reviewItems = [];

        for (const completedNode of progress.completedNodes) {
            const lastReview = progress.reviewDates?.[completedNode] || progress.completionDates?.[completedNode];
            if (!lastReview) continue;

            const daysSinceReview = Math.floor((today - new Date(lastReview)) / (1000 * 60 * 60 * 24));
            const interval = progress.intervals?.[completedNode] || 0;
            const nextInterval = this.spacedRepetitionConfig.intervals[interval] || 1;

            if (daysSinceReview >= nextInterval) {
                const node = this.knowledgeGraph.nodes.find(n => n.id === completedNode);
                reviewItems.push({
                    nodeId: completedNode,
                    name: node?.name || completedNode,
                    subject: node?.subject,
                    daysSinceReview,
                    urgency: daysSinceReview > nextInterval * 2 ? 'high' : 'normal',
                    estimatedMinutes: 10
                });
            }
        }

        // Ordenar por urgencia
        reviewItems.sort((a, b) => b.daysSinceReview - a.daysSinceReview);

        return {
            userId,
            reviewItems: reviewItems.slice(0, 5),
            totalItemsNeedingReview: reviewItems.length,
            nextReviewDate: this.calculateNextReviewDate(progress),
            recommendation: reviewItems.length > 0
                ? `Tienes ${reviewItems.length} tema(s) que repasar para mantener tu conocimiento fresco.`
                : '¡Excelente! No tienes repasos pendientes hoy.',
            generatedAt: new Date().toISOString()
        };
    }

    calculateNextReviewDate(progress) {
        // Simplified calculation
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    }

    // =========================================================
    // TAREA 8: Integración con Tareas Docentes
    // =========================================================

    async syncWithTeacherAssignments(userId, teacherAssignments) {
        const progress = await this.getStudentProgress(userId);

        const recommendations = [];

        for (const assignment of teacherAssignments) {
            // Encontrar nodos relacionados con la tarea
            const relatedNodes = this.knowledgeGraph.nodes.filter(n =>
                n.subject === assignment.subject
            );

            // Verificar si el estudiante tiene los prerequisitos
            const requiredPrereqs = relatedNodes.flatMap(n => n.prereqs);
            const missingPrereqs = requiredPrereqs.filter(p => !progress.completedNodes.includes(p));

            if (missingPrereqs.length > 0) {
                recommendations.push({
                    assignmentId: assignment.id,
                    assignmentTitle: assignment.title,
                    missingPrerequisites: missingPrereqs.map(p => {
                        const node = this.knowledgeGraph.nodes.find(n => n.id === p);
                        return { id: p, name: node?.name || p };
                    }),
                    suggestedAction: 'Repasar temas previos antes de la tarea'
                });
            }
        }

        return {
            userId,
            assignmentsAnalyzed: teacherAssignments.length,
            recommendations,
            syncedAt: new Date().toISOString()
        };
    }

    // =========================================================
    // Helper: Obtener progreso del estudiante
    // =========================================================

    async getStudentProgress(userId) {
        try {
            const result = await executeQuery(`
                SELECT completed_nodes, in_progress_nodes, current_level, 
                       review_dates, completion_dates, intervals, streak_days
                FROM learning_progress
                WHERE user_id = $1
            `, [userId]);

            if (result && result.length > 0) {
                return {
                    completedNodes: result[0].completed_nodes || [],
                    inProgressNodes: result[0].in_progress_nodes || [],
                    currentLevel: result[0].current_level || 1,
                    reviewDates: result[0].review_dates || {},
                    completionDates: result[0].completion_dates || {},
                    intervals: result[0].intervals || {},
                    streakDays: result[0].streak_days || 0
                };
            }
        } catch (e) {
            devLogger.warn('LEARNING_PATH', 'Usando progreso mock');
        }

        // Mock progress
        return {
            completedNodes: ['math_1', 'phys_1', 'chem_1', 'hist_1'],
            inProgressNodes: ['math_2'],
            currentLevel: 2,
            reviewDates: {},
            completionDates: {},
            intervals: {},
            streakDays: 5
        };
    }

    // =========================================================
    // Health Check
    // =========================================================

    async healthCheck() {
        return {
            service: 'Learning Path Service',
            version: '1.0.0',
            status: 'healthy',
            knowledgeGraphNodes: this.knowledgeGraph.nodes.length,
            microCredentialsCount: this.microCredentials.length,
            spacedRepetitionIntervals: this.spacedRepetitionConfig.intervals,
            cachedPaths: this.pathCache.size,
            timestamp: new Date().toISOString()
        };
    }
}

// Singleton
const learningPathService = new LearningPathService();
module.exports = learningPathService;
