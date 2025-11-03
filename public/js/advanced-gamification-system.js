/**
 * 🎮 ADVANCED GAMIFICATION SYSTEM - FASE 7.3
 * Sistema avanzado de gamificación para BGE Héroes de la Patria
 * Mecánicas de juego, logros, niveles, insignias y competencias educativas
 */

class AdvancedGamificationSystem {
    constructor() {
        this.playerProfile = {
            level: 1,
            xp: 0,
            iaCoins: 100,
            prestige: 0,
            achievements: [],
            badges: [],
            streaks: {},
            stats: {
                lessonsCompleted: 0,
                experimentsCompleted: 0,
                questionsAnswered: 0,
                perfectScores: 0,
                collaborations: 0,
                helpGiven: 0
            }
        };

        this.gameElements = {
            levels: {
                maxLevel: 100,
                xpRequiredBase: 100,
                xpMultiplier: 1.2,
                prestigeThreshold: 50
            },
            quests: {
                daily: [],
                weekly: [],
                seasonal: [],
                special: []
            },
            competitions: {
                active: [],
                leaderboards: {},
                seasons: []
            },
            rewards: {
                xpMultipliers: {},
                coinBonuses: {},
                specialItems: []
            }
        };

        this.achievements = {
            academic: [
                { id: 'first_steps', name: 'Primeros Pasos', description: 'Completa tu primera lección', xp: 50, coins: 10 },
                { id: 'perfect_week', name: 'Semana Perfecta', description: '7 días consecutivos de estudio', xp: 500, coins: 100 },
                { id: 'knowledge_seeker', name: 'Buscador de Conocimiento', description: 'Completa 100 lecciones', xp: 1000, coins: 200 },
                { id: 'master_student', name: 'Estudiante Maestro', description: 'Alcanza nivel 25', xp: 2000, coins: 500 }
            ],
            social: [
                { id: 'helper', name: 'Ayudante', description: 'Ayuda a 10 compañeros', xp: 300, coins: 50 },
                { id: 'mentor', name: 'Mentor', description: 'Conviértete en tutor de otros estudiantes', xp: 1500, coins: 300 },
                { id: 'team_player', name: 'Jugador de Equipo', description: 'Participa en 5 proyectos colaborativos', xp: 800, coins: 150 }
            ],
            innovation: [
                { id: 'ar_pioneer', name: 'Pionero AR', description: 'Completa tu primera experiencia AR', xp: 200, coins: 40 },
                { id: 'lab_scientist', name: 'Científico de Laboratorio', description: 'Completa 10 experimentos virtuales', xp: 600, coins: 120 },
                { id: 'ai_whisperer', name: 'Susurrador de IA', description: 'Interactúa 100 veces con el tutor IA', xp: 400, coins: 80 }
            ],
            special: [
                { id: 'night_owl', name: 'Búho Nocturno', description: 'Estudia después de las 10 PM', xp: 100, coins: 20 },
                { id: 'early_bird', name: 'Madrugador', description: 'Estudia antes de las 7 AM', xp: 100, coins: 20 },
                { id: 'speed_demon', name: 'Demonio de Velocidad', description: 'Completa una lección en menos de 5 minutos', xp: 150, coins: 30 }
            ]
        };

        this.badges = {
            subject_mastery: [
                { id: 'math_bronze', name: 'Matemáticas Bronce', subject: 'mathematics', level: 'bronze' },
                { id: 'math_silver', name: 'Matemáticas Plata', subject: 'mathematics', level: 'silver' },
                { id: 'math_gold', name: 'Matemáticas Oro', subject: 'mathematics', level: 'gold' },
                { id: 'science_bronze', name: 'Ciencias Bronce', subject: 'sciences', level: 'bronze' }
            ],
            skill_based: [
                { id: 'critical_thinker', name: 'Pensador Crítico', skill: 'critical_thinking' },
                { id: 'problem_solver', name: 'Solucionador de Problemas', skill: 'problem_solving' },
                { id: 'creative_mind', name: 'Mente Creativa', skill: 'creativity' }
            ],
            seasonal: [
                { id: 'autumn_scholar', name: 'Académico de Otoño', season: 'autumn', year: 2024 },
                { id: 'winter_warrior', name: 'Guerrero de Invierno', season: 'winter', year: 2024 }
            ]
        };

        this.competitions = {
            individual: [
                {
                    id: 'weekly_challenge',
                    name: 'Desafío Semanal',
                    type: 'individual',
                    duration: 7,
                    rewards: { 1: { xp: 1000, coins: 200 }, 2: { xp: 500, coins: 100 }, 3: { xp: 250, coins: 50 } }
                }
            ],
            team: [
                {
                    id: 'class_competition',
                    name: 'Competencia de Clase',
                    type: 'team',
                    duration: 30,
                    rewards: { 1: { xp: 2000, coins: 500 }, 2: { xp: 1000, coins: 250 } }
                }
            ],
            school: [
                {
                    id: 'inter_school_olympics',
                    name: 'Olimpiadas Inter-Escolares',
                    type: 'school',
                    duration: 90,
                    rewards: { 1: { xp: 5000, coins: 1000, badge: 'champion' } }
                }
            ]
        };

        this.quests = {
            daily: [
                { id: 'daily_study', name: 'Estudio Diario', description: 'Estudia por 30 minutos', xp: 50, coins: 10 },
                { id: 'daily_quiz', name: 'Quiz Diario', description: 'Responde 10 preguntas correctamente', xp: 75, coins: 15 },
                { id: 'daily_help', name: 'Ayuda Diaria', description: 'Ayuda a un compañero', xp: 100, coins: 20 }
            ],
            weekly: [
                { id: 'weekly_mastery', name: 'Maestría Semanal', description: 'Domina un tema nuevo', xp: 300, coins: 60 },
                { id: 'weekly_experiment', name: 'Experimento Semanal', description: 'Completa un experimento virtual', xp: 400, coins: 80 }
            ],
            seasonal: [
                { id: 'autumn_achievement', name: 'Logro de Otoño', description: 'Completa 50 lecciones en otoño', xp: 1500, coins: 300 }
            ]
        };

        this.powerUps = {
            xp_boost: { name: 'Boost de XP', description: 'Duplica XP por 1 hora', duration: 3600, cost: 50 },
            coin_magnet: { name: 'Imán de Monedas', description: '+50% monedas por 2 horas', duration: 7200, cost: 75 },
            streak_saver: { name: 'Salvavidas de Racha', description: 'Protege tu racha por 1 día', duration: 86400, cost: 100 },
            double_rewards: { name: 'Recompensas Dobles', description: 'Duplica todas las recompensas por 30 min', duration: 1800, cost: 150 }
        };

        this.socialFeatures = {
            friends: [],
            study_groups: [],
            mentorships: [],
            collaborations: []
        };

        this.activeEffects = [];
        this.notifications = [];
        this.statistics = {};

        this.init();
    }

