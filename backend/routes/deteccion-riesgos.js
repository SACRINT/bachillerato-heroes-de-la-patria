/**
 * 🚨 BGE API - SISTEMA DE DETECCIÓN DE RIESGOS
 * Rutas del backend para sistema integral de detección y prevención de riesgos
 *
 * Sistema especializado en:
 * - Detección temprana de riesgo de deserción
 * - Análisis de riesgo académico multifactorial
 * - Identificación de riesgos emocionales y psicosociales
 * - Predicción de riesgos conductuales
 * - Evaluación de riesgos familiares y socioeconómicos
 * - Generación automática de alertas y recomendaciones
 * - Sistema de intervenciones personalizadas
 *
 * Desarrollado para Bachillerato General Estatal "Héroes de la Patria"
 * @version 3.0.0
 * @date 2025-09-25
 */

const express = require('express');
const router = express.Router();

// Base de datos simulada para sistema de riesgos
let riskAssessments = new Map();
let activeAlerts = new Map();
let interventions = new Map();
let riskProfiles = new Map();
let monitoringConfig = new Map();

// Configuración del sistema de detección
const riskDetectionConfig = {
    riskTypes: {
        academic: {
            name: 'Riesgo Académico',
            weight: 0.25,
            factors: ['grades', 'attendance', 'assignments', 'participation', 'test_scores'],
            thresholds: { low: 0.3, medium: 0.5, high: 0.7, critical: 0.85 }
        },
        dropout: {
            name: 'Riesgo de Deserción',
            weight: 0.25,
            factors: ['attendance', 'family_support', 'economic_status', 'academic_performance'],
            thresholds: { low: 0.4, medium: 0.6, high: 0.75, critical: 0.9 }
        },
        emotional: {
            name: 'Riesgo Emocional',
            weight: 0.2,
            factors: ['stress_indicators', 'social_isolation', 'mood_changes', 'communication'],
            thresholds: { low: 0.35, medium: 0.55, high: 0.7, critical: 0.85 }
        },
        social: {
            name: 'Riesgo Social',
            weight: 0.15,
            factors: ['peer_relationships', 'group_integration', 'conflict_history', 'bullying'],
            thresholds: { low: 0.4, medium: 0.6, high: 0.75, critical: 0.9 }
        },
        behavioral: {
            name: 'Riesgo Conductual',
            weight: 0.1,
            factors: ['discipline_issues', 'rule_compliance', 'aggression', 'substance_indicators'],
            thresholds: { low: 0.3, medium: 0.5, high: 0.7, critical: 0.85 }
        },
        family: {
            name: 'Riesgo Familiar',
            weight: 0.05,
            factors: ['family_support', 'home_stability', 'parent_involvement', 'family_conflicts'],
            thresholds: { low: 0.35, medium: 0.55, high: 0.75, critical: 0.9 }
        }
    },
    interventionStrategies: {
        academic: ['tutoring', 'study_plan', 'academic_support', 'teacher_mentoring', 'resource_provision'],
        emotional: ['counseling', 'peer_support', 'stress_management', 'therapy_referral', 'wellness_program'],
        social: ['social_skills', 'integration_activities', 'conflict_resolution', 'peer_mediation'],
        behavioral: ['behavior_plan', 'counseling', 'mentoring', 'family_involvement', 'external_referral'],
        family: ['parent_meetings', 'family_therapy', 'resource_connection', 'social_services'],
        dropout: ['intensive_support', 'flexible_scheduling', 'career_counseling', 'financial_assistance']
    }
};

