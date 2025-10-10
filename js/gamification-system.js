/**
 * 🎮 SISTEMA DE GAMIFICACIÓN BGE
 * Sistema completo de logros, puntuaciones y mecánicas educativas
 * Versión 2.0 - Integración con backend real
 */

class GamificationSystem {
    constructor() {
        this.apiBase = '/api/gamification';
        this.currentUser = null;
        this.userProfile = null;
        this.achievements = [];
        this.dailyChallenges = [];
        this.leaderboard = [];
        this.notifications = [];

        this.init();
    }

    async init() {
        console.log('🎮 [GAMIFICATION] Inicializando sistema de gamificación...');

        try {
            // Verificar autenticación
            const token = localStorage.getItem('authToken');
            const userData = localStorage.getItem('userData');

            if (!token || !userData) {
                console.log('ℹ️ [GAMIFICATION] Usuario no autenticado, modo limitado');
                return;
            }

            this.currentUser = JSON.parse(userData);
            await this.loadUserProfile();
            await this.loadDailyChallenges();
            this.createGamificationUI();
            this.setupEventListeners();
            this.startPeriodicUpdates();

            console.log('✅ [GAMIFICATION] Sistema inicializado correctamente');
        } catch (error) {
            console.error('❌ [GAMIFICATION] Error inicializando:', error);
        }
    }

    // ============================================
    // CARGA DE DATOS
    // ============================================

    async loadUserProfile() {
        try {
            const response = await this.apiCall(`/profile/${this.currentUser.id}`);
            if (response.success) {
                this.userProfile = response.data;
                this.updateProfileDisplay();
            }
        } catch (error) {
            console.error('❌ Error cargando perfil de gamificación:', error);
        }
    }

    async loadDailyChallenges() {
        try {
            const response = await this.apiCall('/daily-challenges');
            if (response.success) {
                this.dailyChallenges = response.data.challenges;
                this.updateChallengesDisplay();
            }
        } catch (error) {
            console.error('❌ Error cargando desafíos diarios:', error);
        }
    }

    async loadLeaderboard() {
        try {
            const response = await this.apiCall('/leaderboard?type=weekly&limit=10');
            if (response.success) {
                this.leaderboard = response.data.leaderboard;
                this.updateLeaderboardDisplay();
            }
        } catch (error) {
            console.error('❌ Error cargando leaderboard:', error);
        }
    }

    async loadAchievements() {
        try {
            const response = await this.apiCall('/achievements');
            if (response.success) {
                this.achievements = response.data.achievements;
                this.updateAchievementsDisplay();
            }
        } catch (error) {
            console.error('❌ Error cargando logros:', error);
        }
    }

    // ============================================
    // INTERFAZ DE USUARIO
    // ============================================

    createGamificationUI() {
        // Crear widget flotante de gamificación
        this.createFloatingWidget();

        // Crear modal principal de gamificación
        this.createMainModal();

        // Crear sistema de notificaciones
        this.createNotificationSystem();
    }