    async init() {
        await this.loadPlayerProfile();
        this.setupGameMechanics();
        this.initializeDailyQuests();
        this.startProgressTracking();
        this.createGameInterface();
        this.createGameActivationButton(); // ✅ RESTAURAR BOTÓN FLOTANTE
        this.setupNotificationSystem();

        console.log('🎮 Advanced Gamification System inicializado');
        console.log(`🏆 Nivel actual: ${this.playerProfile.level} | XP: ${this.playerProfile.xp}`);
    }

    setupGameMechanics() {
        // Configurar mecánicas básicas del juego
        this.gameMechanics = {
            levelProgression: {
                enabled: true,
                maxLevel: this.gameElements.levels.maxLevel,
                xpCurve: 'exponential',
                prestigeSystem: true
            },
            achievements: {
                enabled: true,
                categories: Object.keys(this.achievements),
                autoUnlock: true,
                notifications: true
            },
            quests: {
                enabled: true,
                dailyReset: true,
                weeklyReset: true,
                seasonalEvents: true,
                autoGeneration: true
            },
            competitions: {
                enabled: true,
                leaderboards: true,
                seasons: true,
                rewards: true
            },
            powerUps: {
                enabled: true,
                stackable: false,
                marketplace: true,
                duration: true
            },
            social: {
                enabled: true,
                friends: true,
                groups: true,
                mentoring: true,
                collaboration: true
            }
        };

        // Configurar sistemas de recompensas
        this.rewardSystem = {
            xpMultipliers: {
                perfect_score: 1.5,
                streak_bonus: 1.2,
                time_bonus: 1.1,
                collaboration: 1.3,
                mentor_bonus: 1.4
            },
            coinBonuses: {
                daily_quest: 2.0,
                weekly_quest: 3.0,
                achievement: 2.5,
                competition_win: 5.0
            },
            specialRewards: {
                rare_badges: true,
                exclusive_content: true,
                customization_options: true,
                early_access: true
            }
        };

        // Configurar sistema de rachas
        this.streakSystem = {
            types: ['daily_study', 'quiz_streak', 'lab_streak', 'help_streak'],
            bonuses: {
                7: { xp: 1.2, coins: 1.5 },
                14: { xp: 1.3, coins: 1.7 },
                30: { xp: 1.5, coins: 2.0 },
                60: { xp: 2.0, coins: 3.0 }
            },
            protection: {
                available: true,
                cost: 100,
                duration: 86400 // 24 horas
            }
        };

        // Configurar algoritmos de dificultad adaptativa
        this.adaptiveDifficulty = {
            enabled: true,
            factors: ['performance', 'speed', 'consistency', 'help_requests'],
            adjustmentRate: 0.1,
            minDifficulty: 0.3,
            maxDifficulty: 2.0
        };

        // Configurar sistema de logros
        this.achievementSystem = {
            tracking: {
                automatic: true,
                realTime: true,
                retroactive: false
            },
            categories: {
                academic: { weight: 1.0, priority: 'high' },
                social: { weight: 1.2, priority: 'medium' },
                innovation: { weight: 1.5, priority: 'high' },
                special: { weight: 0.8, priority: 'low' }
            },
            unlockConditions: {
                checkInterval: 5000, // 5 segundos
                batchProcessing: true,
                notifications: true
            }
        };

        // Inicializar timers y eventos
        this.initializeGameTimers();
        this.setupEventListeners();

        console.log('⚙️ Mecánicas de juego configuradas');
        console.log(`🎯 Sistemas activos: ${Object.keys(this.gameMechanics).filter(key => this.gameMechanics[key].enabled).length}`);
    }

    initializeGameTimers() {
        // Timer para verificar logros
        this.achievementCheckTimer = setInterval(() => {
            this.checkPendingAchievements();
        }, this.achievementSystem.unlockConditions.checkInterval);

        // Timer para actualizar rachas
        this.streakUpdateTimer = setInterval(() => {
            this.updateStreaks();
        }, 60000); // Cada minuto

        // Timer para quests diarias (reset a medianoche)
        const now = new Date();
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);
        const timeToMidnight = midnight.getTime() - now.getTime();

        setTimeout(() => {
            this.resetDailyQuests();
            // Configurar timer diario
            this.dailyResetTimer = setInterval(() => {
                this.resetDailyQuests();
            }, 86400000); // 24 horas
        }, timeToMidnight);

