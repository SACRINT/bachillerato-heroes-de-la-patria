/**
 * 🪙 IACoins Dashboard Manager
 * Sistema de gamificación frontend para BGE
 * FASE 1 - Semana 1-2
 */

(function() {
    'use strict';

    // =========================================
    // CONFIGURACIÓN
    // =========================================
    const CONFIG = {
        API_BASE: '/api/iacoins',
        ANIMATION_DURATION: 500,
        REFRESH_INTERVAL: 60000, // 1 minuto
        LEVELS: generateLevels()
    };

    // Generar 50 niveles con XP requerido
    function generateLevels() {
        const levels = [];
        const titles = [
            'Novato', 'Aprendiz', 'Estudiante', 'Aplicado', 'Dedicado',
            'Competente', 'Hábil', 'Experto', 'Maestro', 'Virtuoso',
            'Sabio', 'Erudito', 'Genio', 'Prodigio', 'Leyenda',
            'Mítico', 'Épico', 'Heroico', 'Divino', 'Trascendente'
        ];

        for (let i = 1; i <= 50; i++) {
            const xpRequired = Math.floor(100 * Math.pow(1.5, i - 1));
            const titleIndex = Math.min(Math.floor((i - 1) / 2.5), titles.length - 1);
            levels.push({
                level: i,
                title: titles[titleIndex],
                xpRequired,
                rewards: i % 5 === 0 ? { coins: i * 10, badge: true } : null
            });
        }
        return levels;
    }

    // =========================================
    // ESTADO GLOBAL
    // =========================================
    let state = {
        balance: null,
        transactions: [],
        challenges: [],
        achievements: [],
        leaderboard: [],
        loading: false,
        error: null
    };

    // =========================================
    // API CALLS
    // =========================================
    async function fetchWithAuth(endpoint, options = {}) {
        const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken');

        const response = await fetch(`${CONFIG.API_BASE}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
    }

    async function loadBalance() {
        try {
            const result = await fetchWithAuth('/balance');
            if (result.success) {
                state.balance = result.data;
                renderBalance();
                renderLevel();
            }
        } catch (error) {
            console.error('[IACOINS] Error cargando balance:', error);
        }
    }

    async function loadTransactions(limit = 10) {
        try {
            const result = await fetchWithAuth(`/transactions?limit=${limit}`);
            if (result.success) {
                state.transactions = result.data;
                renderTransactions();
            }
        } catch (error) {
            console.error('[IACOINS] Error cargando transacciones:', error);
        }
    }

    async function loadChallenges() {
        try {
            const result = await fetchWithAuth('/challenges');
            if (result.success) {
                state.challenges = result.data;
                renderChallenges();
            }
        } catch (error) {
            console.error('[IACOINS] Error cargando retos:', error);
        }
    }

    async function loadAchievements() {
        try {
            const result = await fetchWithAuth('/achievements');
            if (result.success) {
                state.achievements = result.data;
                renderAchievements();
            }
        } catch (error) {
            console.error('[IACOINS] Error cargando logros:', error);
        }
    }

    async function loadLeaderboard(limit = 10) {
        try {
            const result = await fetchWithAuth(`/leaderboard?limit=${limit}`);
            if (result.success) {
                state.leaderboard = result.data;
                renderLeaderboard();
            }
        } catch (error) {
            console.error('[IACOINS] Error cargando leaderboard:', error);
        }
    }

    async function completeChallenge(challengeId) {
        try {
            const result = await fetchWithAuth(`/challenges/${challengeId}/complete`, {
                method: 'POST'
            });

            if (result.success) {
                showCoinAnimation(result.data.coinsEarned, 'earn');
                showNotification(`¡Reto completado! +${result.data.coinsEarned} IACoins`, 'success');

                // Recargar datos
                await Promise.all([
                    loadBalance(),
                    loadChallenges(),
                    loadTransactions()
                ]);
            }

            return result;
        } catch (error) {
            console.error('[IACOINS] Error completando reto:', error);
            showNotification('Error al completar reto', 'error');
        }
    }

    // =========================================
    // RENDERIZADO
    // =========================================
    function renderBalance() {
        const container = document.getElementById('iacoins-balance');
        if (!container || !state.balance) return;

        container.innerHTML = `
            <div class="iacoins-balance-card">
                <div class="balance-icon">
                    <i class="fas fa-coins"></i>
                </div>
                <div class="balance-info">
                    <span class="balance-label">Tu Balance</span>
                    <span class="balance-amount" id="balance-value">${state.balance.balance}</span>
                </div>
                <div class="balance-stats">
                    <div class="stat">
                        <span class="stat-label">Total Ganado</span>
                        <span class="stat-value text-success">+${state.balance.total_earned}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Total Gastado</span>
                        <span class="stat-value text-danger">-${state.balance.total_spent}</span>
                    </div>
                </div>
            </div>
        `;
    }

    function renderLevel() {
        const container = document.getElementById('iacoins-level');
        if (!container || !state.balance) return;

        const currentLevel = state.balance.level || 1;
        const currentXP = state.balance.experience_points || 0;
        const levelInfo = CONFIG.LEVELS[currentLevel - 1];
        const nextLevel = CONFIG.LEVELS[currentLevel] || levelInfo;
        const progress = ((currentXP - levelInfo.xpRequired) / (nextLevel.xpRequired - levelInfo.xpRequired)) * 100;

        container.innerHTML = `
            <div class="level-card">
                <div class="level-badge">
                    <span class="level-number">${currentLevel}</span>
                </div>
                <div class="level-info">
                    <h4 class="level-title">${levelInfo.title}</h4>
                    <div class="xp-progress">
                        <div class="progress">
                            <div class="progress-bar bg-warning" style="width: ${Math.min(progress, 100)}%"></div>
                        </div>
                        <span class="xp-text">${currentXP} / ${nextLevel.xpRequired} XP</span>
                    </div>
                </div>
            </div>
        `;
    }

    function renderTransactions() {
        const container = document.getElementById('iacoins-transactions');
        if (!container) return;

        if (!state.transactions.length) {
            container.innerHTML = '<p class="text-muted text-center">No hay transacciones aún</p>';
            return;
        }

        const html = state.transactions.map(tx => {
            const isEarn = tx.type === 'earn' || tx.type === 'bonus';
            const icon = isEarn ? 'fa-arrow-up' : 'fa-arrow-down';
            const colorClass = isEarn ? 'text-success' : 'text-danger';
            const sign = isEarn ? '+' : '-';
            const date = new Date(tx.created_at).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });

            return `
                <div class="transaction-item">
                    <div class="transaction-icon ${colorClass}">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="transaction-details">
                        <span class="transaction-desc">${tx.description}</span>
                        <span class="transaction-date">${date}</span>
                    </div>
                    <div class="transaction-amount ${colorClass}">
                        ${sign}${tx.amount}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="transactions-list">
                ${html}
            </div>
        `;
    }

    function renderChallenges() {
        const container = document.getElementById('iacoins-challenges');
        if (!container) return;

        if (!state.challenges.length) {
            container.innerHTML = '<p class="text-muted text-center">No hay retos disponibles</p>';
            return;
        }

        const html = state.challenges.map(challenge => {
            const completed = challenge.user_status === 'claimed';
            const difficultyColors = {
                easy: 'success',
                medium: 'warning',
                hard: 'danger',
                expert: 'dark'
            };
            const difficultyColor = difficultyColors[challenge.difficulty] || 'secondary';

            return `
                <div class="challenge-card ${completed ? 'completed' : ''}">
                    <div class="challenge-header">
                        <span class="badge bg-${difficultyColor}">${challenge.difficulty}</span>
                        <span class="challenge-reward">
                            <i class="fas fa-coins text-warning"></i> ${challenge.reward_coins}
                        </span>
                    </div>
                    <h5 class="challenge-title">${challenge.title}</h5>
                    <p class="challenge-description">${challenge.description || ''}</p>
                    <div class="challenge-footer">
                        ${completed
                            ? '<span class="badge bg-success"><i class="fas fa-check"></i> Completado</span>'
                            : `<button class="btn btn-primary btn-sm" onclick="window.IACoinsManager.completeChallenge(${challenge.id})">
                                Completar Reto
                               </button>`
                        }
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="challenges-grid">
                ${html}
            </div>
        `;
    }

    function renderAchievements() {
        const container = document.getElementById('iacoins-achievements');
        if (!container) return;

        if (!state.achievements.length) {
            container.innerHTML = '<p class="text-muted text-center">No hay logros disponibles</p>';
            return;
        }

        const html = state.achievements.map(achievement => {
            const unlocked = achievement.unlocked;

            return `
                <div class="achievement-badge ${unlocked ? 'unlocked' : 'locked'}">
                    <div class="badge-icon">
                        <i class="fas ${achievement.icon || 'fa-trophy'}"></i>
                    </div>
                    <div class="badge-info">
                        <span class="badge-name">${achievement.name}</span>
                        <span class="badge-description">${achievement.description || ''}</span>
                    </div>
                    ${unlocked
                        ? `<span class="badge-date">${new Date(achievement.unlocked_at).toLocaleDateString()}</span>`
                        : '<span class="badge-locked"><i class="fas fa-lock"></i></span>'
                    }
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="achievements-grid">
                ${html}
            </div>
        `;
    }

    function renderLeaderboard() {
        const container = document.getElementById('iacoins-leaderboard');
        if (!container) return;

        if (!state.leaderboard.length) {
            container.innerHTML = '<p class="text-muted text-center">Leaderboard vacío</p>';
            return;
        }

        const html = state.leaderboard.map((entry, index) => {
            const rankClass = index < 3 ? `rank-${index + 1}` : '';
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';

            return `
                <div class="leaderboard-entry ${rankClass}">
                    <span class="rank">${medal || entry.rank}</span>
                    <span class="player-name">${entry.name}</span>
                    <span class="player-level">Nv. ${entry.level}</span>
                    <span class="player-earned">${entry.totalEarned} <i class="fas fa-coins text-warning"></i></span>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="leaderboard-list">
                ${html}
            </div>
        `;
    }

    // =========================================
    // ANIMACIONES Y NOTIFICACIONES
    // =========================================
    function showCoinAnimation(amount, type = 'earn') {
        const container = document.createElement('div');
        container.className = `coin-animation ${type}`;
        container.innerHTML = `
            <i class="fas fa-coins"></i>
            <span>${type === 'earn' ? '+' : '-'}${amount}</span>
        `;

        document.body.appendChild(container);

        // Animar
        requestAnimationFrame(() => {
            container.classList.add('animate');
        });

        // Remover después de animación
        setTimeout(() => {
            container.remove();
        }, CONFIG.ANIMATION_DURATION + 500);
    }

    function showNotification(message, type = 'info') {
        const container = document.getElementById('iacoins-notifications') || document.body;

        const notification = document.createElement('div');
        notification.className = `iacoins-notification alert alert-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            ${message}
        `;

        container.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // =========================================
    // INICIALIZACIÓN
    // =========================================
    async function init() {
        console.log('[IACOINS] Inicializando IACoins Dashboard...');

        // Verificar autenticación
        const token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
        if (!token) {
            console.warn('[IACOINS] Usuario no autenticado');
            return;
        }

        // Cargar todos los datos en paralelo
        state.loading = true;

        try {
            await Promise.all([
                loadBalance(),
                loadTransactions(),
                loadChallenges(),
                loadAchievements(),
                loadLeaderboard()
            ]);

            console.log('[IACOINS] Dashboard cargado correctamente');
        } catch (error) {
            console.error('[IACOINS] Error inicializando dashboard:', error);
            state.error = error.message;
        } finally {
            state.loading = false;
        }

        // Auto-refresh
        setInterval(() => {
            loadBalance();
            loadLeaderboard();
        }, CONFIG.REFRESH_INTERVAL);
    }

    // =========================================
    // API PÚBLICA
    // =========================================
    window.IACoinsManager = {
        init,
        loadBalance,
        loadTransactions,
        loadChallenges,
        loadAchievements,
        loadLeaderboard,
        completeChallenge,
        showCoinAnimation,
        showNotification,
        getState: () => ({ ...state }),
        getLevelInfo: (level) => CONFIG.LEVELS[level - 1]
    };

    // Auto-inicializar cuando DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