    createFloatingWidget() {
        const widget = document.createElement('div');
        widget.id = 'gamification-widget';
        widget.className = 'gamification-widget';
        widget.innerHTML = `
            <div class="widget-content" onclick="gamificationSystem.openMainModal()">
                <div class="level-display">
                    <span class="level-number">${this.userProfile?.level || 1}</span>
                    <span class="level-label">Nivel</span>
                </div>
                <div class="points-display">
                    <span class="points-number">${this.formatPoints(this.userProfile?.totalPoints || 0)}</span>
                    <span class="points-label">Puntos</span>
                </div>
                <div class="streak-display">
                    <i class="fas fa-fire"></i>
                    <span>${this.userProfile?.streak || 0}</span>
                </div>
            </div>
            <div class="widget-challenges">
                <div class="challenges-count">
                    ${this.dailyChallenges.filter(c => !c.completed).length} desafíos pendientes
                </div>
            </div>
        `;

        // Añadir estilos
        const styles = `
            <style>
                .gamification-widget {
                    position: fixed;
                    top: 50%;
                    right: 20px;
                    transform: translateY(-50%);
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 15px;
                    padding: 15px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                    cursor: pointer;
                    transition: all 0.3s ease;
                    z-index: 1000;
                    min-width: 120px;
                    text-align: center;
                }

                .gamification-widget:hover {
                    transform: translateY(-50%) scale(1.05);
                    box-shadow: 0 15px 40px rgba(0,0,0,0.3);
                }

                .widget-content {
                    margin-bottom: 10px;
                }

                .level-display, .points-display {
                    margin-bottom: 8px;
                }

                .level-number, .points-number {
                    display: block;
                    font-size: 1.4rem;
                    font-weight: bold;
                }

                .level-label, .points-label {
                    display: block;
                    font-size: 0.7rem;
                    opacity: 0.8;
                }

                .streak-display {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 5px;
                    font-size: 0.9rem;
                }

                .streak-display i {
                    color: #ff6b35;
                }

                .widget-challenges {
                    border-top: 1px solid rgba(255,255,255,0.2);
                    padding-top: 8px;
                }

                .challenges-count {
                    font-size: 0.75rem;
                    opacity: 0.9;
                }

                @media (max-width: 768px) {
                    .gamification-widget {
                        right: 10px;
                        font-size: 0.85rem;
                        padding: 10px;
                    }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
        document.body.appendChild(widget);
    }

    createMainModal() {
        const modal = document.createElement('div');
        modal.id = 'gamification-modal';
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header bg-gradient-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-trophy me-2"></i>Centro de Gamificación
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-0">
                        <!-- Navegación de pestañas -->
                        <ul class="nav nav-tabs" id="gamificationTabs" role="tablist">
                            <li class="nav-item" role="presentation">
                                <button class="nav-link active" id="profile-tab" data-bs-toggle="tab" data-bs-target="#profile-pane" role="tab">
                                    <i class="fas fa-user me-2"></i>Mi Perfil
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="challenges-tab" data-bs-toggle="tab" data-bs-target="#challenges-pane" role="tab">
                                    <i class="fas fa-target me-2"></i>Desafíos Diarios
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="achievements-tab" data-bs-toggle="tab" data-bs-target="#achievements-pane" role="tab">
                                    <i class="fas fa-medal me-2"></i>Logros
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="leaderboard-tab" data-bs-toggle="tab" data-bs-target="#leaderboard-pane" role="tab">
                                    <i class="fas fa-ranking-star me-2"></i>Clasificación
                                </button>
                            </li>
                        </ul>

                        <!-- Contenido de pestañas -->
                        <div class="tab-content p-4" id="gamificationTabContent">
                            <!-- Perfil -->
                            <div class="tab-pane fade show active" id="profile-pane" role="tabpanel">
                                <div id="profile-content">
                                    <div class="text-center mb-4">
                                        <div class="spinner-border text-primary" role="status">
                                            <span class="visually-hidden">Cargando...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Desafíos -->
                            <div class="tab-pane fade" id="challenges-pane" role="tabpanel">
                                <div id="challenges-content">
                                    <div class="text-center mb-4">
                                        <div class="spinner-border text-primary" role="status">
                                            <span class="visually-hidden">Cargando...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Logros -->
                            <div class="tab-pane fade" id="achievements-pane" role="tabpanel">
                                <div id="achievements-content">
                                    <div class="text-center mb-4">
                                        <div class="spinner-border text-primary" role="status">
                                            <span class="visually-hidden">Cargando...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Clasificación -->
                            <div class="tab-pane fade" id="leaderboard-pane" role="tabpanel">
                                <div id="leaderboard-content">
                                    <div class="text-center mb-4">
                                        <div class="spinner-border text-primary" role="status">
                                            <span class="visually-hidden">Cargando...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    createNotificationSystem() {
        const container = document.createElement('div');
        container.id = 'gamification-notifications';
        container.className = 'gamification-notifications';
        container.innerHTML = `
            <style>
                .gamification-notifications {
                    position: fixed;
                    top: 100px;
                    right: 20px;
                    z-index: 9999;
                    max-width: 350px;
                }

                .notification {
                    background: white;
                    border-radius: 10px;
                    padding: 15px;
                    margin-bottom: 10px;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.1);
                    border-left: 4px solid #28a745;
                    animation: slideInRight 0.5s ease;
                    transform: translateX(100%);
                    animation-fill-mode: forwards;
                }