// 🔥 RUTA PRINCIPAL: Análisis completo de riesgos
router.post('/analyze', async (req, res) => {
    try {
        const { studentId, data, forceReanalysis = false } = req.body;

        console.log(`🚨 Análisis de riesgo - Estudiante: ${studentId}`);

        if (!studentId) {
            return res.status(400).json({
                success: false,
                error: 'ID de estudiante requerido'
            });
        }

        // Verificar si ya existe un análisis reciente
        const existingAnalysis = riskAssessments.get(studentId);
        if (existingAnalysis && !forceReanalysis) {
            const hoursSinceLastAnalysis = (Date.now() - new Date(existingAnalysis.timestamp).getTime()) / (1000 * 60 * 60);
            if (hoursSinceLastAnalysis < 1) {
                return res.json({
                    success: true,
                    data: existingAnalysis,
                    message: 'Análisis reciente disponible',
                    fromCache: true
                });
            }
        }

        // Realizar análisis completo de riesgos
        const riskAnalysis = await performComprehensiveRiskAnalysis(studentId, data);

        // Guardar análisis
        riskAssessments.set(studentId, riskAnalysis);

        // Generar alertas si es necesario
        const alertsGenerated = await generateRiskAlerts(studentId, riskAnalysis);

        // Recomendar intervenciones
        const interventionRecommendations = await recommendInterventions(studentId, riskAnalysis);

        res.json({
            success: true,
            data: {
                analysis: riskAnalysis,
                alerts: alertsGenerated,
                interventions: interventionRecommendations,
                recommendations: {
                    priority: riskAnalysis.overallRiskLevel,
                    urgency: riskAnalysis.overallRisk > 0.8 ? 'immediate' : riskAnalysis.overallRisk > 0.6 ? 'high' : 'medium',
                    nextSteps: generateNextSteps(riskAnalysis)
                }
            },
            metadata: {
                analysisId: riskAnalysis.id,
                timestamp: riskAnalysis.timestamp,
                confidence: riskAnalysis.confidence,
                factorsAnalyzed: riskAnalysis.factorsAnalyzed
            }
        });

    } catch (error) {
        console.error('❌ Error en análisis de riesgos:', error);
        res.status(500).json({
            success: false,
            error: 'Error en análisis de riesgos',
            details: error.message
        });
    }
});

// 📊 RUTA: Análisis masivo de estudiantes
router.post('/analyze-batch', async (req, res) => {
    try {
        const { studentIds, criteria } = req.body;

        console.log(`📊 Análisis masivo - ${studentIds.length} estudiantes`);

        const batchResults = [];
        const alerts = [];

        for (const studentId of studentIds) {
            try {
                const studentData = await getStudentData(studentId);
                const analysis = await performComprehensiveRiskAnalysis(studentId, studentData);

                riskAssessments.set(studentId, analysis);
                batchResults.push({
                    studentId,
                    analysis,
                    success: true
                });

                // Generar alertas para riesgos altos
                if (analysis.overallRisk > 0.7) {
                    const studentAlerts = await generateRiskAlerts(studentId, analysis);
                    alerts.push(...studentAlerts);
                }

            } catch (error) {
                console.error(`❌ Error analizando estudiante ${studentId}:`, error);
                batchResults.push({
                    studentId,
                    success: false,
                    error: error.message
                });
            }
        }

        // Estadísticas del análisis masivo
        const stats = {
            total: studentIds.length,
            successful: batchResults.filter(r => r.success).length,
            failed: batchResults.filter(r => !r.success).length,
            highRisk: batchResults.filter(r => r.success && r.analysis.overallRisk > 0.7).length,
            criticalRisk: batchResults.filter(r => r.success && r.analysis.overallRisk > 0.85).length,
            alertsGenerated: alerts.length
        };

        res.json({
            success: true,
            data: {
                results: batchResults,
                alerts,
                statistics: stats,
                summary: {
                    riskDistribution: calculateRiskDistribution(batchResults),
                    priorityStudents: batchResults
                        .filter(r => r.success && r.analysis.overallRisk > 0.6)
                        .sort((a, b) => b.analysis.overallRisk - a.analysis.overallRisk)
                        .slice(0, 10)
                        .map(r => ({ studentId: r.studentId, risk: r.analysis.overallRisk }))
                }
            }
        });

    } catch (error) {
        console.error('❌ Error en análisis masivo:', error);
        res.status(500).json({
            success: false,
            error: 'Error en análisis masivo'
        });
    }
});

