/**
 * Tournaments Viewer
 * Gestión y visualización de torneos académicos
 */
(function () {
    'use strict';

    const FALLBACK_TOURNAMENTS = [
        {
            id: 101,
            title: '🏆 Gran Torneo de Ciencias y Matemáticas 2026',
            description: 'Compite resolviendo retos de cálculo, álgebra y física cuántica para ganar hasta 500 IACoins y medallas exclusivas.',
            status: 'active',
            start_date: new Date(Date.now() - 86400000 * 2).toISOString(),
            end_date: new Date(Date.now() + 86400000 * 5).toISOString(),
            is_participant: true,
            my_score: 340,
            image_banner_url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='300' viewBox='0 0 800 300'><defs><linearGradient id='g1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%234f46e5'/><stop offset='100%25' stop-color='%23064e3b'/></linearGradient></defs><rect width='800' height='300' fill='url(%23g1)'/><text x='50%25' y='45%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='38' font-weight='bold' fill='%23fbbf24'>📐 TORNEO DE CIENCIAS</text><text x='50%25' y='65%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%23ffffff' opacity='0.9'>Edición Primavera 2026 • 500 IACoins en Premios</text></svg>"
        },
        {
            id: 102,
            title: '📜 Desafío Histórico BGE: Centenario Constitucional',
            description: 'Demuestra tu conocimiento sobre las revoluciones, pactos y transformaciones sociopolíticas de México y el mundo.',
            status: 'active',
            start_date: new Date(Date.now() - 86400000).toISOString(),
            end_date: new Date(Date.now() + 86400000 * 8).toISOString(),
            is_participant: false,
            my_score: 0,
            image_banner_url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='300' viewBox='0 0 800 300'><defs><linearGradient id='g2' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%23b45309'/><stop offset='100%25' stop-color='%2378350f'/></linearGradient></defs><rect width='800' height='300' fill='url(%23g2)'/><text x='50%25' y='45%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='38' font-weight='bold' fill='%23fbbf24'>⚔️ DESAFÍO HISTÓRICO BGE</text><text x='50%25' y='65%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%23ffffff' opacity='0.9'>Mundo Contemporáneo e Historia Patria</text></svg>"
        },
        {
            id: 103,
            title: '🤖 Hackathon Virtual de Programación e IA',
            description: 'Diseña algoritmos, estructuras de datos y modelos lógicos para optimizar soluciones comunitarias.',
            status: 'upcoming',
            start_date: new Date(Date.now() + 86400000 * 3).toISOString(),
            end_date: new Date(Date.now() + 86400000 * 12).toISOString(),
            is_participant: false,
            my_score: 0,
            image_banner_url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='300' viewBox='0 0 800 300'><defs><linearGradient id='g3' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%237c3aed'/><stop offset='100%25' stop-color='%230f172a'/></linearGradient></defs><rect width='800' height='300' fill='url(%23g3)'/><text x='50%25' y='45%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='38' font-weight='bold' fill='%2338bdf8'>💻 HACKATHON VIRTUAL IA</text><text x='50%25' y='65%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%23ffffff' opacity='0.9'>Compite por el Gran Trofeo Tecnológico BGE</text></svg>"
        }
    ];

    const FALLBACK_LEADERBOARDS = {
        101: [
            { rank: 1, username: 'samuelci6377 (Admin)', score: 480, avatar_url: '' },
            { rank: 2, username: 'mateo_ramirez', score: 420, avatar_url: '' },
            { rank: 3, username: 'valeria_herrera', score: 390, avatar_url: '' },
            { rank: 4, username: 'diego_sanchez', score: 350, avatar_url: '' },
            { rank: 5, username: 'sofia_montes', score: 310, avatar_url: '' }
        ],
        102: [
            { rank: 1, username: 'camila_mendez', score: 450, avatar_url: '' },
            { rank: 2, username: 'samuelci6377 (Admin)', score: 380, avatar_url: '' },
            { rank: 3, username: 'roberto_gomez', score: 340, avatar_url: '' }
        ],
        103: [
            { rank: 1, username: 'alan_turing_fan', score: 500, avatar_url: '' },
            { rank: 2, username: 'claudia_tech', score: 460, avatar_url: '' }
        ]
    };

    function getStoredToken() {
        return sessionStorage.getItem('bge_auth_token') ||
               localStorage.getItem('bge_auth_token') ||
               sessionStorage.getItem('authToken') ||
               localStorage.getItem('authToken') || '';
    }

    async function init() {
        await loadTournaments();
    }

    async function loadTournaments() {
        const container = document.getElementById('tournaments-list');
        const token = getStoredToken();

        let tournaments = FALLBACK_TOURNAMENTS;

        // Apply local joins
        const localJoined = JSON.parse(localStorage.getItem('bge_joined_tournaments') || '[]');
        tournaments.forEach(t => {
            if (localJoined.includes(t.id)) {
                t.is_participant = true;
                if (!t.my_score) t.my_score = 100;
            }
        });

        if (token) {
            try {
                const res = await fetch('/api/gamification-ext/tournaments', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const json = await res.json();
                    if (json.success && Array.isArray(json.data) && json.data.length > 0) {
                        tournaments = json.data;
                    }
                }
            } catch (e) {}
        }

        renderTournaments(tournaments);
    }

    function renderTournaments(list) {
        const container = document.getElementById('tournaments-list');
        if (!container) return;
        container.innerHTML = '';

        let items = Array.isArray(list) ? list : (list?.tournaments || list?.data || FALLBACK_TOURNAMENTS);

        if (items.length === 0) {
            items = FALLBACK_TOURNAMENTS;
        }

        items.forEach(t => {
            const div = document.createElement('div');
            div.className = 't-card mb-4';

            const start = new Date(t.start_date).toLocaleDateString();
            const end = new Date(t.end_date).toLocaleDateString();

            let actionHtml = '';
            if (t.is_participant) {
                actionHtml = `
                    <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 w-100">
                        <span class="my-score-display badge bg-success fs-6 py-2 px-3">
                            <i class="fas fa-star text-warning me-1"></i> Mi Puntaje: ${t.my_score || 0} pts
                        </span>
                        <div class="d-flex gap-2">
                            <a href="duelo-sabiduria.html" class="btn btn-warning btn-sm fw-bold">
                                <i class="fas fa-play me-1"></i> Jugar Ronda
                            </a>
                            <button class="btn btn-outline-light btn-sm" onclick="window.showLeaderboard(${t.id})">
                                <i class="fas fa-list-ol me-1"></i> Ver Ranking
                            </button>
                        </div>
                    </div>
                `;
            } else {
                actionHtml = `
                    <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 w-100">
                        <button class="btn btn-danger" onclick="window.joinTournament(${t.id})">
                            <i class="fas fa-plus-circle me-1"></i> Inscribirme al Torneo
                        </button>
                        <button class="btn btn-outline-light btn-sm" onclick="window.showLeaderboard(${t.id})">
                            <i class="fas fa-list-ol me-1"></i> Ver Ranking
                        </button>
                    </div>
                `;
            }

            const defaultBanner = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='300' viewBox='0 0 800 300'><defs><linearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%234f46e5'/><stop offset='100%25' stop-color='%231e1b4b'/></linearGradient></defs><rect width='800' height='300' fill='url(%23g)'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='40' font-weight='bold' fill='%23fbbf24'>🏆 TORNEO BGE</text></svg>";
            const bannerSrc = t.image_banner_url || defaultBanner;

            div.innerHTML = `
                <div class="t-banner">
                    <img src="${bannerSrc}" alt="Banner" onerror="this.src='${defaultBanner}'" style="width:100%;height:180px;object-fit:cover;border-radius:12px 12px 0 0;">
                    <span class="t-status-badge badge ${t.status === 'upcoming' ? 'bg-info' : 'bg-success'}">${t.status === 'upcoming' ? 'Próximamente' : 'En Curso'}</span>
                </div>
                <div class="t-body p-4 bg-dark text-light">
                    <h3 class="t-title fw-bold text-warning mb-2">${t.title}</h3>
                    <div class="t-meta text-muted mb-3 d-flex gap-3 small">
                        <span><i class="far fa-calendar-alt me-1"></i> ${start} - ${end}</span>
                        <span><i class="fas fa-users me-1"></i> Abierto a todos los semestres</span>
                    </div>
                    <p class="t-description text-light opacity-90">${t.description}</p>
                </div>
                <div class="t-footer p-3 bg-dark border-top border-secondary">
                    ${actionHtml}
                </div>
            `;
            container.appendChild(div);
        });
    }

    // Global Functions for buttons
    window.joinTournament = async (id) => {
        if (!confirm('¿Deseas inscribirte a este torneo académico?')) return;

        const token = getStoredToken();
        if (token) {
            try {
                await fetch(`/api/gamification-ext/tournaments/${id}/join`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            } catch (e) {}
        }

        // Store local participation
        const localJoined = JSON.parse(localStorage.getItem('bge_joined_tournaments') || '[]');
        if (!localJoined.includes(id)) {
            localJoined.push(id);
            localStorage.setItem('bge_joined_tournaments', JSON.stringify(localJoined));
        }

        alert('🎉 ¡Te has inscrito exitosamente al torneo!
Comienza a acumular puntos jugando duelos de sabiduría y desafíos.');
        await loadTournaments();
    };

    window.showLeaderboard = async (id) => {
        const modalEl = document.getElementById('tournamentLbModal');
        const modal = new bootstrap.Modal(modalEl);
        const content = document.getElementById('modal-lb-content');
        content.innerHTML = '<div class="text-center p-4"><div class="spinner-border text-primary"></div></div>';

        modal.show();

        let ranking = FALLBACK_LEADERBOARDS[id] || FALLBACK_LEADERBOARDS[101];

        const token = getStoredToken();
        if (token) {
            try {
                const res = await fetch(`/api/gamification-ext/tournaments/${id}/leaderboard?limit=20`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const json = await res.json();
                    if (json.success && Array.isArray(json.data) && json.data.length > 0) {
                        ranking = json.data;
                    }
                }
            } catch (e) {}
        }

        const html = ranking.map((p, idx) => `
            <div class="list-group-item bg-dark text-light border-secondary d-flex align-items-center justify-content-between p-3">
                <div class="d-flex align-items-center gap-3">
                    <span class="badge ${idx === 0 ? 'bg-warning text-dark' : idx === 1 ? 'bg-light text-dark' : idx === 2 ? 'bg-danger text-light' : 'bg-secondary'} fs-6 rounded-circle px-2 py-1" style="width:28px;text-align:center;">
                        ${idx + 1}
                    </span>
                    <div>
                        <span class="fw-bold">${p.username}</span>
                    </div>
                </div>
                <div class="badge bg-primary fs-6 px-3 py-2">
                    ${p.score} pts
                </div>
            </div>
        `).join('');

        content.innerHTML = html;
    };

    document.addEventListener('DOMContentLoaded', init);
})();