                .notification.achievement {
                    border-left-color: #ffd700;
                    background: linear-gradient(135deg, #fff9c4 0%, #fff 100%);
                }

                .notification.points {
                    border-left-color: #007bff;
                    background: linear-gradient(135deg, #e3f2fd 0%, #fff 100%);
                }

                @keyframes slideInRight {
                    to {
                        transform: translateX(0);
                    }
                }

                @keyframes fadeOut {
                    to {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                }
            </style>
        `;

        document.body.appendChild(container);
    }

    // ============================================
    // ACTUALIZACIÓN DE INTERFAZ
    // ============================================

    updateProfileDisplay() {
        const content = document.getElementById('profile-content');
        if (!content || !this.userProfile) return;

        content.innerHTML = `
            <div class="row">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-body">
                            <div class="d-flex align-items-center mb-4">
                                <div class="profile-avatar me-3">
                                    <div class="level-circle">
                                        <span class="level-number">${this.userProfile.level}</span>
                                    </div>
                                </div>
                                <div>
                                    <h4 class="mb-1">${this.currentUser.username}</h4>
                                    <p class="text-muted mb-0">Nivel ${this.userProfile.level} • Rank #${this.userProfile.rank}</p>
                                </div>
                            </div>

                            <div class="row text-center">
                                <div class="col-4">
                                    <div class="stat-item">
                                        <h3 class="text-primary">${this.formatPoints(this.userProfile.totalPoints)}</h3>
                                        <small class="text-muted">Puntos Totales</small>
                                    </div>
                                </div>
                                <div class="col-4">
                                    <div class="stat-item">
                                        <h3 class="text-success">${this.userProfile.weeklyPoints}</h3>
                                        <small class="text-muted">Esta Semana</small>
                                    </div>
                                </div>
                                <div class="col-4">
                                    <div class="stat-item">
                                        <h3 class="text-warning">${this.userProfile.streak}</h3>
                                        <small class="text-muted">Días Consecutivos</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card mt-4">
                        <div class="card-header">
                            <h5 class="mb-0">Logros Recientes</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                ${this.userProfile.recentAchievements.map(achievement => `
                                    <div class="col-md-6 mb-3">
                                        <div class="achievement-item">
                                            <div class="d-flex align-items-center">
                                                <div class="achievement-icon me-3">
                                                    <span class="badge bg-success rounded-pill">+${achievement.points}</span>
                                                </div>
                                                <div>
                                                    <h6 class="mb-1">${achievement.name}</h6>
                                                    <small class="text-muted">${achievement.description}</small>
                                                    <div class="text-muted">
                                                        <small>${this.formatTimeAgo(achievement.earnedAt)}</small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Insignias</h5>
                        </div>
                        <div class="card-body">
                            <div class="badges-grid">
                                ${this.userProfile.badges.map(badge => `
                                    <div class="badge-item" title="${badge.description}">
                                        <div class="badge-icon ${badge.rarity}">${badge.icon}</div>
                                        <div class="badge-name">${badge.name}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <div class="card mt-4">
                        <div class="card-header">
                            <h5 class="mb-0">Estadísticas</h5>
                        </div>
                        <div class="card-body">
                            <div class="stats-list">
                                <div class="stat-row">
                                    <span>Tareas Completadas</span>
                                    <strong>${this.userProfile.stats.tasksCompleted}</strong>
                                </div>
                                <div class="stat-row">
                                    <span>Lecciones Terminadas</span>
                                    <strong>${this.userProfile.stats.lessonsFinished}</strong>
                                </div>
                                <div class="stat-row">
                                    <span>Posts en Foro</span>
                                    <strong>${this.userProfile.stats.forumPosts}</strong>
                                </div>
                                <div class="stat-row">
                                    <span>Horas de Estudio</span>
                                    <strong>${this.userProfile.stats.studyTimeHours}h</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    updateChallengesDisplay() {
        const content = document.getElementById('challenges-content');
        if (!content || !this.dailyChallenges.length) {
            if (content) {
                content.innerHTML = `
                    <div class="text-center py-5">
                        <i class="fas fa-calendar-check fa-3x text-muted mb-3"></i>
                        <h5>No hay desafíos disponibles</h5>
                        <p class="text-muted">Los desafíos diarios se actualizan cada 24 horas</p>
                    </div>
                `;
            }
            return;
        }

        const completedCount = this.dailyChallenges.filter(c => c.completed).length;
        const totalPoints = this.dailyChallenges.reduce((sum, c) => sum + c.points, 0);

        content.innerHTML = `
            <div class="challenges-header mb-4">
                <div class="row">
                    <div class="col-md-8">
                        <h4>Desafíos del Día</h4>
                        <p class="text-muted">Completa estos desafíos para ganar puntos extra</p>
                    </div>
                    <div class="col-md-4 text-end">
                        <div class="challenge-stats">
                            <div class="stat">
                                <strong>${completedCount}/${this.dailyChallenges.length}</strong>
                                <small>Completados</small>
                            </div>
                            <div class="stat">
                                <strong>${totalPoints}</strong>
                                <small>Puntos Disponibles</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="challenges-grid">
                ${this.dailyChallenges.map(challenge => `
                    <div class="challenge-card ${challenge.completed ? 'completed' : ''}" data-challenge-id="${challenge.id}">
                        <div class="challenge-header">
                            <div class="challenge-icon">${challenge.icon}</div>
                            <div class="challenge-info">
                                <h5>${challenge.title}</h5>
                                <p>${challenge.description}</p>
                            </div>
                            <div class="challenge-points">
                                <span class="points">+${challenge.points}</span>
                                <span class="difficulty ${challenge.difficulty}">${this.getDifficultyLabel(challenge.difficulty)}</span>
                            </div>
                        </div>

                        <div class="challenge-progress">
                            <div class="progress">
                                <div class="progress-bar" style="width: ${challenge.progress || 0}%"></div>
                            </div>
                            <small>${challenge.progress || 0}% completado</small>
                        </div>

                        <div class="challenge-actions">
                            ${challenge.completed ?
                                '<span class="badge bg-success"><i class="fas fa-check me-1"></i>Completado</span>' :
                                `<button class="btn btn-primary btn-sm" onclick="gamificationSystem.completeChallenge('${challenge.id}')">
                                    <i class="fas fa-play me-1"></i>Completar
                                </button>`
                            }
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // ============================================
    // ACCIONES DE GAMIFICACIÓN
    // ============================================

    async awardPoints(activity, points = null, metadata = {}) {
        try {
            const response = await this.apiCall('/award-points', 'POST', {
                activity: activity,
                points: points,
                metadata: metadata
            });

            if (response.success) {
                this.showNotification({
                    type: 'points',
                    title: '¡Puntos Ganados!',
                    message: `+${response.pointsEarned} puntos por ${activity}`,
                    points: response.pointsEarned
                });

                // Mostrar logros desbloqueados
                if (response.achievements && response.achievements.length > 0) {
                    response.achievements.forEach(achievement => {
                        this.showNotification({
                            type: 'achievement',
                            title: '¡Nuevo Logro!',
                            message: achievement.name,
                            icon: achievement.icon,
                            points: achievement.points
                        });
                    });
                }

                // Actualizar perfil
                await this.loadUserProfile();
                this.updateFloatingWidget();
            }
        } catch (error) {
            console.error('❌ Error otorgando puntos:', error);
        }
    }

    async completeChallenge(challengeId) {
        try {
            const response = await this.apiCall('/complete-challenge', 'POST', {
                challengeId: challengeId,
                evidence: { timestamp: new Date().toISOString() }
            });

            if (response.success) {
                this.showNotification({
                    type: 'achievement',
                    title: '¡Desafío Completado!',
                    message: `+${response.data.totalPointsEarned} puntos`,
                    points: response.data.totalPointsEarned
                });

                // Actualizar desafíos
                await this.loadDailyChallenges();
                await this.loadUserProfile();
                this.updateFloatingWidget();
            }
        } catch (error) {
            console.error('❌ Error completando desafío:', error);
        }
    }

    // ============================================
    // UTILIDADES
    // ============================================

    async apiCall(endpoint, method = 'GET', data = null) {
        const token = localStorage.getItem('authToken');
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(this.apiBase + endpoint, options);
        return await response.json();
    }

    formatPoints(points) {
        if (points >= 1000000) {
            return (points / 1000000).toFixed(1) + 'M';
        } else if (points >= 1000) {
            return (points / 1000).toFixed(1) + 'K';
        }
        return points.toString();
    }

    formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

        if (diffInHours < 1) return 'Hace unos minutos';
        if (diffInHours < 24) return `Hace ${diffInHours} horas`;
        if (diffInHours < 48) return 'Ayer';
        return `Hace ${Math.floor(diffInHours / 24)} días`;
    }

    getDifficultyLabel(difficulty) {
        const labels = {
            easy: 'Fácil',
            medium: 'Medio',
            hard: 'Difícil'
        };
        return labels[difficulty] || difficulty;
    }

    showNotification(notification) {
        const container = document.getElementById('gamification-notifications');
        if (!container) return;

        const notificationElement = document.createElement('div');
        notificationElement.className = `notification ${notification.type}`;
        notificationElement.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="notification-icon me-3">
                    ${notification.icon ? notification.icon :
                      notification.type === 'achievement' ? '🏆' : '⭐'}
                </div>
                <div class="flex-grow-1">
                    <h6 class="mb-1">${notification.title}</h6>
                    <p class="mb-0 small">${notification.message}</p>
                    ${notification.points ? `<small class="text-success">+${notification.points} puntos</small>` : ''}
                </div>
                <button class="btn-close btn-close-sm" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;

        container.appendChild(notificationElement);

        // Auto-remove después de 5 segundos
        setTimeout(() => {
            if (notificationElement.parentNode) {
                notificationElement.style.animation = 'fadeOut 0.5s ease forwards';
                setTimeout(() => {
                    if (notificationElement.parentNode) {
                        notificationElement.remove();
                    }
                }, 500);
            }
        }, 5000);
    }

    updateFloatingWidget() {
        const widget = document.getElementById('gamification-widget');
        if (widget && this.userProfile) {
            const levelNumber = widget.querySelector('.level-number');
            const pointsNumber = widget.querySelector('.points-number');
            const streakSpan = widget.querySelector('.streak-display span');
            const challengesCount = widget.querySelector('.challenges-count');

            if (levelNumber) levelNumber.textContent = this.userProfile.level;
            if (pointsNumber) pointsNumber.textContent = this.formatPoints(this.userProfile.totalPoints);
            if (streakSpan) streakSpan.textContent = this.userProfile.streak;
            if (challengesCount) {
                const pending = this.dailyChallenges.filter(c => !c.completed).length;
                challengesCount.textContent = `${pending} desafíos pendientes`;
            }
        }
    }

    openMainModal() {
        const modal = new bootstrap.Modal(document.getElementById('gamification-modal'));
        modal.show();

        // Cargar datos de las pestañas cuando se abra el modal
        this.loadAchievements();
        this.loadLeaderboard();
    }

    setupEventListeners() {
        // Escuchar eventos de actividad para otorgar puntos automáticamente
        document.addEventListener('userLogin', () => {
            this.awardPoints('login');
        });

        document.addEventListener('taskCompleted', (event) => {
            this.awardPoints('task_completed', null, event.detail);
        });

        document.addEventListener('lessonFinished', (event) => {
            this.awardPoints('lesson_finished', null, event.detail);
        });
    }

    startPeriodicUpdates() {
        // Actualizar datos cada 5 minutos
        setInterval(() => {
            if (this.currentUser) {
                this.loadUserProfile();
                this.loadDailyChallenges();
            }
        }, 5 * 60 * 1000);
    }
}

// Inicializar el sistema globalmente
window.gamificationSystem = null;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.gamificationSystem = new GamificationSystem();
});

// También inicializar cuando el usuario haga login
document.addEventListener('userAuthenticated', () => {
    if (!window.gamificationSystem || !window.gamificationSystem.currentUser) {
        window.gamificationSystem = new GamificationSystem();
    }
});

console.log('🎮 [GAMIFICATION] Sistema de gamificación cargado');