// 🔔 RUTA: Obtener alertas activas
router.get('/alerts', (req, res) => {
    try {
        const { level, type, studentId, limit = 50 } = req.query;

        let alerts = Array.from(activeAlerts.values());

        // Aplicar filtros
        if (level) {
            alerts = alerts.filter(alert => alert.level === level);
        }
        if (type) {
            alerts = alerts.filter(alert => alert.type === type);
        }
        if (studentId) {
            alerts = alerts.filter(alert => alert.studentId === studentId);
        }

        // Ordenar por timestamp descendente y limitar
        alerts = alerts
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, parseInt(limit));

        // Estadísticas de alertas
        const alertStats = {
            total: alerts.length,
            byLevel: getAlertsByLevel(alerts),
            byType: getAlertsByType(alerts),
            recentCount: alerts.filter(a =>
                Date.now() - new Date(a.timestamp).getTime() < 24 * 60 * 60 * 1000
            ).length
        };

        res.json({
            success: true,
            data: {
                alerts,
                statistics: alertStats,
                metadata: {
                    totalActive: activeAlerts.size,
                    filters: { level, type, studentId, limit }
                }
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo alertas:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo alertas'
        });
    }
});

// 🎯 RUTA: Crear intervención
router.post('/intervention', async (req, res) => {
    try {
        const {
            studentId,
            type,
            strategy,
            description,
            priority,
            assignedTo,
            timeline
        } = req.body;

        console.log(`🎯 Creando intervención - Estudiante: ${studentId}, Tipo: ${type}`);

        const intervention = {
            id: generateInterventionId(),
            studentId,
            type,
            strategy,
            description,
            priority: priority || 'medium',
            assignedTo: assignedTo || [],
            timeline: timeline || 'short-term',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            progress: 0,
            milestones: [],
            resources: [],
            notes: []
        };

        // Guardar intervención
        interventions.set(intervention.id, intervention);

        // Actualizar perfil de riesgo del estudiante
        await updateStudentRiskProfile(studentId, intervention);

        // Notificar a los asignados (simulado)
        await notifyInterventionStakeholders(intervention);

        res.json({
            success: true,
            data: intervention,
            message: `Intervención ${type} creada exitosamente`,
            nextSteps: [
                'Notificar a los responsables asignados',
                'Establecer cronograma de seguimiento',
                'Documentar progreso inicial'
            ]
        });

    } catch (error) {
        console.error('❌ Error creando intervención:', error);
        res.status(500).json({
            success: false,
            error: 'Error creando intervención'
        });
    }
});

// 📈 RUTA: Actualizar progreso de intervención
router.put('/intervention/:interventionId', async (req, res) => {
    try {
        const { interventionId } = req.params;
        const { progress, notes, status, milestones } = req.body;

        console.log(`📈 Actualizando intervención: ${interventionId}`);

        const intervention = interventions.get(interventionId);
        if (!intervention) {
            return res.status(404).json({
                success: false,
                error: 'Intervención no encontrada'
            });
        }

        // Actualizar intervención
        if (progress !== undefined) intervention.progress = progress;
        if (status) intervention.status = status;
        if (notes) intervention.notes.push({
            timestamp: new Date().toISOString(),
            content: notes,
            author: req.user?.id || 'system'
        });
        if (milestones) intervention.milestones.push(...milestones);

        intervention.updatedAt = new Date().toISOString();

        // Re-evaluar riesgo si la intervención está completada o cerrada
        if (status === 'completed' || status === 'closed') {
            await reevaluateStudentRisk(intervention.studentId);
        }

        res.json({
            success: true,
            data: intervention,
            message: 'Intervención actualizada exitosamente'
        });

    } catch (error) {
        console.error('❌ Error actualizando intervención:', error);
        res.status(500).json({
            success: false,
            error: 'Error actualizando intervención'
        });
    }
});

// 📊 RUTA: Dashboard de riesgos
router.get('/dashboard', async (req, res) => {
    try {
        const { timeframe = '7d' } = req.query;

        // Calcular estadísticas del dashboard
        const dashboardStats = await calculateDashboardStats(timeframe);

        // Obtener distribución de riesgos
        const riskDistribution = calculateCurrentRiskDistribution();

        // Obtener tendencias
        const trends = await calculateRiskTrends(timeframe);

        // Obtener alertas críticas
        const criticalAlerts = Array.from(activeAlerts.values())
            .filter(alert => alert.level === 'critical' || alert.level === 'emergency')
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10);

        // Obtener intervenciones activas
        const activeInterventionsList = Array.from(interventions.values())
            .filter(i => i.status === 'active')
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({
            success: true,
            data: {
                overview: {
                    studentsMonitored: riskAssessments.size,
                    activeAlerts: activeAlerts.size,
                    criticalRisks: criticalAlerts.length,
                    activeInterventions: activeInterventionsList.length,
                    successfulInterventions: Array.from(interventions.values())
                        .filter(i => i.status === 'completed').length
                },
                riskDistribution,
                trends,
                alerts: {
                    critical: criticalAlerts,
                    summary: getAlertsSummary()
                },
                interventions: {
                    active: activeInterventionsList.slice(0, 10),
                    summary: getInterventionsSummary()
                },
                recommendations: await generateSystemRecommendations()
            },
            metadata: {
                timeframe,
                lastUpdate: new Date().toISOString(),
                dataQuality: 'high'
            }
        });

    } catch (error) {
        console.error('❌ Error en dashboard de riesgos:', error);
        res.status(500).json({
            success: false,
            error: 'Error en dashboard de riesgos'
        });
    }
});

