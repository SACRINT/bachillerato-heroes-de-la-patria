/**
 * Tournaments Viewer
 */
(function () {
    'use strict';

    const token = sessionStorage.getItem('bge_auth_token') || localStorage.getItem('bge_auth_token');

    async function init() {
        if (!token) {
            window.location.href = 'index.html';
            return;
        }
        await loadTournaments();
    }

    async function loadTournaments() {
        const container = document.getElementById('tournaments-list');
        try {
            const res = await fetch('/api/gamification-ext/tournaments', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();

            if (json.success) {
                renderTournaments(json.data);
            } else {
                container.innerHTML = `<div class="alert alert-danger">${json.error}</div>`;
            }
        } catch (e) {
            console.error(e);
            container.innerHTML = `<div class="alert alert-danger">Error de conexión</div>`;
        }
    }

    function renderTournaments(list) {
        const container = document.getElementById('tournaments-list');
        if (!container) return;
        container.innerHTML = '';

        let items = Array.isArray(list) ? list : (list?.tournaments || list?.data || []);

        if (items.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5 t-card">
                    <h3 class="text-muted">No hay torneos activos</h3>
                    <p class="text-muted">Vuelve pronto para nuevos desafíos.</p>
                </div>`;
            return;
        }

        items.forEach(t => {
            const div = document.createElement('div');
            div.className = 't-card';

            // Dates
            const start = new Date(t.start_date).toLocaleDateString();
            const end = new Date(t.end_date).toLocaleDateString();

            // Action Button Logic
            let actionHtml = '';
            if (t.is_participant) {
                actionHtml = `
                    <div class="d-flex align-items-center gap-3">
                        <span class="my-score-display">
                            <i class="fas fa-star me-1"></i> Mi Puntaje: ${t.my_score}
                        </span>
                        <button class="btn btn-outline-light btn-sm" onclick="showLeaderboard(${t.id})">
                            <i class="fas fa-list"></i> Ver Ranking
                        </button>
                    </div>
                `;
            } else {
                actionHtml = `
                    <button class="btn btn-danger" onclick="joinTournament(${t.id})">
                        <i class="fas fa-plus-circle me-1"></i> Unirse al Torneo
                    </button>
                `;
            }

            const defaultBanner = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='300' viewBox='0 0 800 300'><defs><linearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%234f46e5'/><stop offset='100%25' stop-color='%231e1b4b'/></linearGradient></defs><rect width='800' height='300' fill='url(%23g)'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='40' font-weight='bold' fill='%23fbbf24'>🏆 TORNEO BGE</text></svg>";
            const bannerSrc = t.image_banner_url || defaultBanner;

            div.innerHTML = `
                <div class="t-banner">
                    <img src="${bannerSrc}" alt="Banner" onerror="this.src='${defaultBanner}'">
                    <span class="t-status-badge">${t.status === 'upcoming' ? 'Próximamente' : 'En Curso'}</span>
                </div>
                <div class="t-body">
                    <h3 class="t-title">${t.title}</h3>
                    <div class="t-meta">
                        <span><i class="far fa-calendar-alt"></i> ${start} - ${end}</span>
                        <span><i class="fas fa-users"></i> Abierto a todos</span>
                    </div>
                    <p class="t-description">${t.description}</p>
                </div>
                <div class="t-footer">
                    ${actionHtml}
                </div>
            `;
            container.appendChild(div);
        });
    }

    // Global Functions for buttons
    window.joinTournament = async (id) => {
        if (!confirm('¿Deseas unirte a este torneo?')) return;

        try {
            const res = await fetch(`/api/gamification-ext/tournaments/${id}/join`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const json = await res.json();

            if (json.success) {
                alert('¡Te has unido exitosamente!');
                loadTournaments(); // Refresh UI
            } else {
                alert(json.error);
            }
        } catch (e) {
            alert('Error al unirse');
        }
    };

    window.showLeaderboard = async (id) => {
        const modalEl = document.getElementById('tournamentLbModal');
        const modal = new bootstrap.Modal(modalEl);
        const content = document.getElementById('modal-lb-content');
        content.innerHTML = '<div class="text-center p-4"><div class="spinner-border text-primary"></div></div>';

        modal.show();

        try {
            const res = await fetch(`/api/gamification-ext/tournaments/${id}/leaderboard?limit=20`);
            const json = await res.json();

            if (json.success) {
                if (json.data.length === 0) {
                    content.innerHTML = '<div class="p-4 text-center text-muted">Aún no hay participantes clasificados.</div>';
                    return;
                }

                const html = json.data.map((p, idx) => `
                    <div class="list-group-item bg-transparent text-light border-secondary d-flex align-items-center justify-content-between">
                        <div class="d-flex align-items-center gap-3">
                            <span class="fw-bold fs-5 text-muted" style="width: 30px;">#${idx + 1}</span>
                            <img src="${p.avatar_url}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
                            <div>
                                <div class="fw-bold">${p.username}</div>
                                <div class="small text-muted">${p.role}</div>
                            </div>
                        </div>
                        <div class="fw-bold text-warning fs-5">${p.current_score} pts</div>
                    </div>
                `).join('');
                content.innerHTML = html;
            }
        } catch (e) {
            content.innerHTML = '<div class="p-4 text-danger">Error cargando ranking.</div>';
        }
    };

    document.addEventListener('DOMContentLoaded', init);

})();
