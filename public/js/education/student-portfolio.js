/**
 * 🎓 SISTEMA DE PORTFOLIO DIGITAL ESTUDIANTIL BGE
 * Portfolio académico completo con seguimiento de progreso
 */

class BGEStudentPortfolio {
    constructor() {
        this.portfolios = new Map();
        this.achievements = new Map();
        this.projects = new Map();
        this.skillsFramework = new Map();
        this.templates = new Map();

        this.competencyFramework = {
            academic: {
                name: 'Competencias Académicas',
                skills: ['matematicas', 'ciencias', 'literatura', 'historia', 'ingles']
            },
            digital: {
                name: 'Competencias Digitales',
                skills: ['tecnologia', 'programacion', 'multimedia', 'investigacion-digital']
            },
            social: {
                name: 'Competencias Sociales',
                skills: ['liderazgo', 'trabajo-equipo', 'comunicacion', 'resolucion-conflictos']
            },
            personal: {
                name: 'Desarrollo Personal',
                skills: ['creatividad', 'pensamiento-critico', 'autonomia', 'responsabilidad']
            }
        };

        this.init();
    }

    init() {
        BGELogger?.info('Student Portfolio', '🎓 Inicializando Sistema de Portfolio Digital');

        // Cargar datos existentes
        this.loadPortfolioData();

        // Configurar framework de competencias
        this.setupSkillsFramework();

        // Inicializar plantillas
        this.initializeTemplates();

        // Configurar auto-guardado
        this.setupAutoSave();

        BGELogger?.info('Student Portfolio', '✅ Portfolio System inicializado', {
            portfolios: this.portfolios.size,
            competencies: Object.keys(this.competencyFramework).length,
            templates: this.templates.size
        });
    }

    // Crear nuevo portfolio para estudiante
    createPortfolio(studentData) {
        const portfolioId = studentData.studentId || this.generatePortfolioId();

        const portfolio = {
            id: portfolioId,
            studentInfo: {
                id: studentData.studentId,
                name: studentData.name,
                email: studentData.email,
                grade: studentData.grade || '1er Año',
                group: studentData.group || 'A',
                enrollmentDate: studentData.enrollmentDate || new Date().toISOString(),
                photo: studentData.photo || null
            },
            academicRecord: {
                currentGPA: 0,
                totalCredits: 0,
                completedCourses: [],
                currentCourses: [],
                academicGoals: []
            },
            competencies: this.initializeCompetencies(),
            projects: [],
            achievements: [],
            reflections: [],
            goals: {
                shortTerm: [],
                longTerm: [],
                career: []
            },
            artifacts: {
                documents: [],
                multimedia: [],
                certificates: []
            },
            timeline: [],
            privacy: {
                public: false,
                shared: [],
                restrictions: []
            },
            metadata: {
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                version: '1.0'
            }
        };

        this.portfolios.set(portfolioId, portfolio);

        // Crear entrada en timeline
        this.addTimelineEntry(portfolioId, 'portfolio_created', {
            message: 'Portfolio académico creado',
            type: 'milestone'
        });

        BGELogger?.info('Student Portfolio', '📁 Nuevo portfolio creado', {
            studentId: portfolioId,
            studentName: studentData.name,
            grade: studentData.grade
        });

        return portfolioId;
    }

    // Inicializar competencias según framework
    initializeCompetencies() {
        const competencies = {};

        Object.entries(this.competencyFramework).forEach(([categoryId, category]) => {
            competencies[categoryId] = {
                name: category.name,
                skills: category.skills.map(skill => ({
                    id: skill,
                    name: this.getSkillName(skill),
                    level: 0, // 0-4: Novato, Básico, Intermedio, Avanzado, Experto
                    evidence: [],
                    lastAssessed: null,
                    progress: []
                }))
            };
        });

        return competencies;
    }

    // Obtener nombre de habilidad
    getSkillName(skillId) {
        const skillNames = {
            'matematicas': 'Matemáticas',
            'ciencias': 'Ciencias Naturales',
            'literatura': 'Literatura y Lenguaje',
            'historia': 'Historia y Ciencias Sociales',
            'ingles': 'Inglés',
            'tecnologia': 'Tecnología e Informática',
            'programacion': 'Programación',
            'multimedia': 'Producción Multimedia',
            'investigacion-digital': 'Investigación Digital',
            'liderazgo': 'Liderazgo',
            'trabajo-equipo': 'Trabajo en Equipo',
            'comunicacion': 'Comunicación Efectiva',
            'resolucion-conflictos': 'Resolución de Conflictos',
            'creatividad': 'Creatividad e Innovación',
            'pensamiento-critico': 'Pensamiento Crítico',
            'autonomia': 'Autonomía y Autogestión',
            'responsabilidad': 'Responsabilidad Social'
        };

        return skillNames[skillId] || skillId;
    }

