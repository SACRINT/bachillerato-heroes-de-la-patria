/**
 * 🏆 SISTEMA DE COMPETENCIAS BGE
 * Competencias académicas gamificadas entre estudiantes
 */

class CompetitionsSystem {
    constructor() {
        this.currentUser = null;
        this.activeCompetitions = [];
        this.userStats = {};
        this.leaderboards = {};
        this.competitionTypes = this.initializeCompetitionTypes();
        this.init();
    }

    init() {
        this.loadUserSession();
        this.loadUserStats();
        this.loadActiveCompetitions();
        this.generateWeeklyCompetitions();
        this.setupCompetitionUI();
    }

    loadUserSession() {
        const savedUser = localStorage.getItem('bge_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        }
    }

    loadUserStats() {
        if (!this.currentUser) return;

        const saved = localStorage.getItem(`bge_competitions_${this.currentUser.email}`);
        if (saved) {
            this.userStats = JSON.parse(saved);
        } else {
            this.userStats = {
                competitionsWon: 0,
                competitionsParticipated: 0,
                totalPoints: 0,
                achievements: [],
                winStreak: 0,
                favoriteSubject: null,
                rank: 'Novato'
            };
        }
    }

    loadActiveCompetitions() {
        const saved = localStorage.getItem('bge_active_competitions');
        if (saved) {
            this.activeCompetitions = JSON.parse(saved);
        } else {
            this.generateInitialCompetitions();
        }
    }

    initializeCompetitionTypes() {
        return {
            daily: {
                name: 'Desafío Diario',
                duration: 24 * 60 * 60 * 1000, // 24 horas
                maxParticipants: 50,
                rewards: { coins: 25, xp: 100 }
            },
            weekly: {
                name: 'Competencia Semanal',
                duration: 7 * 24 * 60 * 60 * 1000, // 7 días
                maxParticipants: 100,
                rewards: { coins: 100, xp: 500 }
            },
            monthly: {
                name: 'Torneo Mensual',
                duration: 30 * 24 * 60 * 60 * 1000, // 30 días
                maxParticipants: 200,
                rewards: { coins: 500, xp: 2000 }
            },
            special: {
                name: 'Evento Especial',
                duration: 3 * 24 * 60 * 60 * 1000, // 3 días
                maxParticipants: 150,
                rewards: { coins: 250, xp: 1000 }
            }
        };
    }

    generateInitialCompetitions() {
        this.activeCompetitions = [
            this.createCompetition('daily', 'mathematics', 'Resuelve 10 problemas de álgebra'),
            this.createCompetition('weekly', 'physics', 'Domina las leyes de Newton'),
            this.createCompetition('daily', 'chemistry', 'Balancea 5 ecuaciones químicas'),
            this.createCompetition('special', 'general', 'Semana de la Ciencia BGE')
        ];

        this.saveActiveCompetitions();
    }

    createCompetition(type, subject, challenge) {
        const competitionType = this.competitionTypes[type];
        const startTime = Date.now();
        const endTime = startTime + competitionType.duration;

        return {
            id: this.generateCompetitionId(),
            type,
            subject,
            title: this.getCompetitionTitle(subject, type),
            description: challenge,
            startTime,
            endTime,
            maxParticipants: competitionType.maxParticipants,
            participants: this.generateMockParticipants(),
            leaderboard: this.generateMockLeaderboard(),
            rewards: competitionType.rewards,
            status: 'active',
            requirements: this.getCompetitionRequirements(subject)
        };
    }

    getCompetitionTitle(subject, type) {
        const titles = {
            mathematics: {
                daily: '🧮 Desafío Matemático Diario',
                weekly: '📐 Semana de las Matemáticas',
                monthly: '🏆 Olimpiada Matemática BGE',
                special: '⚡ Sprint Matemático'
            },
            physics: {
                daily: '⚛️ Física en Acción',
                weekly: '🌌 Semana de la Física',
                monthly: '🚀 Copa de Física BGE',
                special: '💫 Desafío Espacial'
            },
            chemistry: {
                daily: '🧪 Laboratorio Virtual',
                weekly: '⚗️ Semana Química',
                monthly: '🔬 Premio Nobel Junior',
                special: '💎 Cristales y Moléculas'
            },
            biology: {
                daily: '🧬 Vida Microscópica',
                weekly: '🌱 BioSemana',
                monthly: '🦋 Ecosistema BGE',
                special: '🔬 ADN Challenge'
            },
            general: {
                daily: '🎯 Trivia BGE',
                weekly: '📚 Semana del Conocimiento',
                monthly: '🏆 Gran Premio BGE',
                special: '✨ Evento Especial BGE'
            }
        };

        return titles[subject]?.[type] || '🏆 Competencia BGE';
    }

    getCompetitionRequirements(subject) {
        const requirements = {
            mathematics: ['Completar 10 ejercicios', 'Tiempo límite: 30 min', 'Precisión mínima: 80%'],
            physics: ['Resolver 8 problemas', 'Incluir diagramas', 'Explicar procedimiento'],
            chemistry: ['Balancear 5 ecuaciones', 'Identificar reactivos', 'Calcular moles'],
            biology: ['Clasificar 15 especies', 'Describir procesos', 'Mapas conceptuales'],
            general: ['20 preguntas mixtas', 'Todas las materias', 'Tiempo límite: 45 min']
        };

        return requirements[subject] || ['Completar desafío', 'Seguir instrucciones'];
    }

    generateMockParticipants() {
        const names = [
            'Ana García', 'Luis Hernández', 'María López', 'Carlos Ruiz', 'Sofia Martín',
            'Diego Torres', 'Valeria Sánchez', 'Andrés Morales', 'Isabella Cruz', 'Sebastián Jiménez',
            'Camila Herrera', 'Mateo Vargas', 'Lucía Mendoza', 'Gabriel Rojas', 'Valentina Castro'
        ];

        const participants = [];
        const numParticipants = Math.floor(Math.random() * 15) + 8; // 8-22 participantes

        for (let i = 0; i < numParticipants; i++) {
            participants.push({
                name: names[Math.floor(Math.random() * names.length)],
                score: Math.floor(Math.random() * 1000) + 100,
                completedAt: Date.now() - Math.random() * 24 * 60 * 60 * 1000,
                level: Math.floor(Math.random() * 10) + 1
            });
        }

        return participants.sort((a, b) => b.score - a.score);
    }

    generateMockLeaderboard() {
        return this.generateMockParticipants().slice(0, 10);
    }

    generateWeeklyCompetitions() {
        const now = Date.now();
        const oneWeek = 7 * 24 * 60 * 60 * 1000;

        // Verificar si necesitamos generar nuevas competencias
        const hasActiveWeekly = this.activeCompetitions.some(comp =>
            comp.type === 'weekly' && comp.endTime > now
        );

        if (!hasActiveWeekly) {
            const subjects = ['mathematics', 'physics', 'chemistry', 'biology'];
            const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];

            const newCompetition = this.createCompetition('weekly', randomSubject,
                this.generateRandomChallenge(randomSubject));

            this.activeCompetitions.push(newCompetition);
            this.saveActiveCompetitions();
        }
    }

