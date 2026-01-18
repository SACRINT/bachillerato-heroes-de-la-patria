/**
 * 🪙 IACoins Dashboard Manager
 * Sistema de gamificación frontend para BGE
 * FASE 1 - Semana 1-2
 */

(function () {
    'use strict';

    // =========================================
    // CONFIGURACIÓN
    // =========================================
    const CONFIG = {
        API_BASE: '/api/iacoins',  // ✅ FIX (14 Dic 2025): Ruta registrada en server.js línea 414
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
        // Buscar token en el sistema unificado de autenticación
        const token = sessionStorage.getItem('bge_auth_token') ||
            localStorage.getItem('bge_auth_token') ||
            sessionStorage.getItem('authToken') ||
            localStorage.getItem('authToken');

        if (!token) {
            console.warn('[IACOINS] ⚠️ No se encontró token de autenticación');
            throw new Error('No autenticado - redirigiendo a login');
        }

        const response = await fetch(`${CONFIG.API_BASE}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                console.error('[IACOINS] 🔐 Token expirado o inválido');
                sessionStorage.removeItem('bge_auth_token');
                localStorage.removeItem('bge_auth_token');
                window.location.href = '/index.html';
            }
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
            } else {
                throw new Error('API returned success: false');
            }
        } catch (error) {
            console.error('[IACOINS] Error cargando balance:', error);
            const container = document.getElementById('iacoins-balance');
            if (container) {
                container.innerHTML = '<p class="text-muted text-center small">No se pudo cargar el balance</p>';
            }
        }
    }

    async function loadTransactions(limit = 10) {
        try {
            const result = await fetchWithAuth(`/transactions?limit=${limit}`);
            if (result.success) {
                state.transactions = result.data;
                renderTransactions();
            } else {
                throw new Error('API returned success: false');
            }
        } catch (error) {
            console.error('[IACOINS] Error cargando transacciones:', error);
            const container = document.getElementById('iacoins-transactions');
            if (container) {
                container.innerHTML = '<p class="text-muted text-center">No hay transacciones</p>';
            }
        }
    }

    async function loadChallenges() {
        try {
            const result = await fetchWithAuth('/challenges');
            if (result.success) {
                state.challenges = result.data;
                renderChallenges();
            } else {
                throw new Error('API returned success: false');
            }
        } catch (error) {
            console.error('[IACOINS] Error cargando retos:', error);
            const container = document.getElementById('iacoins-challenges');
            if (container) {
                container.innerHTML = '<p class="text-muted text-center">No hay retos disponibles</p>';
            }
        }
    }

    async function loadAchievements() {
        try {
            const token = sessionStorage.getItem('bge_auth_token') || localStorage.getItem('bge_auth_token');
            if (!token) {
                const container = document.getElementById('iacoins-achievements');
                if (container) container.innerHTML = '<p class="text-muted text-center">Inicia sesión para ver logros</p>';
                return;
            }

            // El endpoint /achievements ya filtra por usuario autenticado (via JWT)
            const result = await fetchWithAuth('/achievements');

            if (result.success && result.data) {
                // El backend retorna array con 'unlocked: true/false' ya incluido
                state.achievements = result.data;
                renderAchievements();
            } else {
                throw new Error('API returned success: false or no data');
            }
        } catch (error) {
            console.error('[IACOINS] Error cargando logros:', error);
            const container = document.getElementById('iacoins-achievements');
            if (container) {
                container.innerHTML = '<p class="text-muted text-center">No hay logros disponibles</p>';
            }
        }
    }

    // =========================================
    // FUNCIONES DE CARGA FALTANTES
    // =========================================
    async function loadLeaderboard() {
        try {
            const result = await fetchWithAuth('/leaderboard?limit=10');
            if (result.success) {
                state.leaderboard = result.data;
                renderLeaderboard();
            }
        } catch (error) {
            console.error('[IACOINS] Error cargando leaderboard:', error);
            // Mostrar mensaje de error en lugar de spinner infinito
            const container = document.getElementById('iacoins-leaderboard');
            if (container) {
                container.innerHTML = '<p class="text-muted text-center">No se pudo cargar el ranking</p>';
            }
        }
    }

    async function completeChallenge(challengeId) {
        try {
            const result = await fetchWithAuth(`/challenges/${challengeId}/complete`, {
                method: 'POST'
            });
            if (result.success) {
                showNotification('¡Reto completado! +' + result.data.reward + ' IACoins', 'success');
                showCoinAnimation(result.data.reward, 'earn');
                // Recargar datos
                await Promise.all([loadBalance(), loadChallenges()]);
            }
        } catch (error) {
            console.error('[IACOINS] Error completando reto:', error);
            showNotification('Error al completar el reto', 'error');
        }
    }

    // =========================================
    // FUNCIONES DE RENDERIZADO FALTANTES
    // =========================================
    function renderBalance() {
        const container = document.getElementById('iacoins-balance');
        if (!container) return;

        if (!state.balance) {
            container.innerHTML = '<p class="text-muted text-center">Sin datos de balance</p>';
            return;
        }

        const { balance, total_earned, total_spent } = state.balance;

        container.innerHTML = `
            <div class="balance-card">
                <div class="balance-icon">
                    <i class="fas fa-coins text-warning"></i>
                </div>
                <div class="balance-info">
                    <h2 class="balance-amount">${balance || 0}</h2>
                    <p class="balance-label">IACoins Disponibles</p>
                </div>
                <div class="balance-stats mt-2">
                    <small class="text-success">
                        <i class="fas fa-arrow-up"></i> ${total_earned || 0} ganados
                    </small>
                    <small class="text-danger ms-2">
                        <i class="fas fa-arrow-down"></i> ${total_spent || 0} gastados
                    </small>
                </div>
            </div>
        `;
    }

    function renderTransactions() {
        const container = document.getElementById('iacoins-transactions');
        if (!container) return;

        if (!state.transactions || !state.transactions.length) {
            container.innerHTML = '<p class="text-muted text-center">No hay transacciones recientes</p>';
            return;
        }

        const html = state.transactions.map(tx => {
            const isEarn = tx.type === 'earn' || tx.amount > 0;
            const icon = isEarn ? 'fa-plus-circle text-success' : 'fa-minus-circle text-danger';
            const sign = isEarn ? '+' : '';
            const date = new Date(tx.created_at || tx.createdAt).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });

            return `
                <div class="transaction-item d-flex justify-content-between align-items-center py-2 border-bottom">
                    <div class="d-flex align-items-center">
                        <i class="fas ${icon} me-2"></i>
                        <div>
                            <span class="transaction-description">${tx.description || tx.reason || 'Transacción'}</span>
                            <small class="text-muted d-block">${date}</small>
                        </div>
                    </div>
                    <span class="transaction-amount ${isEarn ? 'text-success' : 'text-danger'} fw-bold">
                        ${sign}${Math.abs(tx.amount)} <i class="fas fa-coins text-warning small"></i>
                    </span>
                </div>
            `;
        }).join('');

        container.innerHTML = `<div class="transactions-list">${html}</div>`;
    }

    function renderChallenges() {
        const container = document.getElementById('iacoins-challenges');
        if (!container) return;

        if (!state.challenges || !state.challenges.length) {
            container.innerHTML = '<p class="text-muted text-center">No hay retos disponibles en este momento</p>';
            return;
        }

        const html = state.challenges.map(challenge => {
            const isCompleted = challenge.completed || challenge.status === 'completed';
            const statusBadge = isCompleted
                ? '<span class="badge bg-success">Completado</span>'
                : '<span class="badge bg-primary">Disponible</span>';

            const progressPercent = challenge.progress
                ? Math.min((challenge.progress / challenge.target) * 100, 100)
                : 0;

            return `
                <div class="challenge-card ${isCompleted ? 'completed' : ''} mb-3 p-3 border rounded">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h6 class="mb-1">
                                <i class="fas ${challenge.icon || 'fa-star'} text-warning me-2"></i>
                                ${challenge.name || challenge.title}
                            </h6>
                            <p class="text-muted small mb-2">${challenge.description || ''}</p>
                        </div>
                        <div class="text-end">
                            ${statusBadge}
                            <div class="reward mt-1">
                                <span class="fw-bold text-warning">+${challenge.reward || challenge.coins_reward || 0}</span>
                                <i class="fas fa-coins text-warning"></i>
                            </div>
                        </div>
                    </div>
                    ${challenge.target ? `
                        <div class="progress mt-2" style="height: 8px;">
                            <div class="progress-bar bg-success" role="progressbar" 
                                 style="width: ${progressPercent}%" 
                                 aria-valuenow="${progressPercent}" aria-valuemin="0" aria-valuemax="100">
                            </div>
                        </div>
                        <small class="text-muted">${challenge.progress || 0} / ${challenge.target}</small>
                    ` : ''}
                    ${!isCompleted && challenge.actionable ? `
                        <button class="btn btn-sm btn-outline-primary mt-2" 
                                onclick="IACoinsManager.completeChallenge('${challenge.id}')">
                            Completar Reto
                        </button>
                    ` : ''}
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    function renderAchievements() {
        const container = document.getElementById('iacoins-achievements');
        if (!container) return;

        if (!state.achievements || !state.achievements.length) {
            container.innerHTML = '<p class="text-muted text-center">No hay logros disponibles</p>';
            return;
        }

        const html = state.achievements.map(achievement => {
            const unlocked = achievement.unlocked;
            // Manejar inconsistencia de nombres de columnas (icon vs icon_icon vs badge_icon)
            const iconClass = achievement.icon_icon || achievement.badge_icon || achievement.icon || 'fa-trophy';

            return `
                <div class="achievement-badge ${unlocked ? 'unlocked' : 'locked'}">
                    <div class="badge-icon">
                        <i class="fas ${iconClass}"></i>
                    </div>
                    <div class="badge-info">
                        <span class="badge-name">${achievement.name}</span>
                        <span class="badge-description">${achievement.description || ''}</span>
                    </div>
                    ${unlocked && achievement.earned_at
                    ? `<span class="badge-date">${new Date(achievement.earned_at).toLocaleDateString()}</span>`
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

        // Verificar autenticación (buscar token en sistema unificado)
        const token = sessionStorage.getItem('bge_auth_token') ||
            localStorage.getItem('bge_auth_token') ||
            sessionStorage.getItem('authToken') ||
            localStorage.getItem('authToken');

        if (!token) {
            console.warn('[IACOINS] 🔐 Usuario no autenticado - redirigiendo a login');
            // Esperar un poco antes de redirigir para que se cargue bien la página
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 1000);
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
                loadLeaderboard(),
                loadStreak(),
                loadXPProfile(),
                checkPersonalityProfile() // ✅ Semana 9
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
            loadStreak();
            loadXPProfile();
        }, CONFIG.REFRESH_INTERVAL);
    }

    // =========================================
    // XP & LEVELING SYSTEM (Semana 2)
    // =========================================
    async function loadXPProfile() {
        try {
            const token = sessionStorage.getItem('bge_auth_token') || localStorage.getItem('bge_auth_token');
            if (!token) return;

            const payload = JSON.parse(atob(token.split('.')[1]));
            const userId = payload.id;

            const result = await fetchWithAuth(`/gamification-ext/xp/profile/${userId}`);

            if (result.success) {
                state.xpProfile = result.data;
                renderLevel();
            } else {
                // Si falla, renderizar con valores por defecto
                renderLevel();
            }
        } catch (error) {
            console.error('[IACOINS] Error cargando perfil XP:', error);
            // Renderizar nivel por defecto en lugar de spinner infinito
            renderLevel();
        }
    }

    function renderLevel() {
        const container = document.getElementById('iacoins-level');
        if (!container) return;

        const xpData = state.xpProfile || {};
        const currentLevel = xpData.current_level || (state.balance ? state.balance.level : 1);
        const currentXP = xpData.current_xp || (state.balance ? state.balance.experience_points : 0);

        const title = xpData.level_title || 'Novato';
        const nextReq = xpData.next_level_xp_req || 100;

        // Calcular porcentaje visual (simple: current / next)
        let visualProgress = 0;
        if (nextReq > 0) {
            visualProgress = Math.min((currentXP / nextReq) * 100, 100);
        }

        container.innerHTML = `
            <div class="level-card">
                <div class="level-badge">
                    <span class="level-number">${currentLevel}</span>
                </div>
                <div class="level-info">
                    <h4 class="level-title">${title}</h4>
                    <div class="xp-progress">
                        <div class="progress" style="height: 10px;">
                            <div class="progress-bar bg-warning" role="progressbar" 
                                 style="width: ${visualProgress}%" 
                                 aria-valuenow="${visualProgress}" aria-valuemin="0" aria-valuemax="100">
                            </div>
                        </div>
                        <span class="xp-text">
                            ${currentXP} XP <span class="text-muted small">/ ${nextReq} (Siguiente)</span>
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    // =========================================
    // STREAK SYSTEM (Semana 1)
    // =========================================
    async function loadStreak() {
        try {
            // Decodificar JWT para obtener userId (frontend simple)
            const token = sessionStorage.getItem('bge_auth_token') || localStorage.getItem('bge_auth_token');
            if (!token) {
                const container = document.getElementById('streak-counter-container');
                if (container) container.innerHTML = '<div class="streak-card"><div class="streak-days">0</div><div class="streak-label">Racha Diaria</div></div>';
                return;
            }

            // Decodificar payload (base64)
            const payload = JSON.parse(atob(token.split('.')[1]));
            const userId = payload.id;

            const result = await fetchWithAuth(`/gamification-ext/streaks/${userId}`);

            if (result.success) {
                state.streak = result.data;
                renderStreak();
            } else {
                throw new Error('API returned success: false');
            }
        } catch (error) {
            console.error('[IACOINS] Error cargando racha:', error);
            // Mostrar racha 0 en lugar de spinner infinito
            const container = document.getElementById('streak-counter-container');
            if (container) {
                container.innerHTML = `
                    <div class="streak-card">
                        <div class="streak-fire-container text-center">
                            <i class="streak-fire fas fa-fire text-muted"></i>
                        </div>
                        <div class="streak-days">0</div>
                        <div class="streak-label">Racha Diaria</div>
                    </div>
                `;
            }
        }
    }

    function renderStreak() {
        const container = document.getElementById('streak-counter-container');
        if (!container || !state.streak) return;

        const { current_streak, streak_frozen } = state.streak;

        // Icono: Fuego si activa, Hielo si congelada
        const iconClass = streak_frozen ? 'streak-frozen fas fa-snowflake' : 'streak-fire fas fa-fire';
        const label = streak_frozen ? 'Racha Congelada' : 'Racha Diaria';

        container.innerHTML = `
            <div class="streak-card">
                <div class="streak-fire-container text-center">
                    <i class="${iconClass}"></i>
                </div>
                <div class="streak-days">${current_streak}</div>
                <div class="streak-label">${label}</div>
            </div>
        `;
    }

    // =========================================
    // PERSONALITY PROFILE (Semana 9)
    // =========================================
    async function checkPersonalityProfile() {
        try {
            // El endpoint está bajo /api/ai/hyper
            // Adaptar fetchWithAuth para urls absolutas o relativas diferentes a CONFIG.API_BASE
            const token = sessionStorage.getItem('bge_auth_token') || localStorage.getItem('bge_auth_token');
            if (!token) return;

            const response = await fetch('/api/ai/v1/process', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    intent: 'PERSONALITY',
                    payload: { action: 'get_profile' }
                })
            });

            if (response.ok) {
                const json = await response.json();
                const banner = document.getElementById('ai-assessment-promo');

                // Si no tiene perfil (data es null o vacío) => Mostrar Banner
                // Si tiene perfil => Mantener oculto
                if (banner) {
                    if (json.success && !json.data) {
                        banner.classList.remove('d-none');
                        // Animation entrance
                        banner.classList.add('fade-in-up');
                    } else {
                        banner.classList.add('d-none');
                    }
                }
            }
        } catch (error) {
            console.warn('[IACOINS] Error checking personality profile:', error);
        }
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
        checkPersonalityProfile,
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