    // Agregar proyecto al portfolio
    addProject(portfolioId, projectData) {
        const portfolio = this.portfolios.get(portfolioId);
        if (!portfolio) {
            BGELogger?.error('Student Portfolio', 'Portfolio no encontrado', { portfolioId });
            return false;
        }

        const project = {
            id: this.generateProjectId(),
            title: projectData.title,
            description: projectData.description,
            subject: projectData.subject,
            type: projectData.type || 'individual', // individual, group, research
            startDate: projectData.startDate || new Date().toISOString(),
            endDate: projectData.endDate,
            status: 'in_progress', // planning, in_progress, completed, submitted
            objectives: projectData.objectives || [],
            deliverables: [],
            resources: projectData.resources || [],
            collaborators: projectData.collaborators || [],
            mentor: projectData.mentor,
            competenciesTargeted: projectData.competencies || [],
            reflection: '',
            grade: null,
            feedback: '',
            multimedia: [],
            tags: projectData.tags || [],
            visibility: 'private' // private, shared, public
        };

        portfolio.projects.push(project);
        this.updatePortfolioTimestamp(portfolioId);

        // Agregar a timeline
        this.addTimelineEntry(portfolioId, 'project_added', {
            message: `Proyecto "${project.title}" agregado`,
            projectId: project.id,
            subject: project.subject
        });

        BGELogger?.info('Student Portfolio', '📁 Proyecto agregado', {
            portfolioId,
            projectTitle: project.title,
            subject: project.subject
        });

        return project.id;
    }

    // Actualizar progreso de competencia
    updateCompetencyProgress(portfolioId, categoryId, skillId, progressData) {
        const portfolio = this.portfolios.get(portfolioId);
        if (!portfolio || !portfolio.competencies[categoryId]) {
            BGELogger?.error('Student Portfolio', 'Portfolio o competencia no encontrada');
            return false;
        }

        const skill = portfolio.competencies[categoryId].skills.find(s => s.id === skillId);
        if (!skill) {
            BGELogger?.error('Student Portfolio', 'Habilidad no encontrada', { skillId });
            return false;
        }

        // Actualizar nivel si ha mejorado
        if (progressData.newLevel > skill.level) {
            const oldLevel = skill.level;
            skill.level = progressData.newLevel;

            // Registrar progreso
            skill.progress.push({
                date: new Date().toISOString(),
                fromLevel: oldLevel,
                toLevel: progressData.newLevel,
                evidence: progressData.evidence,
                assessor: progressData.assessor,
                comments: progressData.comments
            });

            // Agregar evidencia
            if (progressData.evidence) {
                skill.evidence.push({
                    type: progressData.evidenceType || 'assessment',
                    source: progressData.evidence,
                    date: new Date().toISOString(),
                    level: progressData.newLevel
                });
            }

            skill.lastAssessed = new Date().toISOString();

            // Timeline entry
            this.addTimelineEntry(portfolioId, 'competency_improved', {
                message: `Mejora en ${skill.name}: Nivel ${progressData.newLevel}`,
                skill: skill.name,
                category: portfolio.competencies[categoryId].name,
                newLevel: progressData.newLevel
            });

            // Verificar logros
            this.checkForAchievements(portfolioId, categoryId, skillId);

            BGELogger?.info('Student Portfolio', '📈 Competencia actualizada', {
                portfolioId,
                skill: skill.name,
                newLevel: progressData.newLevel
            });

            return true;
        }

        return false;
    }