        console.log('⏰ Timers de juego inicializados');
    }

    setupEventListeners() {
        // Escuchar eventos del sistema educativo
        document.addEventListener('lessonCompleted', (event) => {
            this.handleLessonCompletion(event.detail);
        });

        document.addEventListener('quizCompleted', (event) => {
            this.handleQuizCompletion(event.detail);
        });

        document.addEventListener('experimentCompleted', (event) => {
            this.handleExperimentCompletion(event.detail);
        });

        document.addEventListener('helpGiven', (event) => {
            this.handleHelpGiven(event.detail);
        });

        document.addEventListener('collaborationStarted', (event) => {
            this.handleCollaborationStarted(event.detail);
        });

        console.log('👂 Event listeners configurados');
    }

    // === SISTEMA DE NIVELES Y EXPERIENCIA ===

    calculateXPRequiredForLevel(level) {
        return Math.floor(
            this.gameElements.levels.xpRequiredBase *
            Math.pow(this.gameElements.levels.xpMultiplier, level - 1)
        );
    }

    awardXP(amount, source = 'unknown', multiplier = 1) {
        const baseAmount = amount;
        const totalAmount = Math.floor(baseAmount * multiplier);

        // Aplicar multiplicadores activos
        const boostedAmount = this.applyActiveBoosts(totalAmount, 'xp');

        this.playerProfile.xp += boostedAmount;

        // Verificar subida de nivel
        this.checkLevelUp();

        // Registrar estadística
        this.recordStatistic('xp_earned', boostedAmount);

        // Mostrar notificación
        this.showNotification(`+${boostedAmount} XP`, 'xp', source);

        console.log(`⭐ XP otorgado: +${boostedAmount} (fuente: ${source})`);

        return boostedAmount;
    }

    awardCoins(amount, source = 'unknown', multiplier = 1) {
        const totalAmount = Math.floor(amount * multiplier);
        const boostedAmount = this.applyActiveBoosts(totalAmount, 'coins');

        this.playerProfile.iaCoins += boostedAmount;

        this.recordStatistic('coins_earned', boostedAmount);
        this.showNotification(`+${boostedAmount} IA Coins`, 'coins', source);

        console.log(`🪙 Monedas otorgadas: +${boostedAmount} (fuente: ${source})`);

        return boostedAmount;
    }

    checkLevelUp() {
        const currentLevel = this.playerProfile.level;
        const xpRequired = this.calculateXPRequiredForLevel(currentLevel + 1);

        if (this.playerProfile.xp >= xpRequired) {
            this.playerProfile.level++;
            this.playerProfile.xp -= xpRequired;

            // Recompensas por subir de nivel
            const levelRewards = this.calculateLevelRewards(this.playerProfile.level);
            this.awardCoins(levelRewards.coins, 'level_up');

            // Verificar prestigio
            this.checkPrestigeEligibility();

            // Notificación especial de subida de nivel
            this.showLevelUpNotification(this.playerProfile.level);

            // Verificar logros relacionados con niveles
            this.checkLevelAchievements();

            console.log(`🎉 ¡Subida de nivel! Nuevo nivel: ${this.playerProfile.level}`);

            // Verificar si hay más niveles que subir
            setTimeout(() => this.checkLevelUp(), 100);
        }
    }

    calculateLevelRewards(level) {
        return {
            coins: level * 10 + Math.floor(level / 5) * 50,
            powerUps: level % 10 === 0 ? ['xp_boost'] : []
        };
    }

    checkPrestigeEligibility() {
        if (this.playerProfile.level >= this.gameElements.levels.prestigeThreshold &&
            this.playerProfile.prestige === 0) {
            this.showPrestigeOption();
        }
    }

    performPrestige() {
        if (this.playerProfile.level < this.gameElements.levels.prestigeThreshold) {
            throw new Error('Nivel insuficiente para prestigio');
        }

        // Resetear nivel y XP, pero conservar logros y estadísticas importantes
        const oldLevel = this.playerProfile.level;
        this.playerProfile.level = 1;
        this.playerProfile.xp = 0;
        this.playerProfile.prestige++;

        // Bonificaciones permanentes por prestigio
        this.playerProfile.prestigeBonuses = {
            xpMultiplier: 1 + (this.playerProfile.prestige * 0.1),
            coinMultiplier: 1 + (this.playerProfile.prestige * 0.05),
            specialAbilities: this.getPrestigeAbilities(this.playerProfile.prestige)
        };

        // Logro especial de prestigio
        this.unlockAchievement('prestige_master');

        console.log(`✨ Prestigio alcanzado! Nivel de prestigio: ${this.playerProfile.prestige}`);
    }

    // === SISTEMA DE LOGROS ===

    checkAchievement(achievementId, currentValue, targetValue) {
        if (this.playerProfile.achievements.includes(achievementId)) {
            return false; // Ya desbloqueado
        }

        if (currentValue >= targetValue) {
            this.unlockAchievement(achievementId);
            return true;
        }

        return false;
    }

    unlockAchievement(achievementId) {
        const achievement = this.findAchievementById(achievementId);
        if (!achievement) {
            console.warn(`Logro no encontrado: ${achievementId}`);
            return;
        }

        if (this.playerProfile.achievements.includes(achievementId)) {
            return; // Ya desbloqueado
        }

        this.playerProfile.achievements.push(achievementId);

        // Otorgar recompensas
        this.awardXP(achievement.xp, `achievement_${achievementId}`);
        this.awardCoins(achievement.coins, `achievement_${achievementId}`);

        // Notificación especial de logro
        this.showAchievementNotification(achievement);

        // Verificar logros en cadena
        this.checkChainedAchievements(achievementId);

        console.log(`🏆 Logro desbloqueado: ${achievement.name}`);
    }

    findAchievementById(achievementId) {
        for (const category of Object.values(this.achievements)) {
            const achievement = category.find(a => a.id === achievementId);
            if (achievement) return achievement;
        }
        return null;
    }

    checkChainedAchievements(unlockedAchievementId) {
        // Verificar si el logro desbloqueado activa otros logros
        const chainedChecks = {
            'first_steps': () => this.checkProgressAchievements(),
            'perfect_week': () => this.checkStreakAchievements(),
            'helper': () => this.checkSocialAchievements()
        };

        const checkFunction = chainedChecks[unlockedAchievementId];
        if (checkFunction) {
            setTimeout(checkFunction, 1000);
        }
    }

    // === SISTEMA DE INSIGNIAS ===

    awardBadge(badgeId, reason = '') {
        const badge = this.findBadgeById(badgeId);
        if (!badge) {
            console.warn(`Insignia no encontrada: ${badgeId}`);
            return;
        }

        if (this.playerProfile.badges.some(b => b.id === badgeId)) {
            return; // Ya otorgada
        }

        const awardedBadge = {
            ...badge,
            awardedAt: Date.now(),
            reason: reason
        };

        this.playerProfile.badges.push(awardedBadge);

        // Recompensas por insignia
        this.awardXP(200, `badge_${badgeId}`);
        this.awardCoins(50, `badge_${badgeId}`);

        this.showBadgeNotification(awardedBadge);

        console.log(`🎖️ Insignia otorgada: ${badge.name}`);
    }

    findBadgeById(badgeId) {
        for (const category of Object.values(this.badges)) {
            const badge = category.find(b => b.id === badgeId);
            if (badge) return badge;
        }
        return null;
    }

    checkSubjectMastery(subject, performance) {
        const masteryLevels = {
            bronze: { threshold: 70, badge: `${subject}_bronze` },
            silver: { threshold: 85, badge: `${subject}_silver` },
            gold: { threshold: 95, badge: `${subject}_gold` }
        };

        for (const [level, criteria] of Object.entries(masteryLevels)) {
            if (performance >= criteria.threshold) {
                this.awardBadge(criteria.badge, `${performance}% de dominio en ${subject}`);
            }
        }
    }

    // === SISTEMA DE MISIONES ===

    initializeDailyQuests() {
        const today = new Date().toDateString();
        const lastQuestDay = localStorage.getItem('last_quest_day');

        if (lastQuestDay !== today) {
            this.generateDailyQuests();
            localStorage.setItem('last_quest_day', today);
        } else {
            this.loadSavedQuests();
        }
    }

    generateDailyQuests() {
        const availableQuests = this.quests.daily;
        const selectedQuests = [];

        // Seleccionar 3 misiones diarias aleatorias
        for (let i = 0; i < 3; i++) {
            const randomQuest = availableQuests[Math.floor(Math.random() * availableQuests.length)];
            if (!selectedQuests.find(q => q.id === randomQuest.id)) {
                selectedQuests.push({
                    ...randomQuest,
                    progress: 0,
                    completed: false,
                    assignedAt: Date.now()
                });
            }
        }

        this.gameElements.quests.daily = selectedQuests;
        this.saveQuests();

        console.log(`📋 Misiones diarias generadas: ${selectedQuests.length}`);
    }

    updateQuestProgress(questType, questId, progress) {
        const questList = this.gameElements.quests[questType];
        const quest = questList.find(q => q.id === questId);

        if (!quest || quest.completed) return;

        quest.progress = Math.min(quest.progress + progress, quest.target || 1);

        if (quest.progress >= (quest.target || 1)) {
            this.completeQuest(questType, questId);
        }

        this.saveQuests();
    }

    completeQuest(questType, questId) {
        const questList = this.gameElements.quests[questType];
        const quest = questList.find(q => q.id === questId);

        if (!quest || quest.completed) return;

        quest.completed = true;
        quest.completedAt = Date.now();

        // Otorgar recompensas
        this.awardXP(quest.xp, `quest_${questId}`);
        this.awardCoins(quest.coins, `quest_${questId}`);

        // Notificación de misión completada
        this.showQuestCompletionNotification(quest);

        // Verificar si todas las misiones diarias están completadas
        this.checkDailyQuestCompletion();

        console.log(`✅ Misión completada: ${quest.name}`);
    }

    checkDailyQuestCompletion() {
        const dailyQuests = this.gameElements.quests.daily;
        const allCompleted = dailyQuests.every(q => q.completed);

        if (allCompleted) {
            // Bonificación por completar todas las misiones diarias
            this.awardXP(500, 'daily_completion_bonus');
            this.awardCoins(100, 'daily_completion_bonus');

            // Actualizar racha diaria
            this.updateDailyStreak();

            this.showNotification('¡Todas las misiones diarias completadas!', 'special', 'daily_bonus');
        }
    }

    // === SISTEMA DE RACHAS ===

    updateDailyStreak() {
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        if (!this.playerProfile.streaks.daily) {
            this.playerProfile.streaks.daily = {
                current: 0,
                longest: 0,
                lastUpdate: null
            };
        }

        const streak = this.playerProfile.streaks.daily;

        if (streak.lastUpdate === yesterday) {
            // Continuar racha
            streak.current++;
        } else if (streak.lastUpdate !== today) {
            // Romper racha o empezar nueva
            streak.current = 1;
        }

        streak.lastUpdate = today;
        streak.longest = Math.max(streak.longest, streak.current);

        // Verificar logros de racha
        this.checkStreakAchievements();

        // Recompensas por racha
        this.awardStreakRewards(streak.current);

        console.log(`🔥 Racha diaria: ${streak.current} días`);
    }

    awardStreakRewards(streakDays) {
        const milestones = [3, 7, 14, 30, 60, 100];

        if (milestones.includes(streakDays)) {
            const bonusXP = streakDays * 50;
            const bonusCoins = streakDays * 10;

            this.awardXP(bonusXP, `streak_${streakDays}_days`);
            this.awardCoins(bonusCoins, `streak_${streakDays}_days`);

            // Insignia especial para rachas largas
            if (streakDays >= 30) {
                this.awardBadge('streak_master', `${streakDays} días consecutivos`);
            }
        }
    }

    // === SISTEMA DE COMPETENCIAS ===

    joinCompetition(competitionId) {
        const competition = this.findCompetitionById(competitionId);
        if (!competition) {
            throw new Error('Competencia no encontrada');
        }

        // Verificar elegibilidad
        if (!this.checkCompetitionEligibility(competition)) {
            throw new Error('No elegible para esta competencia');
        }

        // Agregar jugador a la competencia
        if (!competition.participants) {
            competition.participants = [];
        }

        if (!competition.participants.includes(this.playerProfile.id)) {
            competition.participants.push({
                id: this.playerProfile.id,
                name: this.playerProfile.name,
                score: 0,
                joinedAt: Date.now()
            });

            this.showNotification(`Te has unido a: ${competition.name}`, 'competition');
            console.log(`🏆 Unido a competencia: ${competition.name}`);
        }
    }

    updateCompetitionScore(competitionId, scoreIncrease) {
        const competition = this.findCompetitionById(competitionId);
        if (!competition || !competition.participants) return;

        const participant = competition.participants.find(p => p.id === this.playerProfile.id);
        if (participant) {
            participant.score += scoreIncrease;
            this.updateLeaderboard(competitionId);
        }
    }

    updateLeaderboard(competitionId) {
        const competition = this.findCompetitionById(competitionId);
        if (!competition) return;

        // Ordenar participantes por puntuación
        competition.participants.sort((a, b) => b.score - a.score);

        // Actualizar posiciones
        competition.participants.forEach((participant, index) => {
            participant.position = index + 1;
        });

        // Guardar en leaderboard global
        this.gameElements.competitions.leaderboards[competitionId] = {
            competition: competition.name,
            participants: competition.participants.slice(0, 100), // Top 100
            lastUpdate: Date.now()
        };
    }

    // === SISTEMA DE POWER-UPS ===

    purchasePowerUp(powerUpId) {
        const powerUp = this.powerUps[powerUpId];
        if (!powerUp) {
            throw new Error('Power-up no encontrado');
        }

        if (this.playerProfile.iaCoins < powerUp.cost) {
            throw new Error('Monedas insuficientes');
        }

        // Deducir costo
        this.playerProfile.iaCoins -= powerUp.cost;

        // Activar power-up
        this.activatePowerUp(powerUpId);

        this.showNotification(`Power-up activado: ${powerUp.name}`, 'powerup');
        console.log(`⚡ Power-up comprado y activado: ${powerUp.name}`);
    }

    activatePowerUp(powerUpId) {
        const powerUp = this.powerUps[powerUpId];

        const activeEffect = {
            id: powerUpId,
            name: powerUp.name,
            description: powerUp.description,
            activatedAt: Date.now(),
            expiresAt: Date.now() + (powerUp.duration * 1000),
            active: true
        };

        this.activeEffects.push(activeEffect);

        // Configurar expiración automática
        setTimeout(() => {
            this.deactivatePowerUp(powerUpId);
        }, powerUp.duration * 1000);
    }

    deactivatePowerUp(powerUpId) {
        const effectIndex = this.activeEffects.findIndex(e => e.id === powerUpId && e.active);

        if (effectIndex !== -1) {
            this.activeEffects[effectIndex].active = false;
            this.showNotification(`Power-up expirado: ${this.activeEffects[effectIndex].name}`, 'powerup_expired');
        }
    }

    applyActiveBoosts(amount, type) {
        let boostedAmount = amount;

        for (const effect of this.activeEffects) {
            if (!effect.active || Date.now() > effect.expiresAt) continue;

            if (effect.id === 'xp_boost' && type === 'xp') {
                boostedAmount *= 2;
            } else if (effect.id === 'coin_magnet' && type === 'coins') {
                boostedAmount *= 1.5;
            } else if (effect.id === 'double_rewards') {
                boostedAmount *= 2;
            }
        }

        // Aplicar bonificaciones de prestigio
        if (this.playerProfile.prestigeBonuses) {
            if (type === 'xp') {
                boostedAmount *= this.playerProfile.prestigeBonuses.xpMultiplier;
            } else if (type === 'coins') {
                boostedAmount *= this.playerProfile.prestigeBonuses.coinMultiplier;
            }
        }

        return Math.floor(boostedAmount);
    }

    // === INTEGRACIÓN CON ACTIVIDADES EDUCATIVAS ===

    onLessonCompleted(subject, difficulty, score, timeSpent) {
        // XP base por lección
        let baseXP = 100;
        if (difficulty === 'hard') baseXP *= 1.5;
        if (difficulty === 'expert') baseXP *= 2;

        // Bonificación por puntuación
        const scoreMultiplier = score / 100;
        const finalXP = Math.floor(baseXP * scoreMultiplier);

        // Otorgar recompensas
        this.awardXP(finalXP, 'lesson_completed');
        this.awardCoins(Math.floor(finalXP / 5), 'lesson_completed');

        // Actualizar estadísticas
        this.playerProfile.stats.lessonsCompleted++;
        this.recordStatistic('time_studied', timeSpent);

        // Verificar logros
        this.checkLessonAchievements(subject, score);

        // Verificar maestría de materia
        this.checkSubjectMastery(subject, score);

        // Actualizar progreso de misiones
        this.updateQuestProgress('daily', 'daily_study', 1);

        console.log(`📚 Lección completada: +${finalXP} XP (${subject}, puntuación: ${score}%)`);
    }

    onExperimentCompleted(labType, experimentType, score, innovations) {
        const baseXP = 200;
        const innovationBonus = innovations * 50;
        const finalXP = Math.floor((baseXP + innovationBonus) * (score / 100));

        this.awardXP(finalXP, 'experiment_completed');
        this.awardCoins(Math.floor(finalXP / 4), 'experiment_completed');

        this.playerProfile.stats.experimentsCompleted++;

        // Verificar logros de laboratorio
        this.checkLabAchievements(labType, experimentType);

        // Insignia de científico
        if (this.playerProfile.stats.experimentsCompleted >= 10) {
            this.awardBadge('lab_scientist');
        }

        this.updateQuestProgress('weekly', 'weekly_experiment', 1);
    }

    onQuestionAnswered(correct, difficulty, timeToAnswer) {
        if (correct) {
            let baseXP = 10;
            if (difficulty === 'hard') baseXP = 20;
            if (difficulty === 'expert') baseXP = 30;

            // Bonificación por velocidad
            const speedBonus = timeToAnswer < 5000 ? 1.5 : 1; // 5 segundos
            const finalXP = Math.floor(baseXP * speedBonus);

            this.awardXP(finalXP, 'question_answered');
            this.awardCoins(Math.floor(finalXP / 10), 'question_answered');

            this.playerProfile.stats.questionsAnswered++;

            if (timeToAnswer < 5000) {
                this.checkAchievement('speed_demon', 1, 1);
            }

            this.updateQuestProgress('daily', 'daily_quiz', 1);
        }
    }

    onARExperienceCompleted(subject, scenario, interactions, timeSpent) {
        const baseXP = 300;
        const interactionBonus = interactions * 10;
        const finalXP = baseXP + interactionBonus;

        this.awardXP(finalXP, 'ar_experience');
        this.awardCoins(Math.floor(finalXP / 3), 'ar_experience');

        // Verificar logro de pionero AR
        this.checkAchievement('ar_pioneer', 1, 1);

        console.log(`🥽 Experiencia AR completada: +${finalXP} XP`);
    }

    onAIInteraction(interactionType, helpful) {
        if (helpful) {
            this.awardXP(5, 'ai_interaction');

            // Contador para logro de AI Whisperer
            if (!this.playerProfile.stats.aiInteractions) {
                this.playerProfile.stats.aiInteractions = 0;
            }
            this.playerProfile.stats.aiInteractions++;

            this.checkAchievement('ai_whisperer', this.playerProfile.stats.aiInteractions, 100);
        }
    }

    // === VERIFICACIONES DE LOGROS ESPECÍFICOS ===

    checkLessonAchievements(subject, score) {
        // Primer paso
        if (this.playerProfile.stats.lessonsCompleted === 1) {
            this.unlockAchievement('first_steps');
        }

        // Buscador de conocimiento
        if (this.playerProfile.stats.lessonsCompleted >= 100) {
            this.unlockAchievement('knowledge_seeker');
        }

        // Puntuación perfecta
        if (score === 100) {
            this.playerProfile.stats.perfectScores++;
            if (this.playerProfile.stats.perfectScores >= 10) {
                this.unlockAchievement('perfectionist');
            }
        }
    }

    checkLevelAchievements() {
        if (this.playerProfile.level >= 25) {
            this.unlockAchievement('master_student');
        }
    }

    checkStreakAchievements() {
        const streak = this.playerProfile.streaks.daily?.current || 0;

        if (streak >= 7) {
            this.unlockAchievement('perfect_week');
        }
    }

    checkLabAchievements(labType, experimentType) {
        if (this.playerProfile.stats.experimentsCompleted >= 10) {
            this.unlockAchievement('lab_scientist');
        }
    }

    // === INTERFAZ DE GAMIFICACIÓN ===

    createGameInterface() {
        const gameInterface = document.createElement('div');
        gameInterface.id = 'gamification-interface';
        gameInterface.className = 'gamification-interface hidden';

        gameInterface.innerHTML = `
            <div class="game-header">
                <h2>🎮 Centro de Gamificación</h2>
                <button class="close-game" id="close-game">×</button>
            </div>

            <div class="game-content">
                <div class="player-profile">
                    <div class="profile-card">
                        <div class="player-avatar">🎓</div>
                        <div class="player-info">
                            <h3 id="player-name">Estudiante</h3>
                            <div class="level-info">
                                <span>Nivel ${this.playerProfile.level}</span>
                                <div class="xp-bar">
                                    <div class="xp-fill" id="xp-fill"></div>
                                </div>
                                <span id="xp-text">XP: ${this.playerProfile.xp}</span>
                            </div>
                            <div class="currency">
                                <span>🪙 ${this.playerProfile.iaCoins} IA Coins</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="game-tabs">
                    <button class="game-tab active" data-tab="quests">Misiones</button>
                    <button class="game-tab" data-tab="achievements">Logros</button>
                    <button class="game-tab" data-tab="competitions">Competencias</button>
                    <button class="game-tab" data-tab="powerups">Power-ups</button>
                    <button class="game-tab" data-tab="stats">Estadísticas</button>
                </div>

                <div class="game-tab-content">
                    <div class="tab-panel active" id="quests-panel">
                        <h3>📋 Misiones Diarias</h3>
                        <div class="quests-list" id="daily-quests"></div>
                    </div>

                    <div class="tab-panel" id="achievements-panel">
                        <h3>🏆 Logros</h3>
                        <div class="achievements-grid" id="achievements-grid"></div>
                    </div>

                    <div class="tab-panel" id="competitions-panel">
                        <h3>🏁 Competencias</h3>
                        <div class="competitions-list" id="competitions-list"></div>
                    </div>

                    <div class="tab-panel" id="powerups-panel">
                        <h3>⚡ Power-ups</h3>
                        <div class="powerups-grid" id="powerups-grid"></div>
                    </div>

                    <div class="tab-panel" id="stats-panel">
                        <h3>📊 Estadísticas</h3>
                        <div class="stats-display" id="stats-display"></div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(gameInterface);
        this.setupGameEventListeners();
        this.populateGameInterface();
    }

    createGameActivationButton() {
        const activationBtn = document.createElement('div');
        activationBtn.id = 'game-activation';
        activationBtn.className = 'game-activation';
        activationBtn.innerHTML = `
            <div class="activation-content">
                <div class="game-icon">🎮</div>
                <div class="level-badge">${this.playerProfile.level}</div>
            </div>
        `;

        activationBtn.addEventListener('click', () => this.toggleGameInterface());
        document.body.appendChild(activationBtn);
    }

    setupGameEventListeners() {
        // Usar event delegation para el botón cerrar
        document.addEventListener('click', (e) => {
            if (e.target.id === 'close-game' || e.target.classList.contains('close-game')) {
                this.closeGameInterface();
            }
        });

        document.querySelectorAll('.game-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchGameTab(tabName);
            });
        });
    }

    populateGameInterface() {
        this.updatePlayerProfile();
        this.populateDailyQuests();
        this.populateAchievements();
        this.populatePowerUps();
        this.populateStats();
    }

    populateAchievements() {
        const achievementsContainer = document.getElementById('achievements-list');
        if (!achievementsContainer) return;

        achievementsContainer.innerHTML = '';

        Object.entries(this.achievements).forEach(([key, achievement]) => {
            const isUnlocked = this.playerProfile.achievements.includes(key);
            const achievementElement = document.createElement('div');
            achievementElement.className = `achievement-item ${isUnlocked ? 'unlocked' : 'locked'}`;

            achievementElement.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-details">
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-description">${achievement.description}</div>
                    <div class="achievement-reward">+${achievement.reward} XP</div>
                </div>
                ${isUnlocked ? '<div class="achievement-badge">✓</div>' : ''}
            `;

            achievementsContainer.appendChild(achievementElement);
        });
    }

    populatePowerUps() {
        const powerUpsContainer = document.getElementById('powerups-list');
        if (!powerUpsContainer) return;

        powerUpsContainer.innerHTML = '';

        Object.entries(this.powerUps).forEach(([key, powerUp]) => {
            const isOwned = this.playerProfile.powerUps && this.playerProfile.powerUps.includes(key);
            const canAfford = this.playerProfile.coins >= powerUp.cost;

            const powerUpElement = document.createElement('div');
            powerUpElement.className = `powerup-item ${isOwned ? 'owned' : canAfford ? 'available' : 'locked'}`;

            powerUpElement.innerHTML = `
                <div class="powerup-icon">${powerUp.icon}</div>
                <div class="powerup-details">
                    <div class="powerup-name">${powerUp.name}</div>
                    <div class="powerup-description">${powerUp.description}</div>
                    <div class="powerup-cost">${powerUp.cost} 🪙</div>
                </div>
                ${isOwned ? '<div class="powerup-status">✓ Owned</div>' :
                  canAfford ? `<button onclick="gamificationSystem.buyPowerUp('${key}')" class="buy-powerup-btn">Comprar</button>` :
                  '<div class="powerup-status">🔒 Locked</div>'}
            `;

            powerUpsContainer.appendChild(powerUpElement);
        });
    }

    buyPowerUp(powerUpKey) {
        const powerUp = this.powerUps[powerUpKey];
        if (!powerUp || this.playerProfile.coins < powerUp.cost) return;

        if (!this.playerProfile.powerUps) {
            this.playerProfile.powerUps = [];
        }

        if (!this.playerProfile.powerUps.includes(powerUpKey)) {
            this.playerProfile.powerUps.push(powerUpKey);
            this.playerProfile.coins -= powerUp.cost;
            this.savePlayerProfile();
            this.populatePowerUps();
            this.showNotification(`Power-up adquirido: ${powerUp.name}!`, 'powerup');
        }
    }

    populateStats() {
        const statsContainer = document.getElementById('player-stats');
        if (!statsContainer) return;

        const stats = this.getUserStats();

        statsContainer.innerHTML = `
            <div class="stat-item">
                <div class="stat-icon">⭐</div>
                <div class="stat-details">
                    <div class="stat-value">${stats.totalXP}</div>
                    <div class="stat-label">XP Total</div>
                </div>
            </div>
            <div class="stat-item">
                <div class="stat-icon">🏆</div>
                <div class="stat-details">
                    <div class="stat-value">${stats.achievements}</div>
                    <div class="stat-label">Logros</div>
                </div>
            </div>
            <div class="stat-item">
                <div class="stat-icon">📋</div>
                <div class="stat-details">
                    <div class="stat-value">${stats.completedQuests}</div>
                    <div class="stat-label">Misiones</div>
                </div>
            </div>
            <div class="stat-item">
                <div class="stat-icon">🪙</div>
                <div class="stat-details">
                    <div class="stat-value">${stats.coins}</div>
                    <div class="stat-label">Monedas</div>
                </div>
            </div>
        `;
    }

    updatePlayerProfile() {
        const xpRequired = this.calculateXPRequiredForLevel(this.playerProfile.level + 1);
        const xpProgress = (this.playerProfile.xp / xpRequired) * 100;

        document.getElementById('xp-fill').style.width = `${xpProgress}%`;
        document.getElementById('xp-text').textContent = `XP: ${this.playerProfile.xp}/${xpRequired}`;
    }

    // === NOTIFICACIONES ===

    setupNotificationSystem() {
        this.notificationContainer = document.createElement('div');
        this.notificationContainer.id = 'game-notifications';
        this.notificationContainer.className = 'game-notifications';
        document.body.appendChild(this.notificationContainer);
    }

    showNotification(message, type = 'info', source = '') {
        const notification = document.createElement('div');
        notification.className = `game-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-icon">${this.getNotificationIcon(type)}</div>
            <div class="notification-content">
                <div class="notification-message">${message}</div>
                ${source ? `<div class="notification-source">${source}</div>` : ''}
            </div>
        `;

        this.notificationContainer.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    showLevelUpNotification(newLevel) {
        this.showNotification(`¡Nivel ${newLevel} alcanzado!`, 'level_up');
    }

    showAchievementNotification(achievement) {
        this.showNotification(`Logro desbloqueado: ${achievement.name}`, 'achievement');
    }

    getNotificationIcon(type) {
        const icons = {
            xp: '⭐',
            coins: '🪙',
            achievement: '🏆',
            level_up: '🎉',
            quest: '📋',
            powerup: '⚡',
            competition: '🏁',
            special: '✨'
        };
        return icons[type] || 'ℹ️';
    }

    // === PERSISTENCIA ===

    async loadPlayerProfile() {
        const saved = localStorage.getItem('player_gamification_profile');
        if (saved) {
            try {
                const savedProfile = JSON.parse(saved);
                this.playerProfile = { ...this.playerProfile, ...savedProfile };
            } catch (error) {
                console.warn('Error loading player profile:', error);
            }
        }
    }

    savePlayerProfile() {
        localStorage.setItem('player_gamification_profile', JSON.stringify(this.playerProfile));
    }

    saveQuests() {
        localStorage.setItem('game_quests', JSON.stringify(this.gameElements.quests));
    }

    loadSavedQuests() {
        const saved = localStorage.getItem('game_quests');
        if (saved) {
            try {
                this.gameElements.quests = JSON.parse(saved);
            } catch (error) {
                console.warn('Error loading quests:', error);
            }
        }
    }

    // === UTILIDADES ===

    recordStatistic(stat, value) {
        if (!this.statistics[stat]) {
            this.statistics[stat] = 0;
        }
        this.statistics[stat] += value;
    }

    findCompetitionById(competitionId) {
        for (const category of Object.values(this.competitions)) {
            const competition = category.find(c => c.id === competitionId);
            if (competition) return competition;
        }
        return null;
    }

    checkCompetitionEligibility(competition) {
        // Verificar nivel mínimo, etc.
        return this.playerProfile.level >= (competition.minLevel || 1);
    }

    toggleGameInterface() {
        const gameInterface = document.getElementById('gamification-interface');
        if (gameInterface.classList.contains('hidden')) {
            gameInterface.classList.remove('hidden');
            this.populateGameInterface();
        } else {
            gameInterface.classList.add('hidden');
        }
    }

    // === AUTO-SAVE ===

    startProgressTracking() {
        // Auto-guardar cada 30 segundos
        setInterval(() => {
            this.savePlayerProfile();
        }, 30000);

        // Limpiar efectos expirados cada minuto
        setInterval(() => {
            this.cleanupExpiredEffects();
        }, 60000);
    }

    cleanupExpiredEffects() {
        const now = Date.now();
        this.activeEffects = this.activeEffects.filter(effect =>
            effect.active && now < effect.expiresAt
        );
    }

    // === API PÚBLICA ===

    getPlayerStats() {
        return {
            level: this.playerProfile.level,
            xp: this.playerProfile.xp,
            coins: this.playerProfile.iaCoins,
            achievements: this.playerProfile.achievements.length,
            badges: this.playerProfile.badges.length,
            stats: this.playerProfile.stats
        };
    }

    getCurrentQuests() {
        return this.gameElements.quests.daily.filter(q => !q.completed);
    }

    getActiveEffects() {
        return this.activeEffects.filter(e => e.active && Date.now() < e.expiresAt);
    }

    populateDailyQuests() {
        console.log('🎯 Cargando misiones diarias...');
        const questsContainer = document.querySelector('.daily-quests-content');
        if (!questsContainer) return;

        const dailyQuests = [
            {
                id: 'daily_login',
                title: 'Conexión Diaria',
                description: 'Inicia sesión en la plataforma',
                progress: 1,
                total: 1,
                reward: { xp: 50, coins: 10 },
                completed: true
            },
            {
                id: 'complete_lesson',
                title: 'Lección Completada',
                description: 'Completa una lección de cualquier materia',
                progress: 0,
                total: 1,
                reward: { xp: 100, coins: 25 }
            },
            {
                id: 'use_ai_tool',
                title: 'Explorador IA',
                description: 'Usa una herramienta de IA',
                progress: 0,
                total: 3,
                reward: { xp: 150, coins: 30 }
            }
        ];

        questsContainer.innerHTML = dailyQuests.map(quest => `
            <div class="quest-item ${quest.completed ? 'completed' : ''}">
                <div class="quest-info">
                    <h5>${quest.title}</h5>
                    <p>${quest.description}</p>
                    <div class="quest-progress">
                        <div class="progress">
                            <div class="progress-bar" style="width: ${(quest.progress / quest.total) * 100}%"></div>
                        </div>
                        <span>${quest.progress}/${quest.total}</span>
                    </div>
                </div>
                <div class="quest-reward">
                    <span class="xp-reward">+${quest.reward.xp} XP</span>
                    <span class="coin-reward">+${quest.reward.coins} 🪙</span>
                </div>
            </div>
        `).join('');
    }

    getUserStats() {
        return {
            totalXP: this.playerProfile.xp,
            level: this.playerProfile.level,
            coins: this.playerProfile.coins,
            completedQuests: (this.playerProfile.dailyQuests || []).filter(q => q.completed).length,
            achievements: (this.playerProfile.achievements || []).length,
            timeSpent: this.playerProfile.timeSpent || 0,
            lastActive: this.playerProfile.lastActive || new Date().toISOString()
        };
    }

    updateStreaks() {
        if (!this.playerProfile.streaks) {
            this.playerProfile.streaks = {};
        }

        const now = new Date();
        const today = now.toDateString();

        // Actualizar cada tipo de racha
        this.streakSystem.types.forEach(streakType => {
            if (!this.playerProfile.streaks[streakType]) {
                this.playerProfile.streaks[streakType] = {
                    current: 0,
                    longest: 0,
                    lastUpdate: null,
                    lastActivity: null
                };
            }

            const streak = this.playerProfile.streaks[streakType];

            // Si no hay actividad reciente, revisar si la racha se debe romper
            if (streak.lastActivity) {
                const lastActivityDate = new Date(streak.lastActivity);
                const daysSinceLastActivity = Math.floor((now - lastActivityDate) / (1000 * 60 * 60 * 24));

                // Romper racha si han pasado más de 2 días sin actividad
                if (daysSinceLastActivity > 2) {
                    streak.current = 0;
                    console.log(`⚠️ Racha de ${streakType.replace('_', ' ')} perdida por inactividad`);
                }
            }

            // Actualizar racha más larga si es necesario
            if (streak.current > streak.longest) {
                streak.longest = streak.current;
            }

            streak.lastUpdate = now.toISOString();
        });

        // Guardar cambios
        this.saveGameData();

        console.log('📊 Rachas actualizadas:', this.playerProfile.streaks);
    }

    checkPendingAchievements() {
        console.log('🏆 Verificando logros pendientes...');

        // Simular verificación de logros basados en el progreso del usuario
        const userStats = this.getUserStats();
        const pendingAchievements = [];

        // Verificar logros por XP
        if (userStats.totalXP >= 1000 && !this.hasAchievement('xp_1000')) {
            pendingAchievements.push({
                id: 'xp_1000',
                title: 'Explorador Dedicado',
                description: 'Alcanza 1000 XP',
                icon: '🌟',
                reward: { coins: 100 }
            });
        }

        // Verificar logros por tiempo en plataforma
        if (userStats.daysActive >= 7 && !this.hasAchievement('week_streak')) {
            pendingAchievements.push({
                id: 'week_streak',
                title: 'Racha Semanal',
                description: 'Usa la plataforma 7 días seguidos',
                icon: '🔥',
                reward: { coins: 50 }
            });
        }

        // Otorgar logros pendientes
        pendingAchievements.forEach(achievement => {
            this.awardAchievement(achievement);
        });

        return pendingAchievements.length;
    }

    hasAchievement(achievementId) {
        const userProgress = JSON.parse(localStorage.getItem('bge_achievements') || '[]');
        return userProgress.includes(achievementId);
    }

    awardAchievement(achievement) {
        console.log(`🎉 ¡Nuevo logro desbloqueado: ${achievement.title}!`);

        // Guardar logro
        const achievements = JSON.parse(localStorage.getItem('bge_achievements') || '[]');
        if (!achievements.includes(achievement.id)) {
            achievements.push(achievement.id);
            localStorage.setItem('bge_achievements', JSON.stringify(achievements));
        }

        // Mostrar notificación
        this.showAchievementNotification(achievement);

        // Otorgar recompensa
        if (achievement.reward && achievement.reward.coins) {
            this.addCoins(achievement.reward.coins);
        }
    }

    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-content">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-text">
                    <h4>¡Logro Desbloqueado!</h4>
                    <h5>${achievement.title}</h5>
                    <p>${achievement.description}</p>
                </div>
            </div>
        `;

        // Agregar estilos dinámicos - Reubicado para evitar conflictos con otros botones
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 90px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 9999;
            max-width: 300px;
            animation: slideIn 0.5s ease-out;
        `;

        document.body.appendChild(notification);

        // Remover después de 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.5s ease-in';
                setTimeout(() => notification.remove(), 500);
            }
        }, 5000);
    }

    /**
     * Guarda los datos del juego en localStorage
     */
    saveGameData() {
        try {
            const gameData = {
                playerProfile: this.playerProfile,
                timestamp: Date.now()
            };

            const userSession = JSON.parse(localStorage.getItem('userSession') || '{}');
            if (userSession.email) {
                localStorage.setItem(`bge_game_data_${userSession.email}`, JSON.stringify(gameData));
                console.log('💾 Datos del juego guardados correctamente');
            } else {
                // Fallback para usuarios sin sesión
                localStorage.setItem('bge_game_data_guest', JSON.stringify(gameData));
                console.log('💾 Datos del juego guardados para usuario invitado');
            }
        } catch (error) {
            console.error('❌ Error guardando datos del juego:', error);
        }
    }

    /**
     * Carga los datos del juego desde localStorage
     */
    loadGameData() {
        try {
            const userSession = JSON.parse(localStorage.getItem('userSession') || '{}');
            const key = userSession.email ? `bge_game_data_${userSession.email}` : 'bge_game_data_guest';

            const saved = localStorage.getItem(key);
            if (saved) {
                const gameData = JSON.parse(saved);
                if (gameData.playerProfile) {
                    this.playerProfile = { ...this.playerProfile, ...gameData.playerProfile };
                    console.log('📥 Datos del juego cargados correctamente');
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('❌ Error cargando datos del juego:', error);
            return false;
        }
    }
}

// CSS para gamificación
const gameStyles = document.createElement('style');
gameStyles.textContent = `
    .game-activation {
        position: fixed;
        bottom: 30px;
        right: 160px;
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ffcc02 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(255, 107, 53, 0.5), 0 0 30px rgba(247, 147, 30, 0.3);
        transition: all 0.3s ease;
        z-index: 9994;
        position: relative;
    }

    .game-activation:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 30px rgba(102, 126, 234, 0.6);
    }

    .game-icon {
        font-size: 24px;
        color: white;
    }

    .level-badge {
        position: absolute;
        top: -8px;
        right: -8px;
        background: #ff4757;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        font-size: 10px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
    }

    .game-notifications {
        position: fixed;
        top: 20px;
        left: 90px;
        z-index: 9998;
        pointer-events: none;
    }

    .game-notification {
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 200px;
        animation: slideInRight 0.3s ease;
        pointer-events: all;
    }

    .game-notification.achievement {
        background: linear-gradient(135deg, #f39c12, #e67e22);
    }

    .game-notification.level_up {
        background: linear-gradient(135deg, #9b59b6, #8e44ad);
    }

    .game-notification.xp {
        background: linear-gradient(135deg, #3498db, #2980b9);
    }

    .game-notification.fade-out {
        animation: slideOutRight 0.3s ease;
    }

    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    .gamification-interface {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        z-index: 9997;
        display: flex;
        flex-direction: column;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .gamification-interface.hidden {
        display: none;
    }

    .game-header {
        background: rgba(0, 0, 0, 0.2);
        padding: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .close-game {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 18px;
    }

    .game-content {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
    }

    .player-profile {
        margin-bottom: 20px;
    }

    .profile-card {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 20px;
        backdrop-filter: blur(10px);
    }

    .player-avatar {
        width: 60px;
        height: 60px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
    }

    .player-info {
        flex: 1;
    }

    .level-info {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 8px 0;
    }

    .xp-bar {
        flex: 1;
        height: 8px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        overflow: hidden;
    }

    .xp-fill {
        height: 100%;
        background: linear-gradient(90deg, #00d2ff, #3a47d5);
        transition: width 0.3s ease;
    }

    .game-tabs {
        display: flex;
        gap: 4px;
        margin-bottom: 20px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 8px;
        padding: 4px;
    }

    .game-tab {
        background: transparent;
        border: none;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s ease;
        flex: 1;
        text-align: center;
    }

    .game-tab.active,
    .game-tab:hover {
        background: rgba(255, 255, 255, 0.2);
    }

    .tab-panel {
        display: none;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 20px;
        backdrop-filter: blur(10px);
    }

    .tab-panel.active {
        display: block;
    }

    @media (max-width: 768px) {
        .game-content {
            padding: 10px;
        }

        .profile-card {
            flex-direction: column;
            text-align: center;
        }

        .game-tabs {
            flex-wrap: wrap;
        }

        .game-tab {
            flex: 1 1 50%;
        }
    }
`;
document.head.appendChild(gameStyles);

// Inicialización automática
document.addEventListener('DOMContentLoaded', () => {
    window.advancedGamificationSystem = new AdvancedGamificationSystem();
});

// Exponer globalmente
window.AdvancedGamificationSystem = AdvancedGamificationSystem;