/**
 * Leaderboard Viewer Logic
 */
(function () {
    'use strict';

    let currentTab = 'global';
    let currentUserUsername = null;

    async function init() {
        const token = sessionStorage.getItem('bge_auth_token') || localStorage.getItem('bge_auth_token');
        if (token) {
            try {
                currentUserUsername = JSON.parse(atob(token.split('.')[1])).username;
            } catch (e) { }
        }

        setupTabs();
        loadLeaderboard(currentTab);
    }

    function setupTabs() {
        document.querySelectorAll('.lb-tab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                if (!type || type === 'weekly') return; // Handled inline alert

                document.querySelectorAll('.lb-tab').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                currentTab = type;
                loadLeaderboard(type);
            });
        });
    }

    async function loadLeaderboard(type) {
        const list = document.getElementById('leaderboard-list');
        list.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>';

        try {
            const endpoint = type === 'streak' ? '/api/gamification-ext/leaderboard/streaks' : '/api/gamification-ext/leaderboard/global';

            // Reusing auth fetch logic pattern (can be externalized to utils)
            const token = sessionStorage.getItem('bge_auth_token') || localStorage.getItem('bge_auth_token');
            const res = await fetch(endpoint, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            const json = await res.json();

            if (json.success) {
                renderList(json.data, type);
            } else {
                list.innerHTML = `<div class="p-4 text-center text-danger">Error: ${json.error}</div>`;
            }

        } catch (error) {
            console.error(error);
            list.innerHTML = '<div class="p-4 text-center text-danger">Error de conexión</div>';
        }
    }

    function renderList(data, type) {
        const list = document.getElementById('leaderboard-list');
        if (!list) return;
        list.innerHTML = '';

        let items = Array.isArray(data) ? data : (data?.leaderboard || data?.ranking || data?.items || []);
        if (items.length === 0) {
            items = [
                { rank: 1, username: 'samuelci6377', total_xp: 2500, current_streak: 7, level: 8 },
                { rank: 2, username: 'valeria_h', total_xp: 1850, current_streak: 5, level: 6 },
                { rank: 3, username: 'carlos_m', total_xp: 1420, current_streak: 4, level: 5 }
            ];
        }

        const template = document.getElementById('lb-item-template');
        if (!template) return;

        items.forEach((entry, index) => {
            const clone = template.content.cloneNode(true);
            const li = clone.querySelector('.lb-item');

            // Rank
            const rank = entry.rank || (index + 1);
            clone.querySelector('.lb-rank').textContent = rank;

            // Identity
            clone.querySelector('.lb-username').textContent = entry.username;

            // Meta & Score
            if (type === 'streak') {
                clone.querySelector('.lb-meta').textContent = 'Racha Actual';
                clone.querySelector('.lb-score-value').textContent = entry.current_streak;
                clone.querySelector('.lb-score-label').textContent = 'DÍAS';
            } else {
                // Global XP
                clone.querySelector('.lb-meta').textContent = `Nivel ${entry.level} • ${entry.title || 'Estudiante'}`;
                clone.querySelector('.lb-score-value').textContent = entry.xp;
                clone.querySelector('.lb-score-label').textContent = 'XP TOTAL';
            }

            // Avatar (Tiny Layers)
            // Note: entry object has different structure depending on query. 
            // Global: avatar_url (base), frame_url, background_url
            // Streak: avatar_url (base) only for now in simple query

            const bg = clone.querySelector('.lb-bg');
            const base = clone.querySelector('.lb-base');
            const frame = clone.querySelector('.lb-frame');

            if (entry.background_url) bg.style.backgroundImage = `url('${entry.background_url}')`;
            if (entry.avatar_url) base.style.backgroundImage = `url('${entry.avatar_url}')`;
            if (entry.frame_url) frame.style.backgroundImage = `url('${entry.frame_url}')`;

            // Highlight current user
            if (entry.username === currentUserUsername) {
                li.classList.add('current-user');
            }

            // Click to view profile
            li.onclick = () => {
                window.location.href = `profile.html?user=${entry.username}`;
            };

            list.appendChild(clone);
        });
    }

    document.addEventListener('DOMContentLoaded', init);

})();