    // Agregar logro/reconocimiento
    addAchievement(portfolioId, achievementData) {
        const portfolio = this.portfolios.get(portfolioId);
        if (!portfolio) return false;

        const achievement = {
            id: this.generateAchievementId(),
            title: achievementData.title,
            description: achievementData.description,
            type: achievementData.type || 'academic', // academic, social, leadership, creative
            category: achievementData.category,
            level: achievementData.level || 'school', // classroom, school, regional, national
            date: achievementData.date || new Date().toISOString(),
            issuer: achievementData.issuer,
            evidence: achievementData.evidence || [],
            verified: achievementData.verified || false,
            publiclyVisible: achievementData.publiclyVisible || false,
            competenciesReinforced: achievementData.competencies || []
        };

        portfolio.achievements.push(achievement);

        // Timeline entry
        this.addTimelineEntry(portfolioId, 'achievement_earned', {
            message: `Logro obtenido: ${achievement.title}`,
            achievementType: achievement.type,
            level: achievement.level
        });

        BGELogger?.info('Student Portfolio', '🏆 Logro agregado', {
            portfolioId,
            title: achievement.title,
            type: achievement.type
        });

        return achievement.id;
    }

    // Agregar reflexión académica
    addReflection(portfolioId, reflectionData) {
        const portfolio = this.portfolios.get(portfolioId);
        if (!portfolio) return false;

        const reflection = {
            id: this.generateReflectionId(),
            title: reflectionData.title,
            content: reflectionData.content,
            type: reflectionData.type || 'learning', // learning, project, goal, general
            relatedTo: reflectionData.relatedTo, // project id, achievement id, etc.
            prompt: reflectionData.prompt,
            date: new Date().toISOString(),
            tags: reflectionData.tags || [],
            mood: reflectionData.mood, // excited, confident, challenged, frustrated, proud
            shareWithMentor: reflectionData.shareWithMentor || false,
            privacy: 'private'
        };

        portfolio.reflections.push(reflection);

        // Timeline entry
        this.addTimelineEntry(portfolioId, 'reflection_added', {
            message: `Nueva reflexión: ${reflection.title}`,
            type: reflection.type
        });

        BGELogger?.info('Student Portfolio', '💭 Reflexión agregada', {
            portfolioId,
            title: reflection.title,
            type: reflection.type
        });

        return reflection.id;
    }

    // Establecer metas académicas
    setAcademicGoals(portfolioId, goalsData) {
        const portfolio = this.portfolios.get(portfolioId);
        if (!portfolio) return false;

        // Actualizar metas
        if (goalsData.shortTerm) {
            portfolio.goals.shortTerm = goalsData.shortTerm.map(goal => ({
                ...goal,
                id: this.generateGoalId(),
                createdAt: new Date().toISOString(),
                status: 'active'
            }));
        }

        if (goalsData.longTerm) {
            portfolio.goals.longTerm = goalsData.longTerm.map(goal => ({
                ...goal,
                id: this.generateGoalId(),
                createdAt: new Date().toISOString(),
                status: 'active'
            }));
        }

        if (goalsData.career) {
            portfolio.goals.career = goalsData.career.map(goal => ({
                ...goal,
                id: this.generateGoalId(),
                createdAt: new Date().toISOString(),
                status: 'active'
            }));
        }

        this.updatePortfolioTimestamp(portfolioId);

        BGELogger?.info('Student Portfolio', '🎯 Metas académicas establecidas', {
            portfolioId,
            shortTerm: portfolio.goals.shortTerm.length,
            longTerm: portfolio.goals.longTerm.length,
            career: portfolio.goals.career.length
        });

        return true;
    }