    generateRandomChallenge(subject) {
        const challenges = {
            mathematics: [
                'Resuelve 15 ecuaciones cuadráticas',
                'Domina las funciones trigonométricas',
                'Calcula límites y derivadas',
                'Resuelve sistemas de ecuaciones'
            ],
            physics: [
                'Aplica las leyes de la termodinámica',
                'Calcula velocidades y aceleraciones',
                'Resuelve circuitos eléctricos',
                'Domina el movimiento circular'
            ],
            chemistry: [
                'Balancea 20 ecuaciones complejas',
                'Calcula concentraciones molares',
                'Identifica grupos funcionales',
                'Predice productos de reacción'
            ],
            biology: [
                'Clasifica 30 organismos',
                'Explica procesos metabólicos',
                'Analiza cadenas alimentarias',
                'Describe ciclos biogeoquímicos'
            ]
        };

        const subjectChallenges = challenges[subject] || challenges.mathematics;
        return subjectChallenges[Math.floor(Math.random() * subjectChallenges.length)];
    }

    setupCompetitionUI() {
        // Crear badge de competencias activas si hay usuario logueado
        if (this.currentUser) {
            this.createCompetitionBadge();
        }
    }

    createCompetitionBadge() {
        const activeCount = this.activeCompetitions.filter(comp =>
            comp.status === 'active' && comp.endTime > Date.now()
        ).length;

        if (activeCount === 0) return;

        const badge = document.createElement('div');
        badge.id = 'competitionBadge';
        badge.className = 'position-fixed';
        badge.style.cssText = `
            top: 100px;
            left: 20px;
            z-index: 1000;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            color: white;
            padding: 10px 15px;
            border-radius: 25px;
            cursor: pointer;
            box-shadow: 0 8px 25px rgba(255, 107, 107, 0.3);
            transition: all 0.3s ease;
            animation: bounceIn 0.5s ease;
        `;

        badge.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-trophy me-2"></i>
                <div>
                    <small class="d-block" style="font-size: 0.75rem; opacity: 0.9;">Competencias Activas</small>
                    <strong>${activeCount} disponibles</strong>
                </div>
            </div>
        `;

        badge.onclick = () => this.showCompetitionsModal();

        badge.onmouseenter = () => {
            badge.style.transform = 'scale(1.05) translateY(-2px)';
        };

        badge.onmouseleave = () => {
            badge.style.transform = 'scale(1) translateY(0)';
        };

        document.body.appendChild(badge);

        // Auto-ocultar después de 10 segundos
        setTimeout(() => {
            if (badge.parentNode) {
                badge.style.animation = 'fadeOut 0.5s ease';
                setTimeout(() => badge.remove(), 500);
            }
        }, 10000);
    }

    showCompetitionsModal() {
        if (!this.currentUser) {
            alert('🔒 Debes iniciar sesión para participar en competencias.');
            return;
        }

        this.createCompetitionsModal();
    }

    createCompetitionsModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'competitionsModal';
        modal.setAttribute('tabindex', '-1');

        modal.innerHTML = `
            <div class="modal-dialog modal-xl">
                <div class="modal-content" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px;">
                    <div class="modal-header border-0 text-white">
                        <h5 class="modal-title fw-bold">🏆 Competencias BGE - ${this.currentUser.name}</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-white" style="max-height: 70vh; overflow-y: auto;">
                        ${this.generateCompetitionsContent()}
                    </div>
                </div>
            </div>
        `;

        // Remover modal existente
        const existing = document.getElementById('competitionsModal');
        if (existing) existing.remove();

        document.body.appendChild(modal);
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }

    generateCompetitionsContent() {
        const activeComps = this.activeCompetitions.filter(comp =>
            comp.status === 'active' && comp.endTime > Date.now()
        );

        return `
            <div class="container-fluid">
                <!-- Header stats -->
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="text-center">
                            <h3 class="mb-1">${this.userStats.competitionsWon}</h3>
                            <small class="opacity-75">Competencias Ganadas</small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="text-center">
                            <h3 class="mb-1">${this.userStats.totalPoints}</h3>
                            <small class="opacity-75">Puntos Totales</small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="text-center">
                            <h3 class="mb-1">${this.userStats.winStreak}</h3>
                            <small class="opacity-75">Racha Actual</small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="text-center">
                            <h3 class="mb-1">${this.userStats.rank}</h3>
                            <small class="opacity-75">Rango</small>
                        </div>
                    </div>
                </div>

                <!-- Competencias activas -->
                <div class="row">
                    <div class="col-12">
                        <h6 class="mb-3">🔥 Competencias Activas</h6>
                    </div>
                    ${activeComps.map(comp => this.generateCompetitionCard(comp)).join('')}
                </div>

                <!-- Leaderboard global -->
                <div class="row mt-4">
                    <div class="col-12">
                        <h6 class="mb-3">📊 Leaderboard Global BGE</h6>
                        <div class="card bg-white bg-opacity-10 border-0">
                            <div class="card-body">
                                ${this.generateGlobalLeaderboard()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generateCompetitionCard(competition) {
        const timeRemaining = this.getTimeRemaining(competition.endTime);
        const participantCount = competition.participants.length;
        const userPosition = this.getUserPosition(competition);

        return `
            <div class="col-lg-6 col-xl-4 mb-3">
                <div class="card bg-white bg-opacity-15 border-0 h-100" style="backdrop-filter: blur(10px);">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="card-title text-warning mb-0">${competition.title}</h6>
                            <span class="badge bg-${this.getCompetitionBadgeColor(competition.type)}">${competition.type}</span>
                        </div>

                        <p class="card-text small mb-3">${competition.description}</p>

                        <div class="mb-3">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <small>Participantes</small>
                                <small>${participantCount}/${competition.maxParticipants}</small>
                            </div>
                            <div class="progress" style="height: 6px;">
                                <div class="progress-bar bg-warning" style="width: ${(participantCount/competition.maxParticipants)*100}%"></div>
                            </div>
                        </div>

                        <div class="mb-3">
                            <small class="d-block mb-1">⏰ Tiempo restante: ${timeRemaining}</small>
                            <small class="d-block mb-1">💰 Premio: ${competition.rewards.coins} coins + ${competition.rewards.xp} XP</small>
                            ${userPosition ? `<small class="d-block text-warning">📍 Tu posición: #${userPosition}</small>` : ''}
                        </div>

                        <div class="requirements mb-3">
                            <small class="d-block mb-1 opacity-75">Requisitos:</small>
                            ${competition.requirements.map(req => `<small class="d-block opacity-75">• ${req}</small>`).join('')}
                        </div>

                        <div class="d-flex gap-2">
                            <button class="btn btn-warning btn-sm flex-grow-1" onclick="competitionsSystem.joinCompetition('${competition.id}')">
                                ${userPosition ? '📊 Ver Progreso' : '🚀 Participar'}
                            </button>
                            <button class="btn btn-outline-light btn-sm" onclick="competitionsSystem.viewLeaderboard('${competition.id}')">
                                🏆 Ranking
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getCompetitionBadgeColor(type) {
        const colors = {
            daily: 'primary',
            weekly: 'success',
            monthly: 'danger',
            special: 'warning'
        };
        return colors[type] || 'secondary';
    }

    getTimeRemaining(endTime) {
        const remaining = endTime - Date.now();
        if (remaining <= 0) return 'Finalizada';

        const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
        const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    }

    getUserPosition(competition) {
        if (!this.currentUser) return null;

        const userParticipant = competition.participants.find(p =>
            p.name === this.currentUser.name
        );

        return userParticipant ?
            competition.participants.indexOf(userParticipant) + 1 : null;
    }

    generateGlobalLeaderboard() {
        const globalLeaders = [
            { name: 'Ana García', points: 2850, competitions: 12, rank: '🥇 Campeona' },
            { name: 'Luis Hernández', points: 2720, competitions: 11, rank: '🥈 Experto' },
            { name: 'María López', points: 2640, competitions: 10, rank: '🥉 Avanzado' },
            { name: 'Carlos Ruiz', points: 2480, competitions: 9, rank: '🏆 Competidor' },
            { name: 'Sofia Martín', points: 2350, competitions: 8, rank: '⭐ Especialista' }
        ];

        return `
            <div class="table-responsive">
                <table class="table table-sm text-white">
                    <thead>
                        <tr class="opacity-75">
                            <th>Posición</th>
                            <th>Estudiante</th>
                            <th>Puntos</th>
                            <th>Competencias</th>
                            <th>Rango</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${globalLeaders.map((leader, index) => `
                            <tr>
                                <td>
                                    <span class="badge bg-warning rounded-pill">${index + 1}</span>
                                </td>
                                <td class="fw-bold">${leader.name}</td>
                                <td>${leader.points.toLocaleString()}</td>
                                <td>${leader.competitions}</td>
                                <td><small>${leader.rank}</small></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    joinCompetition(competitionId) {
        const competition = this.activeCompetitions.find(c => c.id === competitionId);
        if (!competition) return;

        // Verificar si ya está participando
        const alreadyParticipating = competition.participants.some(p =>
            p.name === this.currentUser.name
        );

        if (alreadyParticipating) {
            this.showCompetitionProgress(competition);
        } else {
            this.startCompetition(competition);
        }
    }

    startCompetition(competition) {
        // Agregar usuario a participantes
        const newParticipant = {
            name: this.currentUser.name,
            score: 0,
            completedAt: null,
            level: this.getUserLevel(),
            startedAt: Date.now()
        };

        competition.participants.push(newParticipant);
        this.saveActiveCompetitions();

        // Mostrar modal de inicio
        this.showCompetitionStart(competition);

        // Tracking
        if (window.analyticsSystem) {
            window.analyticsSystem.trackEvent('competition_joined', {
                competitionId: competition.id,
                competitionType: competition.type,
                subject: competition.subject
            });
        }

        // Notificación
        if (window.pushNotificationSystem) {
            window.pushNotificationSystem.sendCompetitionNotification(competition);
        }
    }

    showCompetitionStart(competition) {
        alert(`🚀 ¡Te has unido a "${competition.title}"!\n\n` +
              `📋 Descripción: ${competition.description}\n` +
              `⏰ Tiempo límite: ${this.getTimeRemaining(competition.endTime)}\n` +
              `💰 Premios: ${competition.rewards.coins} coins + ${competition.rewards.xp} XP\n\n` +
              `¡Buena suerte! Usa la IA de BGE para estudiar y obtener la mejor puntuación.`);
    }

    showCompetitionProgress(competition) {
        const userParticipant = competition.participants.find(p =>
            p.name === this.currentUser.name
        );

        if (!userParticipant) return;

        const position = competition.participants.indexOf(userParticipant) + 1;
        const timeSpent = Date.now() - userParticipant.startedAt;
        const timeSpentFormatted = this.formatDuration(timeSpent);

        alert(`📊 Tu progreso en "${competition.title}":\n\n` +
              `🏆 Posición actual: #${position} de ${competition.participants.length}\n` +
              `📈 Puntuación: ${userParticipant.score} puntos\n` +
              `⏱️ Tiempo dedicado: ${timeSpentFormatted}\n` +
              `⏰ Tiempo restante: ${this.getTimeRemaining(competition.endTime)}\n\n` +
              `¡Sigue participando para mejorar tu posición!`);
    }

    viewLeaderboard(competitionId) {
        const competition = this.activeCompetitions.find(c => c.id === competitionId);
        if (!competition) return;

        const leaderboardHTML = competition.participants
            .sort((a, b) => b.score - a.score)
            .slice(0, 10)
            .map((participant, index) =>
                `${index + 1}. ${participant.name} - ${participant.score} pts`
            ).join('\n');

        alert(`🏆 Leaderboard: ${competition.title}\n\n${leaderboardHTML}`);
    }

    formatDuration(ms) {
        const minutes = Math.floor(ms / 60000);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        }
        return `${minutes}m`;
    }

    getUserLevel() {
        if (!this.currentUser) return 1;

        const progress = localStorage.getItem(`bge_progress_${this.currentUser.email}`);
        return progress ? JSON.parse(progress).level || 1 : 1;
    }

    generateCompetitionId() {
        return 'comp_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    saveActiveCompetitions() {
        localStorage.setItem('bge_active_competitions', JSON.stringify(this.activeCompetitions));
    }

    saveUserStats() {
        if (!this.currentUser) return;

        localStorage.setItem(
            `bge_competitions_${this.currentUser.email}`,
            JSON.stringify(this.userStats)
        );
    }

    // Simulación de finalización de competencia (para testing)
    simulateCompetitionComplete(competitionId) {
        const competition = this.activeCompetitions.find(c => c.id === competitionId);
        if (!competition) return;

        const userParticipant = competition.participants.find(p =>
            p.name === this.currentUser.name
        );

        if (userParticipant) {
            // Simular puntuación final
            userParticipant.score = Math.floor(Math.random() * 800) + 200;
            userParticipant.completedAt = Date.now();

            // Actualizar estadísticas del usuario
            this.userStats.competitionsParticipated++;
            this.userStats.totalPoints += userParticipant.score;

            // Verificar si ganó
            const finalPosition = competition.participants
                .sort((a, b) => b.score - a.score)
                .indexOf(userParticipant) + 1;

            if (finalPosition <= 3) {
                this.userStats.competitionsWon++;
                this.userStats.winStreak++;

                // Otorgar premios
                this.awardCompetitionPrizes(competition, finalPosition);
            } else {
                this.userStats.winStreak = 0;
            }

            this.updateUserRank();
            this.saveUserStats();
            this.saveActiveCompetitions();

            alert(`🎉 ¡Competencia completada!\n\n` +
                  `🏆 Posición final: #${finalPosition}\n` +
                  `📈 Puntuación: ${userParticipant.score}\n` +
                  `💰 Premios obtenidos: ${competition.rewards.coins} coins + ${competition.rewards.xp} XP`);
        }
    }

    awardCompetitionPrizes(competition, position) {
        if (!this.currentUser) return;

        const progressKey = `bge_progress_${this.currentUser.email}`;
        const currentProgress = JSON.parse(localStorage.getItem(progressKey) || '{}');

        // Multiplicador por posición
        const multiplier = position === 1 ? 2 : position === 2 ? 1.5 : 1.2;

        const coinsReward = Math.floor(competition.rewards.coins * multiplier);
        const xpReward = Math.floor(competition.rewards.xp * multiplier);

        currentProgress.coins = (currentProgress.coins || 0) + coinsReward;
        currentProgress.xp = (currentProgress.xp || 0) + xpReward;
        currentProgress.level = Math.floor(currentProgress.xp / 500) + 1;

        localStorage.setItem(progressKey, JSON.stringify(currentProgress));

        // Desbloquear achievement si es primera victoria
        if (this.userStats.competitionsWon === 1 && window.achievementSystem) {
            window.achievementSystem.checkAndUnlockAchievement('first_competition_win');
        }
    }

    updateUserRank() {
        const ranks = [
            { min: 0, max: 499, name: 'Novato', icon: '🌱' },
            { min: 500, max: 1499, name: 'Competidor', icon: '⚡' },
            { min: 1500, max: 2999, name: 'Especialista', icon: '⭐' },
            { min: 3000, max: 4999, name: 'Experto', icon: '🥈' },
            { min: 5000, max: Infinity, name: 'Campeón', icon: '🥇' }
        ];

        const currentRank = ranks.find(rank =>
            this.userStats.totalPoints >= rank.min && this.userStats.totalPoints <= rank.max
        );

        this.userStats.rank = currentRank ? currentRank.name : 'Novato';
    }

    // Función para limpiar competencias expiradas
    cleanupExpiredCompetitions() {
        const now = Date.now();
        this.activeCompetitions = this.activeCompetitions.filter(comp =>
            comp.endTime > now
        );
        this.saveActiveCompetitions();
    }
}

// Funciones globales
function openCompetitions() {
    if (window.competitionsSystem) {
        window.competitionsSystem.showCompetitionsModal();
    }
}

function simulateCompetitionWin() {
    if (window.competitionsSystem && window.competitionsSystem.activeCompetitions.length > 0) {
        const firstCompetition = window.competitionsSystem.activeCompetitions[0];
        window.competitionsSystem.simulateCompetitionComplete(firstCompetition.id);
    }
}

// Inicializar sistema de competencias
document.addEventListener('DOMContentLoaded', function() {
    window.competitionsSystem = new CompetitionsSystem();

    // Cleanup de competencias expiradas cada hora
    setInterval(() => {
        if (window.competitionsSystem) {
            window.competitionsSystem.cleanupExpiredCompetitions();
        }
    }, 60 * 60 * 1000);
});