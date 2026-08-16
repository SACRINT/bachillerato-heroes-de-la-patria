/**
 * Leaderboard Viewer Logic
 * Salón de la Fama y clasificaciones
 */
(function () {
    'use strict';

    let currentTab = 'global';
    let currentUserUsername = 'samuelci6377';

    const MOCK_LEADERBOARDS = {
        global: [
            { rank: 1, username: 'samuelci6377 (Admin)', total_xp: 3450, level: 10, title: 'Gran Maestro BGE', avatar_icon: '👑' },
            { rank: 2, username: 'valeria_herrera', total_xp: 2890, level: 9, title: 'Sabio Ilustre', avatar_icon: '🌟' },
            { rank: 3, username: 'carlos_mendoza', total_xp: 2420, level: 8, title: 'Investigador Élite', avatar_icon: '⚡' },
            { rank: 4, username: 'sofia_montes', total_xp: 1980, level: 7, title: 'Explorador Mayor', avatar_icon: '🔬' },
            { rank: 5, username: 'diego_sanchez', total_xp: 1650, level: 6, title: 'Estudiante Destacado', avatar_icon: '📚' },
            { rank: 6, username: 'camila_mendez', total_xp: 1420, level: 5, title: 'Aprendiz Avanzado', avatar_icon: '🎯' },
            { rank: 7, username: 'mateo_ramirez', total_xp: 1200, level: 4, title: 'Pensador Crítico', avatar_icon: '🧠' }
        ],
        streak: [
            { rank: 1, username: 'samuelci6377 (Admin)', current_streak: 18, level: 10, title: 'Constancia Imparable', avatar_icon: '🔥' },
            { rank: 2, username: 'valeria_herrera', current_streak: 14, level: 9, title: 'En Llamas', avatar_icon: '🔥' },
            { rank: 3, username: 'mateo_ramirez', current_streak: 11, level: 4, title: 'Dedicación Continua', avatar_icon: '⚡' },
            { rank: 4, username: 'sofia_montes', current_streak: 9, level: 7, title: 'Estudiante Puntual', avatar_icon: '🌟' },
            { rank: 5, username: 'carlos_mendoza', current_streak: 7, level: 8, title: 'Semana Perfecta', avatar_icon: '🚀' }
        ],
        weekly: [
            { rank: 1, username: 'valeria_herrera', total_xp: 750, level: 9, title: 'Campeón Semanal', avatar_icon: '🏆' },
            { rank: 2, username: 'samuelci6377 (Admin)', total_xp: 680, level: 10, title: 'Subcampeón Semanal', avatar_icon: '🥈' },
            { rank: 3, username: 'camila_mendez', total_xp: 520, level: 5, title: 'Tercer Puesto', avatar_icon: '🥉' },
            { rank: 4, username: 'diego_sanchez', total_xp: 410, level: 6, title: 'Top 5', avatar_icon: '⭐' }
        ]
    };

    function getStoredToken() {
        return sessionStorage.getItem('bge_auth_token') ||
               localStorage.getItem('bge_auth_token') ||
               sessionStorage.getItem('authToken') ||
               localStorage.getItem('authToken') || '';
    }

    async function init() {
        const token = getStoredToken();
        if (token) {
            try {
                const parts = token.split('.');
                if (parts.length === 3) {
                    const payload = JSON.parse(atob(parts[1]));
                    if (payload.username || payload.email) {
                        currentUserUsername = payload.username || payload.email.split('@')[0];
                    }
                }
            } catch (e) {}
        }

        setupTabs();
        await loadLeaderboard(currentTab);
    }

    function setupTabs() {
        document.querySelectorAll('.lb-tab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                if (!type) return;

                document.querySelectorAll('.lb-tab').forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-selected', 'false');
                });
                e.target.classList.add('active');
                e.target.setAttribute('aria-selected', 'true');

                currentTab = type;
                loadLeaderboard(type);
            });
        });
    }

    async function loadLeaderboard(type) {
        const list = document.getElementById('leaderboard-list');
        list.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>';

        let ranking = MOCK_LEADERBOARDS[type] || MOCK_LEADERBOARDS.global;

        const token = getStoredToken();
        const endpoint = type === 'streak'
            ? '/api/gamification-ext/leaderboard/streaks'
            : '/api/gamification-ext/leaderboard/global';

        if (token) {
            try {
                const res = await fetch(endpoint, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const json = await res.json();
                    if (json.success && Array.isArray(json.data) && json.data.length > 0) {
                        ranking = json.data;
                    }
                }
            } catch (error) {}
        }

        renderList(ranking, type);
    }

    function renderList(data, type) {
        const list = document.getElementById('leaderboard-list');
        if (!list) return;
        list.innerHTML = '';

        let items = Array.isArray(data) ? data : (data?.leaderboard || data?.ranking || data?.items || MOCK_LEADERBOARDS.global);

        const template = document.getElementById('lb-item-template');
        if (!template) return;

        items.forEach((entry, index) => {
            const clone = template.content.cloneNode(true);
            const li = clone.querySelector('.lb-item');

            const rank = entry.rank || (index + 1);
            const rankEl = clone.querySelector('.lb-rank');
            rankEl.textContent = rank;

            if (rank === 1) rankEl.classList.add('gold');
            else if (rank === 2) rankEl.classList.add('silver');
            else if (rank === 3) rankEl.classList.add('bronze');

            clone.querySelector('.lb-username').textContent = entry.username;

            if (type === 'streak') {
                clone.querySelector('.lb-meta').textContent = `Nivel ${entry.level || 1} • ${entry.title || 'Racha Imbatible'}`;
                clone.querySelector('.lb-score-value').textContent = entry.current_streak || 0;
                clone.querySelector('.lb-score-label').textContent = 'DÍAS 🔥';
            } else {
                clone.querySelector('.lb-meta').textContent = `Nivel ${entry.level || 1} • ${entry.title || 'Estudiante Destacado'}`;
                const xpValue = entry.total_xp || entry.xp || entry.score || 0;
                clone.querySelector('.lb-score-value').textContent = xpValue.toLocaleString();
                clone.querySelector('.lb-score-label').textContent = 'XP TOTAL';
            }

            const base = clone.querySelector('.lb-base');
            if (base) {
                base.textContent = entry.avatar_icon || '🎓';
                base.style.fontSize = '24px';
                base.style.display = 'flex';
                base.style.alignItems = 'center';
                base.style.justifyContent = 'center';
            }

            if (entry.username && entry.username.includes('samuelci6377')) {
                li.classList.add('current-user');
                li.style.border = '2px solid #fbbf24';
            }

            list.appendChild(clone);
        });
    }

    document.addEventListener('DOMContentLoaded', init);
})();