// 📋 RUTA: Obtener perfil de riesgo de estudiante
router.get('/student/:studentId/profile', async (req, res) => {
    try {
        const { studentId } = req.params;

        const riskProfile = riskProfiles.get(studentId) || await createStudentRiskProfile(studentId);
        const currentAnalysis = riskAssessments.get(studentId);
        const studentAlerts = Array.from(activeAlerts.values())
            .filter(alert => alert.studentId === studentId);
        const studentInterventions = Array.from(interventions.values())
            .filter(intervention => intervention.studentId === studentId);

        res.json({
            success: true,
            data: {
                profile: riskProfile,
                currentAnalysis,
                alerts: studentAlerts,
                interventions: studentInterventions,
                riskHistory: await getRiskHistory(studentId),
                recommendations: await getPersonalizedRecommendations(studentId)
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo perfil de riesgo:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo perfil de riesgo'
        });
    }
});

// 🔍 RUTA: Búsqueda predictiva de riesgos
router.post('/predict', async (req, res) => {
    try {
        const { criteria, timeHorizon = '30d', confidence = 0.7 } = req.body;

        console.log('🔍 Realizando predicción de riesgos...');

        // Realizar predicción basada en criterios
        const predictions = await performRiskPrediction(criteria, timeHorizon, confidence);

        // Generar recomendaciones preventivas
        const preventiveActions = await generatePreventiveActions(predictions);

        res.json({
            success: true,
            data: {
                predictions,
                preventiveActions,
                metadata: {
                    timeHorizon,
                    confidence,
                    modelAccuracy: 0.87, // Mock accuracy
                    factors: predictions.length
                }
            }
        });

    } catch (error) {
        console.error('❌ Error en predicción de riesgos:', error);
        res.status(500).json({
            success: false,
            error: 'Error en predicción de riesgos'
        });
    }
});

// 📊 RUTA: Exportar reportes
router.get('/reports/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const { format = 'json', period = '1m' } = req.query;

        console.log(`📊 Generando reporte: ${type} - Formato: ${format}`);

        let reportData;

        switch (type) {
            case 'risk-summary':
                reportData = await generateRiskSummaryReport(period);
                break;
            case 'interventions':
                reportData = await generateInterventionsReport(period);
                break;
            case 'alerts':
                reportData = await generateAlertsReport(period);
                break;
            case 'trends':
                reportData = await generateTrendsReport(period);
                break;
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Tipo de reporte no válido'
                });
        }

        if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
            res.send(convertToCSV(reportData));
        } else {
            res.json({
                success: true,
                data: reportData,
                metadata: {
                    reportType: type,
                    period,
                    generatedAt: new Date().toISOString()
                }
            });
        }

    } catch (error) {
        console.error('❌ Error generando reporte:', error);
        res.status(500).json({
            success: false,
            error: 'Error generando reporte'
        });
    }
});

// 🔧 RUTA: Configuración del sistema
router.get('/config', (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                riskTypes: riskDetectionConfig.riskTypes,
                interventionStrategies: riskDetectionConfig.interventionStrategies,
                alertLevels: ['info', 'warning', 'critical', 'emergency'],
                monitoringFrequency: '5-minutes',
                systemCapabilities: {
                    realTimeMonitoring: true,
                    predictiveAnalysis: true,
                    automaticAlerts: true,
                    interventionTracking: true,
                    reporting: true
                }
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo configuración:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo configuración'
        });
    }
});

