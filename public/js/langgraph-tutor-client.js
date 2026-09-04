/**
 * 🎓 LANGGRAPH TUTOR CLIENT
 * Fase 6 - Backend Inteligente: Objetivo 3
 * Cliente interactivo para el Tutor Escolar Inteligente Socrático del BGE.
 */

class LangGraphTutorClient {
    constructor() {
        this.sessionId = this.getOrCreateSessionId();
        this.currentSubject = 'matematicas';
        this.subjects = [];
        this.isProcessing = false;
        this.apiBase = '/api/tutor/graph';
    }

    getOrCreateSessionId() {
        let sid = localStorage.getItem('bge_tutor_session_id');
        if (!sid) {
            sid = `bge_tutor_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
            localStorage.setItem('bge_tutor_session_id', sid);
        }
        return sid;
    }

    async init() {
        this.cacheDom();
        this.bindEvents();
        await this.loadSubjects();
        await this.loadSessionState();
    }

    cacheDom() {
        this.subjectListEl = document.getElementById('tutorSubjectList');
        this.activeSubjectTitleEl = document.getElementById('activeSubjectTitle');
        this.activeSubjectDescEl = document.getElementById('activeSubjectDesc');
        this.chatMessagesEl = document.getElementById('tutorChatMessages');
        this.chatInputEl = document.getElementById('tutorChatInput');
        this.sendBtnEl = document.getElementById('tutorSendBtn');
        this.resetBtnEl = document.getElementById('tutorResetBtn');
        this.statusIndicatorEl = document.getElementById('tutorStatusIndicator');
        this.activeChallengeCardEl = document.getElementById('tutorActiveChallenge');
        this.stepIndicatorEl = document.getElementById('tutorGraphStep');
    }

    bindEvents() {
        if (this.sendBtnEl) {
            this.sendBtnEl.addEventListener('click', () => this.handleSendMessage());
        }
        if (this.chatInputEl) {
            this.chatInputEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleSendMessage();
                }
            });
        }
        if (this.resetBtnEl) {
            this.resetBtnEl.addEventListener('click', () => this.handleResetSession());
        }
    }

    async loadSubjects() {
        try {
            const res = await fetch(`${this.apiBase}/subjects`);
            const data = await res.json();
            if (data.success && data.subjects) {
                this.subjects = data.subjects;
                this.renderSubjectSelector();
            }
        } catch (err) {
            console.error('[TUTOR-CLIENT] Error cargando asignaturas:', err);
        }
    }

    renderSubjectSelector() {
        if (!this.subjectListEl) return;
        this.subjectListEl.innerHTML = '';

        this.subjects.forEach(sub => {
            const btn = document.createElement('button');
            btn.className = `tutor-subject-chip ${sub.id === this.currentSubject ? 'active' : ''}`;
            btn.setAttribute('data-subject', sub.id);
            btn.innerHTML = `<i class="fas ${sub.icon || 'fa-book'}"></i> <span>${sub.name.split(' ')[0]}</span>`;
            btn.addEventListener('click', () => this.selectSubject(sub.id));
            this.subjectListEl.appendChild(btn);
        });

        this.updateActiveSubjectHeader();
    }

    selectSubject(subjectId) {
        if (this.currentSubject === subjectId) return;
        this.currentSubject = subjectId;

        // Actualizar chips activos
        const chips = this.subjectListEl.querySelectorAll('.tutor-subject-chip');
        chips.forEach(c => {
            c.classList.toggle('active', c.getAttribute('data-subject') === subjectId);
        });

        this.updateActiveSubjectHeader();

        // Enviar mensaje introductorio en la interfaz
        const subjectObj = this.subjects.find(s => s.id === subjectId);
        const name = subjectObj ? subjectObj.name : subjectId;
        this.addMessage('assistant', `👋 ¡Hola! Has seleccionado **${name}**.\n\n¿Qué concepto o ejercicio te gustaría explorar o resolver hoy? Recuerda que como tu **Tutor Socrático**, te guiaré paso a paso con pistas y preguntas para que domines el tema.`);
    }

    updateActiveSubjectHeader() {
        const sub = this.subjects.find(s => s.id === this.currentSubject);
        if (sub) {
            if (this.activeSubjectTitleEl) this.activeSubjectTitleEl.textContent = sub.name;
            if (this.activeSubjectDescEl) {
                this.activeSubjectDescEl.textContent = `Temas: ${sub.topics.slice(0, 3).join(' • ')}...`;
            }
        }
    }

    async loadSessionState() {
        try {
            const res = await fetch(`${this.apiBase}/session/${this.sessionId}`);
            const data = await res.json();
            if (data.success && data.state && data.state.messages && data.state.messages.length > 0) {
                this.chatMessagesEl.innerHTML = '';
                data.state.messages.forEach(m => {
                    this.addMessage(m.role, m.content, m.challenge);
                });
                if (data.state.subject) {
                    this.currentSubject = data.state.subject;
                    this.renderSubjectSelector();
                }
            } else {
                // Mensaje de bienvenida inicial
                this.addMessage('assistant', `🎓 **¡Bienvenido a tu Tutor Escolar Inteligente con Razonamiento Socrático!**\n\nEstoy aquí para guiarte en tus materias de bachillerato. Selecciona una asignatura en la barra superior o escribe directamente tu duda.\n\n> 💡 *Principio Pedagógico:* No te daré la solución directa de tus tareas o exámenes, sino que te ayudaré a pensar y comprender cada paso.`);
            }
        } catch (err) {
            console.warn('[TUTOR-CLIENT] No se pudo cargar sesión previa:', err);
        }
    }

    async handleSendMessage() {
        const text = (this.chatInputEl ? this.chatInputEl.value : '').trim();
        if (!text || this.isProcessing) return;

        this.isProcessing = true;
        this.chatInputEl.value = '';
        this.chatInputEl.disabled = true;
        if (this.sendBtnEl) this.sendBtnEl.disabled = true;

        // Mostrar mensaje del estudiante
        this.addMessage('user', text);

        // Mostrar indicador de razonamiento del grafo
        this.showGraphStepIndicator('🧠 Analizando intención pedagógica y consultando base de conocimientos...');

        try {
            const res = await fetch(`${this.apiBase}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    message: text,
                    subject: this.currentSubject
                })
            });

            const result = await res.json();
            if (result.success && result.data) {
                const d = result.data;
                this.updateGraphStepStatus(d);
                this.addMessage('assistant', d.response, d.challenge);

                if (d.challenge) {
                    this.renderActiveChallenge(d.challenge);
                }
            } else {
                this.addMessage('assistant', '⚠️ Hubo un detalle al procesar tu duda. Por favor intenta plantearla con otras palabras.');
            }
        } catch (err) {
            console.error('[TUTOR-CLIENT] Error:', err);
            this.addMessage('assistant', '❌ No se pudo conectar con el servicio de tutoría escolar. Verifica tu conexión a internet.');
        } finally {
            this.hideGraphStepIndicator();
            this.isProcessing = false;
            this.chatInputEl.disabled = false;
            if (this.sendBtnEl) this.sendBtnEl.disabled = false;
            this.chatInputEl.focus();
        }
    }

    addMessage(role, text, challenge = null) {
        if (!this.chatMessagesEl) return;

        const msgDiv = document.createElement('div');
        msgDiv.className = `tutor-msg tutor-msg-${role}`;

        const avatar = role === 'assistant' 
            ? '<div class="tutor-msg-avatar"><i class="fas fa-robot"></i></div>'
            : '<div class="tutor-msg-avatar"><i class="fas fa-user-graduate"></i></div>';

        const formattedHtml = this.formatMarkdown(text);

        let challengeHtml = '';
        if (challenge && challenge.question) {
            challengeHtml = `
                <div class="tutor-msg-challenge-box">
                    <div class="tutor-challenge-header">
                        <i class="fas fa-brain text-warning"></i> <strong>Micro-Reto Socrático:</strong>
                    </div>
                    <p class="tutor-challenge-q">${challenge.question}</p>
                    ${challenge.hints && challenge.hints.length > 0 ? `
                        <details class="tutor-challenge-hint">
                            <summary><i class="fas fa-lightbulb text-info"></i> Ver pista orientadora</summary>
                            <p>${challenge.hints[0]}</p>
                        </details>
                    ` : ''}
                </div>
            `;
        }

        msgDiv.innerHTML = `
            ${avatar}
            <div class="tutor-msg-body">
                <div class="tutor-msg-content">${formattedHtml}</div>
                ${challengeHtml}
            </div>
        `;

        this.chatMessagesEl.appendChild(msgDiv);
        this.chatMessagesEl.scrollTop = this.chatMessagesEl.scrollHeight;
    }

    renderActiveChallenge(challenge) {
        if (!this.activeChallengeCardEl) return;

        if (!challenge || !challenge.question) {
            this.activeChallengeCardEl.style.display = 'none';
            return;
        }

        this.activeChallengeCardEl.style.display = 'block';
        this.activeChallengeCardEl.innerHTML = `
            <div class="card shadow-sm border-0 tutor-side-card">
                <div class="card-body">
                    <h6 class="card-title text-primary"><i class="fas fa-puzzle-piece me-2"></i>Reto Activo</h6>
                    <p class="card-text small mb-2">${challenge.question}</p>
                    ${challenge.hints ? `<small class="text-muted d-block mb-2">💡 <em>${challenge.hints[0]}</em></small>` : ''}
                    <div class="d-grid">
                        <button class="btn btn-sm btn-outline-primary" onclick="document.getElementById('tutorChatInput').focus()">
                            Responder al reto
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    showGraphStepIndicator(text) {
        if (this.stepIndicatorEl) {
            this.stepIndicatorEl.style.display = 'flex';
            this.stepIndicatorEl.innerHTML = `
                <span class="spinner-border spinner-border-sm text-primary me-2" role="status"></span>
                <span>${text}</span>
            `;
        }
    }

    updateGraphStepStatus(data) {
        if (!this.statusIndicatorEl) return;
        const stratMap = {
            'socratico_estricto': '🛡️ Guía Socrática Activa (Anti-Trampa)',
            'evaluacion_formativa': '✅ Evaluación de Razonamiento',
            'orientacion_institucional': '📋 RAG Normativo BGE',
            'scaffolding_ejercicios': '🪜 Andamiaje Paso a Paso',
            'analogia_conceptual': '💡 Razonamiento Conceptual'
        };
        const badge = stratMap[data.strategy] || '🧠 Tutoría Socrática';
        this.statusIndicatorEl.innerHTML = `<span class="badge bg-primary-subtle text-primary border border-primary-subtle">${badge}</span>`;
    }

    hideGraphStepIndicator() {
        if (this.stepIndicatorEl) {
            this.stepIndicatorEl.style.display = 'none';
        }
    }

    async handleResetSession() {
        if (!confirm('¿Deseas reiniciar la sesión de tutoría para comenzar de nuevo?')) return;
        try {
            await fetch(`${this.apiBase}/session/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    subject: this.currentSubject
                })
            });
            this.chatMessagesEl.innerHTML = '';
            if (this.activeChallengeCardEl) this.activeChallengeCardEl.style.display = 'none';
            this.addMessage('assistant', `🔄 Sesión reiniciada. ¿Qué tema de **${this.currentSubject}** te gustaría abordar ahora?`);
        } catch (err) {
            console.error('[TUTOR-CLIENT] Error reiniciando:', err);
        }
    }

    formatMarkdown(text) {
        if (!text) return '';
        let html = text
            .replace(/^### (.*$)/gim, '<h5 class="fw-bold mt-2 mb-1">$1</h5>')
            .replace(/^## (.*$)/gim, '<h4 class="fw-bold mt-3 mb-2">$1</h4>')
            .replace(/^# (.*$)/gim, '<h3 class="fw-bold mt-3 mb-2">$1</h3>')
            .replace(/^\> (.*$)/gim, '<blockquote class="tutor-quote">$1</blockquote>')
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
            .replace(/`([^`]+)`/gim, '<code class="tutor-code">$1</code>')
            .replace(/^\- (.*$)/gim, '<li>$1</li>')
            .replace(/\n\n/gim, '<br><br>')
            .replace(/\n/gim, '<br>');
        return html;
    }
}

// Inicialización automática
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('tutorContainer')) {
        window.tutorClient = new LangGraphTutorClient();
        window.tutorClient.init();
    }
});