    // Generar reporte de progreso
    generateProgressReport(portfolioId, options = {}) {
        const portfolio = this.portfolios.get(portfolioId);
        if (!portfolio) return null;

        // Calcular estadísticas de competencias
        const competencyStats = {};
        let totalSkills = 0;
        let totalLevels = 0;

        Object.entries(portfolio.competencies).forEach(([categoryId, category]) => {
            const categoryStats = {
                name: category.name,
                skills: category.skills.length,
                averageLevel: 0,
                distribution: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 },
                recentProgress: []
            };

            category.skills.forEach(skill => {
                totalSkills++;
                totalLevels += skill.level;
                categoryStats.distribution[skill.level]++;

                // Progreso reciente (últimos 30 días)
                const recentProgress = skill.progress.filter(p =>
                    new Date(p.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                );
                categoryStats.recentProgress = categoryStats.recentProgress.concat(recentProgress);
            });

            categoryStats.averageLevel = categoryStats.skills > 0 ?
                category.skills.reduce((sum, skill) => sum + skill.level, 0) / categoryStats.skills : 0;

            competencyStats[categoryId] = categoryStats;
        });

        // Estadísticas de proyectos
        const projectStats = {
            total: portfolio.projects.length,
            completed: portfolio.projects.filter(p => p.status === 'completed').length,
            inProgress: portfolio.projects.filter(p => p.status === 'in_progress').length,
            bySubject: {}
        };

        portfolio.projects.forEach(project => {
            if (!projectStats.bySubject[project.subject]) {
                projectStats.bySubject[project.subject] = 0;
            }
            projectStats.bySubject[project.subject]++;
        });

        const progressReport = {
            portfolioId,
            studentName: portfolio.studentInfo.name,
            reportDate: new Date().toISOString(),
            academicInfo: {
                grade: portfolio.studentInfo.grade,
                group: portfolio.studentInfo.group,
                currentGPA: portfolio.academicRecord.currentGPA
            },
            competencyOverview: {
                overallAverage: totalSkills > 0 ? totalLevels / totalSkills : 0,
                categoriesAnalyzed: Object.keys(competencyStats).length,
                totalSkillsAssessed: totalSkills,
                statistics: competencyStats
            },
            projectSummary: projectStats,
            achievements: {
                total: portfolio.achievements.length,
                recent: portfolio.achievements.filter(a =>
                    new Date(a.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                ).length,
                byType: {}
            },
            goals: {
                shortTerm: portfolio.goals.shortTerm.filter(g => g.status === 'active').length,
                longTerm: portfolio.goals.longTerm.filter(g => g.status === 'active').length,
                career: portfolio.goals.career.filter(g => g.status === 'active').length
            },
            timeline: portfolio.timeline.slice(-10), // Últimas 10 entradas
            recommendations: this.generatePortfolioRecommendations(portfolio)
        };

        BGELogger?.info('Student Portfolio', '📊 Reporte de progreso generado', {
            portfolioId,
            overallAverage: progressReport.competencyOverview.overallAverage.toFixed(2),
            projects: progressReport.projectSummary.total,
            achievements: progressReport.achievements.total
        });

        return progressReport;
    }

    // Generar recomendaciones personalizadas
    generatePortfolioRecommendations(portfolio) {
        const recommendations = [];

        // Analizar competencias
        Object.entries(portfolio.competencies).forEach(([categoryId, category]) => {
            const lowSkills = category.skills.filter(skill => skill.level < 2);

            if (lowSkills.length > 0) {
                recommendations.push({
                    type: 'skill_development',
                    priority: 'medium',
                    title: `Desarrollo en ${category.name}`,
                    description: `Se recomienda reforzar habilidades en ${category.name}`,
                    actions: lowSkills.map(skill => `Practicar ${skill.name}`),
                    category: categoryId
                });
            }
        });

        // Analizar proyectos
        const inProgressProjects = portfolio.projects.filter(p => p.status === 'in_progress');
        if (inProgressProjects.length > 3) {
            recommendations.push({
                type: 'project_management',
                priority: 'high',
                title: 'Gestión de Proyectos',
                description: 'Tienes muchos proyectos en progreso',
                actions: ['Priorizar proyectos', 'Establecer fechas límite', 'Solicitar apoyo']
            });
        }

        // Analizar reflexiones
        const recentReflections = portfolio.reflections.filter(r =>
            new Date(r.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        );

        if (recentReflections.length === 0) {
            recommendations.push({
                type: 'reflection',
                priority: 'low',
                title: 'Práctica Reflexiva',
                description: 'No has añadido reflexiones recientemente',
                actions: ['Escribir una reflexión sobre tu aprendizaje', 'Evaluar tu progreso']
            });
        }

        return recommendations;
    }

    // Agregar entrada al timeline
    addTimelineEntry(portfolioId, type, data) {
        const portfolio = this.portfolios.get(portfolioId);
        if (!portfolio) return false;

        const entry = {
            id: Date.now() + Math.random(),
            type,
            timestamp: new Date().toISOString(),
            message: data.message,
            data,
            icon: this.getTimelineIcon(type)
        };

        portfolio.timeline.push(entry);

        // Mantener solo las últimas 100 entradas
        if (portfolio.timeline.length > 100) {
            portfolio.timeline = portfolio.timeline.slice(-100);
        }

        this.updatePortfolioTimestamp(portfolioId);
        return true;
    }

    // Obtener icono para timeline
    getTimelineIcon(type) {
        const icons = {
            'portfolio_created': '🎓',
            'project_added': '📁',
            'competency_improved': '📈',
            'achievement_earned': '🏆',
            'reflection_added': '💭',
            'goal_set': '🎯',
            'goal_completed': '✅'
        };
        return icons[type] || '📌';
    }

    // Verificar logros automáticos
    checkForAchievements(portfolioId, categoryId, skillId) {
        const portfolio = this.portfolios.get(portfolioId);
        if (!portfolio) return;

        const skill = portfolio.competencies[categoryId].skills.find(s => s.id === skillId);
        if (!skill) return;

        // Logro por alcanzar nivel experto
        if (skill.level === 4) {
            this.addAchievement(portfolioId, {
                title: `Experto en ${skill.name}`,
                description: `Has alcanzado el nivel experto en ${skill.name}`,
                type: 'academic',
                category: 'competency_mastery',
                level: 'school',
                issuer: 'Sistema BGE',
                verified: true,
                competencies: [skillId]
            });
        }

        // Verificar logros de categoría completa
        const allSkillsAdvanced = portfolio.competencies[categoryId].skills.every(s => s.level >= 3);
        if (allSkillsAdvanced) {
            const hasAchievement = portfolio.achievements.some(a =>
                a.category === 'category_mastery' && a.title.includes(portfolio.competencies[categoryId].name)
            );

            if (!hasAchievement) {
                this.addAchievement(portfolioId, {
                    title: `Maestría en ${portfolio.competencies[categoryId].name}`,
                    description: `Has alcanzado nivel avanzado en todas las habilidades de ${portfolio.competencies[categoryId].name}`,
                    type: 'academic',
                    category: 'category_mastery',
                    level: 'school',
                    issuer: 'Sistema BGE',
                    verified: true
                });
            }
        }
    }

    // Métodos auxiliares
    updatePortfolioTimestamp(portfolioId) {
        const portfolio = this.portfolios.get(portfolioId);
        if (portfolio) {
            portfolio.metadata.lastUpdated = new Date().toISOString();
        }
    }

    generatePortfolioId() {
        return `portfolio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateProjectId() {
        return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateAchievementId() {
        return `achievement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateReflectionId() {
        return `reflection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateGoalId() {
        return `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Persistencia de datos
    loadPortfolioData() {
        try {
            const portfoliosData = localStorage.getItem('bge_student_portfolios');
            if (portfoliosData) {
                const portfolios = JSON.parse(portfoliosData);
                portfolios.forEach(portfolio => {
                    this.portfolios.set(portfolio.id, portfolio);
                });
            }
            BGELogger?.debug('Student Portfolio', '💾 Datos de portfolio cargados');
        } catch (error) {
            BGELogger?.error('Student Portfolio', 'Error cargando datos', error);
        }
    }

    savePortfolioData() {
        try {
            const portfoliosArray = Array.from(this.portfolios.values());
            localStorage.setItem('bge_student_portfolios', JSON.stringify(portfoliosArray));
            BGELogger?.debug('Student Portfolio', '💾 Datos de portfolio guardados');
        } catch (error) {
            BGELogger?.error('Student Portfolio', 'Error guardando datos', error);
        }
    }

    setupAutoSave() {
        setInterval(() => {
            this.savePortfolioData();
        }, 2 * 60 * 1000); // Cada 2 minutos
    }

    // Configurar framework de habilidades
    setupSkillsFramework() {
        BGELogger?.debug('Student Portfolio', '🎯 Framework de competencias configurado');
    }

    // Inicializar plantillas
    initializeTemplates() {
        BGELogger?.debug('Student Portfolio', '📋 Plantillas de portfolio inicializadas');
    }

    // API pública
    getPortfolio(portfolioId) {
        return this.portfolios.get(portfolioId);
    }

    getSystemStatistics() {
        return {
            totalPortfolios: this.portfolios.size,
            competencyCategories: Object.keys(this.competencyFramework).length,
            lastUpdated: new Date().toISOString()
        };
    }
}

// Inicialización global
window.BGEStudentPortfolio = new BGEStudentPortfolio();

// Registrar en el contexto
if (window.BGEContext) {
    window.BGEContext.registerModule('student-portfolio', window.BGEStudentPortfolio, ['logger']);
}

console.log('✅ BGE Student Portfolio System cargado exitosamente');