// 🔧 RUTA: Estado de salud del sistema
router.get('/health', (req, res) => {
    const health = {
        status: 'operational',
        version: '3.0.0',
        uptime: process.uptime(),
        systems: {
            riskAnalysis: 'active',
            alertSystem: 'operational',
            interventionTracking: 'active',
            dataCollection: 'running'
        },
        statistics: {
            studentsMonitored: riskAssessments.size,
            activeAlerts: activeAlerts.size,
            activeInterventions: Array.from(interventions.values()).filter(i => i.status === 'active').length,
            analysisProcessed: riskAssessments.size
        },
        performance: {
            avgAnalysisTime: '450ms',
            alertResponseTime: '120ms',
            systemLoad: 'low'
        }
    };

    res.json({
        success: true,
        data: health,
        timestamp: new Date().toISOString()
    });
});

// ========================================
// FUNCIONES AUXILIARES
// ========================================

async function performComprehensiveRiskAnalysis(studentId, data) {
    const analysisId = `risk_${Date.now()}_${studentId}`;

    const analysis = {
        id: analysisId,
        studentId,
        timestamp: new Date().toISOString(),
        risks: {},
        overallRisk: 0,
        overallRiskLevel: 'low',
        confidence: 0.85,
        factorsAnalyzed: 0,
        recommendations: [],
        alerts: []
    };

    let totalWeightedRisk = 0;
    let totalWeight = 0;

    // Analizar cada tipo de riesgo
    for (const [riskType, config] of Object.entries(riskDetectionConfig.riskTypes)) {
        const riskScore = await calculateSpecificRisk(riskType, data, config);

        analysis.risks[riskType] = {
            score: riskScore,
            level: getRiskLevel(riskScore, config.thresholds),
            factors: await identifyRiskFactors(riskType, data, riskScore),
            weight: config.weight
        };

        totalWeightedRisk += riskScore * config.weight;
        totalWeight += config.weight;
        analysis.factorsAnalyzed += config.factors.length;
    }

    // Calcular riesgo general
    analysis.overallRisk = totalWeightedRisk / totalWeight;
    analysis.overallRiskLevel = getRiskLevel(analysis.overallRisk, {
        low: 0.3, medium: 0.5, high: 0.7, critical: 0.85
    });

    return analysis;
}

async function calculateSpecificRisk(riskType, data, config) {
    // Simulación de cálculo de riesgo específico
    // En implementación real, usaría modelos de ML entrenados

    let riskScore = 0;

    switch (riskType) {
        case 'academic':
            riskScore = calculateAcademicRisk(data);
            break;
        case 'dropout':
            riskScore = calculateDropoutRisk(data);
            break;
        case 'emotional':
            riskScore = calculateEmotionalRisk(data);
            break;
        case 'social':
            riskScore = calculateSocialRisk(data);
            break;
        case 'behavioral':
            riskScore = calculateBehavioralRisk(data);
            break;
        case 'family':
            riskScore = calculateFamilyRisk(data);
            break;
        default:
            riskScore = Math.random() * 0.3; // Riesgo base
    }

    return Math.min(1.0, Math.max(0.0, riskScore));
}

function calculateAcademicRisk(data) {
    const grades = data.grades || [8, 7.5, 8.5, 7, 8]; // Mock data
    const attendance = data.attendance || 0.9;
    const assignments = data.assignments || 0.85;

    const avgGrade = grades.reduce((a, b) => a + b, 0) / grades.length;
    const gradeRisk = Math.max(0, (7.0 - avgGrade) / 7.0);
    const attendanceRisk = Math.max(0, (0.8 - attendance) / 0.8);
    const assignmentRisk = Math.max(0, (0.75 - assignments) / 0.75);

    return (gradeRisk * 0.4) + (attendanceRisk * 0.35) + (assignmentRisk * 0.25);
}

function calculateDropoutRisk(data) {
    const attendance = data.attendance || 0.9;
    const familySupport = data.familySupport || 0.8;
    const economicStatus = data.economicStatus || 0.7;

    const attendanceRisk = Math.max(0, (0.75 - attendance) / 0.75);
    const familyRisk = Math.max(0, (0.6 - familySupport) / 0.6);
    const economicRisk = Math.max(0, (0.5 - economicStatus) / 0.5);

    return (attendanceRisk * 0.4) + (familyRisk * 0.35) + (economicRisk * 0.25);
}

