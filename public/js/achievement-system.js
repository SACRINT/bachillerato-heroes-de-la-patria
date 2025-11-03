/**
 * 🏆 ACHIEVEMENT SYSTEM - SISTEMA DE LOGROS GAMIFICADOS
 * Badges y logros para motivar el uso del sistema IA
 */

class AchievementSystem {
    constructor() {
        this.currentUser = null;
        this.userAchievements = [];
        this.availableAchievements = this.initializeAchievements();
        this.init();
    }

    init() {
        this.loadUserSession();
        this.loadUserAchievements();
    }

    loadUserSession() {
        const savedUser = localStorage.getItem('bge_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        }
    }

    loadUserAchievements() {
        if (!this.currentUser) return;

        const saved = localStorage.getItem(`bge_achievements_${this.currentUser.email}`);
        this.userAchievements = saved ? JSON.parse(saved) : [];
    }

    initializeAchievements() {
        return [
            {
                id: 'first_login',
                title: '🎯 Primer Paso',
                description: 'Completar tu primer inicio de sesión',
                icon: '🚀',
                reward: { coins: 10, xp: 50 },
                unlocked: false
            },
            {
                id: 'ai_novice',
                title: '🤖 Novato IA',
                description: 'Usar tu primer prompt de IA',
                icon: '🎓',
                reward: { coins: 25, xp: 100 },
                unlocked: false
            },
            {
                id: 'daily_streak_3',
                title: '📅 Consistencia',
                description: 'Conectarte 3 días seguidos',
                icon: '🔥',
                reward: { coins: 50, xp: 200 },
                unlocked: false
            },
            {
                id: 'prompt_collector',
                title: '📚 Coleccionista',
                description: 'Desbloquear 5 prompts diferentes',
                icon: '💎',
                reward: { coins: 100, xp: 300 },
                unlocked: false
            },
            {
                id: 'power_user',
                title: '⚡ Usuario Avanzado',
                description: 'Usar 25 prompts en total',
                icon: '👑',
                reward: { coins: 200, xp: 500 },
                unlocked: false
            },
            {
                id: 'role_master',
                title: '🎭 Maestría de Rol',
                description: 'Usar todos los prompts de tu categoría',
                icon: '🌟',
                reward: { coins: 300, xp: 750 },
                unlocked: false
            },
            {
                id: 'night_owl',
                title: '🦉 Búho Nocturno',
                description: 'Usar IA después de las 10 PM',
                icon: '🌙',
                reward: { coins: 15, xp: 75 },
                unlocked: false
            },
            {
                id: 'early_bird',
                title: '🐦 Madrugador',
                description: 'Usar IA antes de las 7 AM',
                icon: '🌅',
                reward: { coins: 15, xp: 75 },
                unlocked: false
            }
        ];
    }

    showAchievements() {
        if (!this.currentUser) {
            alert('🔐 Debes iniciar sesión para ver tus logros.');
            return;
        }

        this.displayAchievementsModal();
    }

    displayAchievementsModal() {
        const unlockedCount = this.userAchievements.length;
        const totalCount = this.availableAchievements.length;

        const modalHTML = `
            <div class="modal fade" id="achievementsModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 15px;">
                        <div class="modal-header border-0 text-white">
                            <h5 class="modal-title fw-bold">🏆 Mis Logros (${unlockedCount}/${totalCount})</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body text-white" style="max-height: 60vh; overflow-y: auto;">
                            <div class="row">
                                ${this.generateAchievementsGrid()}
                            </div>
                        </div>
                        <div class="modal-footer border-0">
                            <div class="text-center w-100">
                                <small>¡Sigue usando el sistema para desbloquear más logros!</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remover modal existente
        const existingModal = document.getElementById('achievementsModal');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = new bootstrap.Modal(document.getElementById('achievementsModal'));
        modal.show();
    }

    generateAchievementsGrid() {
        return this.availableAchievements.map(achievement => {
            const isUnlocked = this.userAchievements.some(ua => ua.id === achievement.id);

            return `
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="card ${isUnlocked ? 'bg-success bg-opacity-30' : 'bg-white bg-opacity-10'} border-0 h-100">
                        <div class="card-body text-center">
                            <div style="font-size: 2rem; ${isUnlocked ? '' : 'filter: grayscale(100%); opacity: 0.5;'}">
                                ${achievement.icon}
                            </div>
                            <h6 class="card-title mt-2 ${isUnlocked ? 'text-warning' : ''}">${achievement.title}</h6>
                            <p class="card-text small">${achievement.description}</p>
                            <div class="small">
                                ${isUnlocked
                                    ? `<span class="badge bg-success">✅ Desbloqueado</span>`
                                    : `<span class="badge bg-secondary">🔒 Bloqueado</span>`
                                }
                            </div>
                            <div class="small mt-2 text-warning">
                                💰 ${achievement.reward.coins} coins | ⭐ ${achievement.reward.xp} XP
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    checkAndUnlockAchievement(achievementId, data = {}) {
        const achievement = this.availableAchievements.find(a => a.id === achievementId);
        if (!achievement) return;

        const alreadyUnlocked = this.userAchievements.some(ua => ua.id === achievementId);
        if (alreadyUnlocked) return;

        // Lógica específica de validación por tipo de logro
        if (this.validateAchievement(achievementId, data)) {
            this.unlockAchievement(achievement);
        }
    }

    validateAchievement(achievementId, data) {
        switch (achievementId) {
            case 'first_login':
                return true; // Se desbloquea automáticamente al hacer login

            case 'ai_novice':
                return data.promptsUsed >= 1;

            case 'prompt_collector':
                return data.unlockedPrompts >= 5;

            case 'power_user':
                return data.totalPromptUsage >= 25;

            case 'night_owl':
                const hour = new Date().getHours();
                return hour >= 22 || hour <= 5;

            case 'early_bird':
                const earlyHour = new Date().getHours();
                return earlyHour >= 5 && earlyHour <= 7;

            default:
                return false;
        }
    }

    unlockAchievement(achievement) {
        const unlockedAchievement = {
            ...achievement,
            unlockedAt: new Date().toISOString()
        };

        this.userAchievements.push(unlockedAchievement);
        this.saveUserAchievements();

        // Otorgar recompensas
        this.grantRewards(achievement.reward);

        // Mostrar notificación
        this.showUnlockNotification(achievement);
    }

    saveUserAchievements() {
        if (!this.currentUser) return;

        localStorage.setItem(
            `bge_achievements_${this.currentUser.email}`,
            JSON.stringify(this.userAchievements)
        );
    }

    grantRewards(reward) {
        if (!this.currentUser) return;

        const progressKey = `bge_progress_${this.currentUser.email}`;
        const currentProgress = JSON.parse(localStorage.getItem(progressKey) || '{}');

        currentProgress.coins = (currentProgress.coins || 0) + reward.coins;
        currentProgress.xp = (currentProgress.xp || 0) + reward.xp;

        // Calcular nuevo nivel basado en XP
        currentProgress.level = Math.floor(currentProgress.xp / 500) + 1;

        localStorage.setItem(progressKey, JSON.stringify(currentProgress));

        // Actualizar UI si existe
        this.updateUIProgress(currentProgress);
    }

    updateUIProgress(progress) {
        const levelEl = document.getElementById('userLevel');
        const coinsEl = document.getElementById('userCoins');

        if (levelEl) levelEl.textContent = `Nivel ${progress.level}`;
        if (coinsEl) coinsEl.textContent = progress.coins;
    }

    showUnlockNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'alert alert-success alert-dismissible fade show position-fixed';
        notification.style.cssText = 'top: 120px; right: 20px; z-index: 1070; max-width: 350px; animation: slideIn 0.5s ease;';
        notification.innerHTML = `
            <div class="d-flex align-items-center">
                <div style="font-size: 1.5rem; margin-right: 10px;">${achievement.icon}</div>
                <div>
                    <strong>🎉 ¡Logro Desbloqueado!</strong><br>
                    <small>${achievement.title}</small><br>
                    <small class="text-warning">+${achievement.reward.coins} coins +${achievement.reward.xp} XP</small>
                </div>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

// Funciones globales
function openAchievements() {
    if (window.achievementSystem) {
        window.achievementSystem.showAchievements();
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    window.achievementSystem = new AchievementSystem();

    // Verificar logro de primer login si hay usuario
    const savedUser = localStorage.getItem('bge_user');
    if (savedUser && window.achievementSystem) {
        setTimeout(() => {
            window.achievementSystem.checkAndUnlockAchievement('first_login');
        }, 2000);
    }
});