/**
 * 🎴 FLASHCARDS CLIENT - FSRS v4 ENGINE INTERACTION
 * Fase 6 - Objetivo 4: Flashcards Mnemotécnicas para el BGE Héroes de la Patria
 * 
 * Lógica del cliente interactivo con:
 * - 3D Flip Card con perspectiva realista
 * - Atajos de teclado: Espacio para girar, 1-4 para calificar, H para pistas, Esc para salir
 * - Animación de IA Coins flotantes (+2 por repaso, +10 por racha)
 * - Sincronización con FSRS v4 backend y Neon PostgreSQL
 */

class FlashcardsApp {
    constructor() {
        this.apiBase = '/api/flashcards';
        this.decks = [];
        this.currentDeck = null;
        this.studyCards = [];
        this.currentIndex = 0;
        this.isFlipped = false;
        this.isRatingInProgress = false;
        this.activeSubjectFilter = 'all';
        this.timerInterval = null;
        this.sessionSeconds = 0;

        // Atributos de Usuario
        this.token = this.getToken();
        this.userStats = {
            streak_days: 0,
            reviews_today: 0,
            estimated_retention_pct: 90,
            total_cards_reviewed: 0
        };
    }

    getToken() {
        return localStorage.getItem('bge_auth_token') ||
               localStorage.getItem('token') ||
               localStorage.getItem('authToken') ||
               sessionStorage.getItem('bge_auth_token') ||
               sessionStorage.getItem('token') ||
               null;
    }

    getAuthHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    async init() {
        this.cacheDom();
        this.bindEvents();
        this.setupDarkMode();
        this.checkAuthUI();
        await this.loadDecks();
        await this.loadUserStats();
        await this.checkDueGlobalCount();
    }

    cacheDom() {
        // Vistas
        this.deckBrowserView = document.getElementById('deckBrowserView');
        this.studySessionView = document.getElementById('studySessionView');
        this.deckCompletedView = document.getElementById('deckCompletedView');
        this.decksGridContainer = document.getElementById('decksGridContainer');

        // Métricas
        this.statStreakEl = document.getElementById('statStreak');
        this.statReviewsTodayEl = document.getElementById('statReviewsToday');
        this.statRetentionEl = document.getElementById('statRetention');
        this.countAllDueEl = document.getElementById('countAllDue');
        this.userAuthNameEl = document.getElementById('userAuthName');

        // Escenario 3D
        this.flashcardScene = document.getElementById('flashcardScene');
        this.flashcardInner = document.getElementById('flashcardInner');
        this.cardSubjectBadge = document.getElementById('cardSubjectBadge');
        this.cardFrontText = document.getElementById('cardFrontText');
        this.cardBackText = document.getElementById('cardBackText');
        this.cardHintBox = document.getElementById('cardHintBox');
        this.cardHintText = document.getElementById('cardHintText');
        this.btnToggleHint = document.getElementById('btnToggleHint');
        this.cardFSRSDueInfo = document.getElementById('cardFSRSDueInfo');

        // Controles de Estudio
        this.studyCardCounter = document.getElementById('studyCardCounter');
        this.studyProgressBar = document.getElementById('studyProgressBar');
        this.studyTimer = document.getElementById('studyTimer');
        this.ratingControls = document.getElementById('ratingControls');
        this.btnExitStudy = document.getElementById('btnExitStudy');
        this.btnFinishSession = document.getElementById('btnFinishSession');
        this.btnStudyAllDue = document.getElementById('btnStudyAllDue');

        // Filtros y Modal
        this.subjectFilterBar = document.getElementById('subjectFilterBar');
        this.formGenerateDeck = document.getElementById('formGenerateDeck');
        this.genSubjectSelect = document.getElementById('genSubjectSelect');
        this.genDeckTitle = document.getElementById('genDeckTitle');
        this.btnSubmitGenerate = document.getElementById('btnSubmitGenerate');
        this.generateDeckModalEl = document.getElementById('generateDeckModal');
    }