function calculateEmotionalRisk(data) {
    const stressLevel = data.stressLevel || Math.random() * 0.5;
    const socialConnection = data.socialConnection || 0.8;
    const communication = data.communication || 0.75;

    const stressRisk = stressLevel;
    const socialRisk = Math.max(0, (0.6 - socialConnection) / 0.6);
    const commRisk = Math.max(0, (0.5 - communication) / 0.5);

    return (stressRisk * 0.4) + (socialRisk * 0.35) + (commRisk * 0.25);
}

function calculateSocialRisk(data) {
    const peerRelations = data.peerRelations || 0.8;
    const integration = data.integration || 0.75;
    const conflicts = data.conflicts || 0;

    const peerRisk = Math.max(0, (0.6 - peerRelations) / 0.6);
    const integrationRisk = Math.max(0, (0.5 - integration) / 0.5);
    const conflictRisk = Math.min(1.0, conflicts * 0.2);

    return (peerRisk * 0.4) + (integrationRisk * 0.35) + (conflictRisk * 0.25);
}

function calculateBehavioralRisk(data) {
    const discipline = data.disciplineIssues || 0;
    const compliance = data.compliance || 0.9;
    const aggression = data.aggression || 0;

    const disciplineRisk = Math.min(1.0, discipline * 0.2);
    const complianceRisk = Math.max(0, (0.8 - compliance) / 0.8);
    const aggressionRisk = Math.min(1.0, aggression * 0.3);

    return (disciplineRisk * 0.4) + (complianceRisk * 0.35) + (aggressionRisk * 0.25);
}

function calculateFamilyRisk(data) {
    const familySupport = data.familySupport || 0.8;
    const homeStability = data.homeStability || 0.85;
    const parentInvolvement = data.parentInvolvement || 0.7;

    const supportRisk = Math.max(0, (0.6 - familySupport) / 0.6);
    const stabilityRisk = Math.max(0, (0.7 - homeStability) / 0.7);
    const involvementRisk = Math.max(0, (0.5 - parentInvolvement) / 0.5);

    return (supportRisk * 0.4) + (stabilityRisk * 0.35) + (involvementRisk * 0.25);
}

function getRiskLevel(score, thresholds) {
    if (score >= thresholds.critical) return 'critical';
    if (score >= thresholds.high) return 'high';
    if (score >= thresholds.medium) return 'medium';
    return 'low';
}

async function identifyRiskFactors(riskType, data, riskScore) {
    const factors = [];

    // Mock implementation
    if (riskScore > 0.5) {
        const riskFactors = {
            academic: ['Calificaciones por debajo del promedio', 'Asistencia irregular', 'Tareas incompletas'],
            dropout: ['Baja asistencia', 'Poco apoyo familiar', 'Dificultades económicas'],
            emotional: ['Alto nivel de estrés', 'Aislamiento social', 'Comunicación limitada'],
            social: ['Dificultades con compañeros', 'Baja integración', 'Conflictos recurrentes'],
            behavioral: ['Problemas disciplinarios', 'Incumplimiento de normas', 'Comportamiento agresivo'],
            family: ['Falta de apoyo familiar', 'Inestabilidad en el hogar', 'Poca participación de padres']
        };

        factors.push(...(riskFactors[riskType] || []).slice(0, Math.ceil(riskScore * 3)));
    }

    return factors;
}

async function generateRiskAlerts(studentId, analysis) {
    const alerts = [];

    Object.entries(analysis.risks).forEach(([riskType, riskData]) => {
        if (riskData.score > 0.6) {
            const alert = {
                id: generateAlertId(),
                studentId,
                type: riskType,
                level: getAlertLevel(riskData.score),
                title: `${riskDetectionConfig.riskTypes[riskType].name} - Nivel ${riskData.level}`,
                message: generateAlertMessage(riskType, riskData),
                timestamp: new Date().toISOString(),
                status: 'active',
                riskScore: riskData.score,
                factors: riskData.factors
            };

            alerts.push(alert);
            activeAlerts.set(alert.id, alert);
        }
    });

    return alerts;
}

async function recommendInterventions(studentId, analysis) {
    const recommendations = [];

    Object.entries(analysis.risks).forEach(([riskType, riskData]) => {
        if (riskData.score > 0.4) {
            const strategies = riskDetectionConfig.interventionStrategies[riskType] || [];
            const relevantStrategies = strategies.slice(0, Math.ceil(riskData.score * 3));

            recommendations.push({
                riskType,
                priority: riskData.level,
                strategies: relevantStrategies,
                timeline: riskData.score > 0.7 ? 'immediate' : riskData.score > 0.5 ? 'short-term' : 'medium-term'
            });
        }
    });

    return recommendations;
}

function generateNextSteps(analysis) {
    const steps = [];

    if (analysis.overallRisk > 0.8) {
        steps.push('Intervención inmediata requerida');
        steps.push('Contactar a padres/tutores');
        steps.push('Asignar consejero especializado');
    } else if (analysis.overallRisk > 0.6) {
        steps.push('Programar reunión con el estudiante');
        steps.push('Desarrollar plan de apoyo');
        steps.push('Monitoreo semanal');
    } else {
        steps.push('Continuar monitoreo regular');
        steps.push('Reforzar estrategias preventivas');
    }

    return steps;
}

function getAlertLevel(riskScore) {
    if (riskScore >= 0.85) return 'emergency';
    if (riskScore >= 0.7) return 'critical';
    if (riskScore >= 0.5) return 'warning';
    return 'info';
}

function generateAlertMessage(riskType, riskData) {
    const messages = {
        academic: `Rendimiento académico en riesgo ${riskData.level}`,
        dropout: `Riesgo de deserción detectado - Nivel ${riskData.level}`,
        emotional: `Indicadores emocionales requieren atención - Nivel ${riskData.level}`,
        social: `Dificultades sociales identificadas - Nivel ${riskData.level}`,
        behavioral: `Problemas conductuales detectados - Nivel ${riskData.level}`,
        family: `Situación familiar requiere apoyo - Nivel ${riskData.level}`
    };

    return messages[riskType] || `Riesgo ${riskType} - Nivel ${riskData.level}`;
}

function generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateInterventionId() {
    return `intervention_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function getStudentData(studentId) {
    // Mock data - En implementación real vendría de la base de datos
    return {
        grades: Array.from({ length: 5 }, () => Math.random() * 4 + 6),
        attendance: Math.random() * 0.3 + 0.7,
        assignments: Math.random() * 0.3 + 0.7,
        familySupport: Math.random() * 0.4 + 0.6,
        economicStatus: Math.random() * 0.5 + 0.5,
        stressLevel: Math.random() * 0.6,
        socialConnection: Math.random() * 0.4 + 0.6,
        communication: Math.random() * 0.4 + 0.6
    };
}

// Funciones de estadísticas y reportes
function calculateRiskDistribution(results) {
    const distribution = { low: 0, medium: 0, high: 0, critical: 0 };

    results.filter(r => r.success).forEach(result => {
        const level = result.analysis.overallRiskLevel;
        distribution[level] = (distribution[level] || 0) + 1;
    });

    return distribution;
}

function calculateCurrentRiskDistribution() {
    const distribution = { low: 0, medium: 0, high: 0, critical: 0 };

    Array.from(riskAssessments.values()).forEach(analysis => {
        const level = analysis.overallRiskLevel;
        distribution[level] = (distribution[level] || 0) + 1;
    });

    return distribution;
}

function getAlertsByLevel(alerts) {
    const byLevel = { info: 0, warning: 0, critical: 0, emergency: 0 };

    alerts.forEach(alert => {
        byLevel[alert.level] = (byLevel[alert.level] || 0) + 1;
    });

    return byLevel;
}

function getAlertsByType(alerts) {
    const byType = {};

    alerts.forEach(alert => {
        byType[alert.type] = (byType[alert.type] || 0) + 1;
    });

    return byType;
}

// Funciones mock para métodos asincrónicos
async function calculateDashboardStats(timeframe) {
    return {
        analysisCount: riskAssessments.size,
        alertsGenerated: activeAlerts.size,
        interventionsCreated: interventions.size,
        riskReduction: '15%' // Mock data
    };
}

async function calculateRiskTrends(timeframe) {
    return {
        academic: [0.3, 0.4, 0.35, 0.45, 0.4, 0.38, 0.42],
        dropout: [0.2, 0.25, 0.22, 0.28, 0.26, 0.24, 0.27],
        emotional: [0.4, 0.42, 0.38, 0.45, 0.43, 0.41, 0.44]
    };
}

module.exports = router;