    bindEvents() {
        // Volteo de tarjeta por clic
        if (this.flashcardInner) {
            this.flashcardInner.addEventListener('click', () => this.toggleFlip());
        }

        // Mostrar / ocultar pista
        if (this.btnToggleHint) {
            this.btnToggleHint.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleHint();
            });
        }

        // Botones de Calificación FSRS v4 (1: Again, 2: Hard, 3: Good, 4: Easy)
        const gradeButtons = document.querySelectorAll('.btn-grade');
        gradeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const grade = parseInt(btn.getAttribute('data-grade'));
                this.rateCard(grade, e);
            });
        });

        // Atajos de Teclado Globales
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Salir del modo estudio
        if (this.btnExitStudy) {
            this.btnExitStudy.addEventListener('click', () => this.exitStudySession());
        }
        if (this.btnFinishSession) {
            this.btnFinishSession.addEventListener('click', () => this.exitStudySession());
        }

        // Repasar todas las tarjetas pendientes
        if (this.btnStudyAllDue) {
            this.btnStudyAllDue.addEventListener('click', () => this.studyAllDueCards());
        }

        // Filtro por materias
        if (this.subjectFilterBar) {
            this.subjectFilterBar.addEventListener('click', (e) => {
                const chip = e.target.closest('.filter-chip');
                if (chip) {
                    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                    this.activeSubjectFilter = chip.getAttribute('data-subject');
                    this.filterDecks();
                }
            });
        }

        // Formulario Generar Mazo
        if (this.formGenerateDeck) {
            this.formGenerateDeck.addEventListener('submit', (e) => this.handleGenerateDeck(e));
        }
    }

    setupDarkMode() {
        const toggleBtn = document.getElementById('darkModeToggle');
        const currentTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', currentTheme);
        if (currentTheme === 'dark') document.body.classList.add('dark-mode');

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
                const nextTheme = isDark ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', nextTheme);
                document.body.classList.toggle('dark-mode', nextTheme === 'dark');
                localStorage.setItem('theme', nextTheme);
                toggleBtn.innerHTML = nextTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
            });
            toggleBtn.innerHTML = currentTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        }
    }

    checkAuthUI() {
        const token = this.getToken();
        if (token && this.userAuthNameEl) {
            try {
                // Decodificar payload básico
                const payload = JSON.parse(atob(token.split('.')[1]));
                const name = payload.username || payload.nombre || payload.email || 'Estudiante BGE';
                this.userAuthNameEl.innerHTML = `<i class="fas fa-user-check me-1 text-success"></i>${name}`;
            } catch (e) {
                this.userAuthNameEl.innerHTML = `<i class="fas fa-user-graduate me-1"></i>Estudiante BGE`;
            }
        }
    }

    handleKeyboardShortcuts(e) {
        // Ignorar si el usuario está escribiendo en un input o textarea
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
            return;
        }

        // Solo procesar si estamos en sesión de estudio activa
        if (this.studySessionView.style.display !== 'block') {
            return;
        }

        // Espacio: Voltear la tarjeta
        if (e.code === 'Space') {
            e.preventDefault();
            this.toggleFlip();
            return;
        }

        // Tecla H: Mostrar pista
        if (e.key === 'h' || e.key === 'H') {
            e.preventDefault();
            this.toggleHint();
            return;
        }

        // Escape: Volver al explorador
        if (e.key === 'Escape') {
            e.preventDefault();
            this.exitStudySession();
            return;
        }

        // Calificaciones 1 a 4
        if (['1', '2', '3', '4'].includes(e.key)) {
            e.preventDefault();
            const grade = parseInt(e.key);
            this.rateCard(grade);
        }
    }

    toggleFlip() {
        this.isFlipped = !this.isFlipped;
        if (this.flashcardInner) {
            this.flashcardInner.classList.toggle('is-flipped', this.isFlipped);
        }
    }

    toggleHint() {
        if (this.cardHintBox) {
            const isHidden = this.cardHintBox.style.display === 'none' || !this.cardHintBox.style.display;
            this.cardHintBox.style.display = isHidden ? 'block' : 'none';
        }
    }

    async loadDecks() {
        try {
            const res = await fetch(`${this.apiBase}/decks`, {
                headers: this.getAuthHeaders()
            });
            const data = await res.json();
            if (data.success) {
                this.decks = data.decks;
                this.renderDecks(this.decks);
            } else {
                this.decksGridContainer.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <div class="alert alert-warning d-inline-block">
                            <i class="fas fa-exclamation-triangle me-2"></i>No se pudieron cargar los mazos.
                        </div>
                    </div>
                `;
            }
        } catch (err) {
            console.error('Error al cargar mazos:', err);
            this.decksGridContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="alert alert-danger d-inline-block">
                        <i class="fas fa-wifi me-2"></i>Error de conexión al servidor de Flashcards.
                    </div>
                </div>
            `;
        }
    }

    renderDecks(decksToRender) {
        if (!decksToRender || decksToRender.length === 0) {
            this.decksGridContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-folder-open text-muted mb-3" style="font-size: 3rem;"></i>
                    <h5 class="text-muted">No hay mazos para esta categoría</h5>
                    <p class="small text-muted">Genera un nuevo mazo curricular con el botón superior.</p>
                </div>
            `;
            return;
        }

        const subjectIcons = {
            matematicas: '📐',
            fisica: '⚡',
            quimica: '🧪',
            biologia: '🧬',
            historia: '🏛️',
            lenguaje: '📚',
            filosofia: '💡'
        };

        const html = decksToRender.map(deck => {
            const icon = subjectIcons[deck.subject] || '📖';
            const subjectLabel = deck.subject ? (deck.subject.charAt(0).toUpperCase() + deck.subject.slice(1)) : 'General';
            return `
                <div class="col-md-6 col-lg-4">
                    <div class="deck-card" onclick="window.flashcardsApp.startDeckSession(${deck.id})">
                        <div>
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <span class="subject-badge subject-${deck.subject}">
                                    ${icon} ${subjectLabel}
                                </span>
                                <span class="badge bg-light text-muted border font-monospace">
                                    ${deck.total_cards || deck.card_count || 0} tarjetas
                                </span>
                            </div>
                            <h5 class="fw-bold mb-2 text-primary">${this.escapeHtml(deck.name)}</h5>
                            <p class="text-muted small mb-4" style="line-height: 1.5;">
                                ${this.escapeHtml(deck.description || 'Mazo de estudio curricular para repaso espaciado.')}
                            </p>
                        </div>
                        <div class="d-flex justify-content-between align-items-center pt-3 border-top border-light-subtle">
                            <span class="small fw-semibold text-primary">
                                <i class="fas fa-play-circle me-1"></i>Comenzar Estudio
                            </span>
                            <span class="small text-muted font-monospace">
                                <i class="fas fa-brain me-1 text-success"></i>FSRS v4
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.decksGridContainer.innerHTML = html;
    }

    filterDecks() {
        if (this.activeSubjectFilter === 'all') {
            this.renderDecks(this.decks);
        } else {
            const filtered = this.decks.filter(d => d.subject === this.activeSubjectFilter);
            this.renderDecks(filtered);
        }
    }

    async loadUserStats() {
        const token = this.getToken();
        if (!token) return;

        try {
            const res = await fetch(`${this.apiBase}/stats`, {
                headers: this.getAuthHeaders()
            });
            const data = await res.json();
            if (data.success && data.stats) {
                this.userStats = data.stats;
                this.updateStatsUI();
            }
        } catch (e) {
            console.warn('[FSRS] No se pudieron cargar estadísticas:', e.message);
        }
    }

    updateStatsUI() {
        if (this.statStreakEl) {
            this.statStreakEl.textContent = `${this.userStats.streak_days || 0} días`;
        }
        if (this.statReviewsTodayEl) {
            this.statReviewsTodayEl.textContent = `${this.userStats.reviews_today || 0}`;
        }
        if (this.statRetentionEl) {
            this.statRetentionEl.textContent = `${this.userStats.estimated_retention_pct || 90}%`;
        }
    }

    async checkDueGlobalCount() {
        const token = this.getToken();
        if (!token) {
            if (this.countAllDueEl) this.countAllDueEl.textContent = '35';
            return;
        }
        try {
            const res = await fetch(`${this.apiBase}/due?limit=100`, {
                headers: this.getAuthHeaders()
            });
            const data = await res.json();
            if (data.success) {
                if (this.countAllDueEl) this.countAllDueEl.textContent = data.count || 0;
            }
        } catch (e) {
            // Silencioso
        }
    }

    async startDeckSession(deckId) {
        try {
            const res = await fetch(`${this.apiBase}/decks/${deckId}/cards`, {
                headers: this.getAuthHeaders()
            });
            const data = await res.json();
            if (!data.success || !data.cards || data.cards.length === 0) {
                alert('Este mazo aún no contiene tarjetas de estudio.');
                return;
            }

            this.currentDeck = this.decks.find(d => d.id === deckId) || { name: 'Mazo Curricular', subject: 'general' };
            this.studyCards = data.cards;
            this.currentIndex = 0;
            this.startStudyMode();
        } catch (err) {
            console.error('Error al iniciar sesión de mazo:', err);
            alert('Error cargando las tarjetas del mazo.');
        }
    }

    async studyAllDueCards() {
        const token = this.getToken();
        if (!token) {
            alert('Inicia sesión institucional para repasar tu cola personalizada de tarjetas pendientes.');
            return;
        }
        try {
            const res = await fetch(`${this.apiBase}/due?limit=50`, {
                headers: this.getAuthHeaders()
            });
            const data = await res.json();
            if (!data.success || !data.cards || data.cards.length === 0) {
                alert('¡Excelente trabajo! No tienes tarjetas pendientes de repaso en este momento.');
                return;
            }
            this.currentDeck = { name: 'Repaso Global de Pendientes', subject: 'all' };
            this.studyCards = data.cards;
            this.currentIndex = 0;
            this.startStudyMode();
        } catch (err) {
            alert('Error al consultar cola de pendientes.');
        }
    }

    startStudyMode() {
        this.deckBrowserView.style.display = 'none';
        this.studySessionView.style.display = 'block';
        this.deckCompletedView.style.display = 'none';

        // Iniciar temporizador
        this.sessionSeconds = 0;
        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.sessionSeconds++;
            const mins = String(Math.floor(this.sessionSeconds / 60)).padStart(2, '0');
            const secs = String(this.sessionSeconds % 60).padStart(2, '0');
            if (this.studyTimer) this.studyTimer.innerHTML = `<i class="far fa-clock me-1"></i>${mins}:${secs}`;
        }, 1000);

        this.renderCurrentCard();
    }

    exitStudySession() {
        clearInterval(this.timerInterval);
        this.studySessionView.style.display = 'none';
        this.deckBrowserView.style.display = 'block';
        this.deckCompletedView.style.display = 'none';
        this.loadUserStats();
        this.checkDueGlobalCount();
    }

    renderCurrentCard() {
        if (this.currentIndex >= this.studyCards.length) {
            this.showCompletedSession();
            return;
        }

        const card = this.studyCards[this.currentIndex];
        this.isFlipped = false;
        if (this.flashcardInner) {
            this.flashcardInner.classList.remove('is-flipped');
        }

        // Textos y pista
        if (this.cardFrontText) this.cardFrontText.textContent = card.front;
        if (this.cardBackText) this.cardBackText.textContent = card.back;
        
        if (card.hints && card.hints.trim()) {
            if (this.btnToggleHint) this.btnToggleHint.style.display = 'inline-block';
            if (this.cardHintText) this.cardHintText.textContent = card.hints;
        } else {
            if (this.btnToggleHint) this.btnToggleHint.style.display = 'none';
        }
        if (this.cardHintBox) this.cardHintBox.style.display = 'none';

        // Badge de Materia
        const subject = card.subject || this.currentDeck?.subject || 'general';
        const subjectIcons = {
            matematicas: '📐', fisica: '⚡', quimica: '🧪', biologia: '🧬',
            historia: '🏛️', lenguaje: '📚', filosofia: '💡'
        };
        const icon = subjectIcons[subject] || '📖';
        if (this.cardSubjectBadge) {
            this.cardSubjectBadge.className = `subject-badge subject-${subject}`;
            this.cardSubjectBadge.innerHTML = `${icon} ${subject.charAt(0).toUpperCase() + subject.slice(1)}`;
        }

        // Info FSRS
        if (this.cardFSRSDueInfo) {
            if (card.reps && card.reps > 0) {
                this.cardFSRSDueInfo.innerHTML = `<i class="fas fa-history me-1"></i>Repaso #${card.reps + 1} (S: ${card.stability || 2}d)`;
            } else {
                this.cardFSRSDueInfo.innerHTML = `<i class="fas fa-star me-1 text-warning"></i>Concepto Nuevo`;
            }
        }

        // Barra de progreso y contador
        const total = this.studyCards.length;
        const current = this.currentIndex + 1;
        if (this.studyCardCounter) {
            this.studyCardCounter.textContent = `Tarjeta ${current} de ${total}`;
        }
        if (this.studyProgressBar) {
            const pct = Math.round(((current - 1) / total) * 100);
            this.studyProgressBar.style.width = `${pct}%`;
        }
    }

    async rateCard(grade, eventOrigin = null) {
        if (this.isRatingInProgress) return;
        this.isRatingInProgress = true;

        const card = this.studyCards[this.currentIndex];
        if (!card) return;

        // Deshabilitar botones temporalmente durante la animación
        const buttons = document.querySelectorAll('.btn-grade');
        buttons.forEach(b => b.disabled = true);

        // Si la tarjeta no estaba volteada, mostrar primero el reverso brevemente antes de avanzar
        if (!this.isFlipped) {
            this.toggleFlip();
            await new Promise(r => setTimeout(r, 250));
        }

        // Llamada a la API con JWT Auth + Rate Limiter + Concurrent Guard
        const token = this.getToken();
        let coinsToAdd = 2;

        if (token) {
            try {
                const res = await fetch(`${this.apiBase}/review`, {
                    method: 'POST',
                    headers: this.getAuthHeaders(),
                    body: JSON.stringify({
                        cardId: card.id,
                        grade: grade
                    })
                });

                if (res.status === 409) {
                    // AJUSTE 4: Manejo de concurrencia
                    console.warn('[FSRS] Bloqueo de concurrencia (<5s): Ya calificaste esta tarjeta recientemente.');
                } else if (res.ok) {
                    const data = await res.json();
                    if (data.coinsEarned) coinsToAdd = data.coinsEarned;
                    if (data.streakBonus) coinsToAdd = 12; // +2 base + 10 bono racha
                }
            } catch (err) {
                console.warn('[FSRS] Error enviando review al backend:', err.message);
            }
        }

        // Disparar animación de IA Coins flotantes
        this.showFloatingCoins(coinsToAdd, eventOrigin);

        // Actualizar métricas locales
        this.userStats.reviews_today = (this.userStats.reviews_today || 0) + 1;
        this.updateStatsUI();

        // Breve pausa para efecto de volteo y avance a la siguiente tarjeta
        await new Promise(r => setTimeout(r, 450));

        this.currentIndex++;
        this.renderCurrentCard();

        // Rehabilitar botones
        buttons.forEach(b => b.disabled = false);
        this.isRatingInProgress = false;
    }

    showFloatingCoins(amount, eventOrigin = null) {
        const rewardEl = document.createElement('div');
        rewardEl.className = 'floating-reward';
        rewardEl.innerHTML = amount > 5 ? `+${amount} 🔥🪙` : `+${amount} 🪙`;

        let x = window.innerWidth / 2;
        let y = window.innerHeight / 2 + 50;

        if (eventOrigin && eventOrigin.clientX) {
            x = eventOrigin.clientX;
            y = eventOrigin.clientY;
        }

        rewardEl.style.left = `${x}px`;
        rewardEl.style.top = `${y}px`;

        document.body.appendChild(rewardEl);

        setTimeout(() => {
            if (rewardEl.parentNode) rewardEl.parentNode.removeChild(rewardEl);
        }, 1300);
    }

    showCompletedSession() {
        if (this.studyProgressBar) this.studyProgressBar.style.width = '100%';
        if (this.flashcardScene) this.flashcardScene.style.display = 'none';
        if (this.ratingControls) this.ratingControls.style.display = 'none';
        if (this.deckCompletedView) {
            this.deckCompletedView.style.display = 'block';
            const completedSummary = document.getElementById('completedSummaryText');
            if (completedSummary) {
                completedSummary.innerHTML = `
                    Has completado las <strong>${this.studyCards.length} tarjetas</strong> de esta sesión en 
                    <strong>${Math.floor(this.sessionSeconds / 60)} min ${this.sessionSeconds % 60} seg</strong>.<br>
                    Tus intervalos FSRS v4 han sido programados para garantizar una retención del 90%.
                `;
            }
        }
    }

    async handleGenerateDeck(e) {
        e.preventDefault();
        const subject = this.genSubjectSelect.value;
        const title = this.genDeckTitle.value.trim();

        this.btnSubmitGenerate.disabled = true;
        this.btnSubmitGenerate.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Generando tarjetas...';

        try {
            const res = await fetch(`${this.apiBase}/generate`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ subject, title })
            });
            const data = await res.json();
            if (data.success) {
                // Cerrar modal
                const modal = bootstrap.Modal.getInstance(this.generateDeckModalEl);
                if (modal) modal.hide();

                alert(`🎉 ¡Mazo generado exitosamente! Se han añadido 5 tarjetas curriculares de ${subject}.`);
                await this.loadDecks();
            } else {
                alert(`Error: ${data.error || 'No se pudo generar el mazo'}`);
            }
        } catch (err) {
            alert('Error conectando al servicio generador de mazos.');
        } finally {
            this.btnSubmitGenerate.disabled = false;
            this.btnSubmitGenerate.innerHTML = '<i class="fas fa-sparkles me-1"></i>Crear Mazo con 5 Flashcards';
        }
    }

    escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Inicialización automática cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.flashcardsApp = new FlashcardsApp();
    window.flashcardsApp.init();
});
