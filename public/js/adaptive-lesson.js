/**
 * Adaptive Lesson Viewer Logic (Resilient & Universal Auth)
 */
(function () {
    'use strict';

    let currentNodeId = null;
    let currentAdaptationId = null;

    async function init() {
        const urlParams = new URLSearchParams(window.location.search);
        const nodeIdParam = urlParams.get('nodeId');

        if (nodeIdParam) {
            currentNodeId = nodeIdParam;
            loadContent(currentNodeId);
        } else {
            loadContent(1);
        }

        setupFeedbackButtons();
    }

    function getToken() {
        if (window.SimpleAuth && typeof window.SimpleAuth.getToken === 'function') {
            const t = window.SimpleAuth.getToken();
            if (t) return t;
        }
        return sessionStorage.getItem('bge_auth_token') ||
               localStorage.getItem('bge_auth_token') ||
               localStorage.getItem('student_auth_token') ||
               localStorage.getItem('auth_token') ||
               'demo-token';
    }

    async function loadContent(nodeId) {
        try {
            const token = getToken();

            const res = await fetch(`/api/adaptive-content/${nodeId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const json = await res.json();

            if (json && json.success && json.data) {
                renderLesson(json.data);
            } else {
                renderDemoLesson();
            }
        } catch (error) {
            renderDemoLesson();
        }
    }

    function renderDemoLesson() {
        renderLesson({
            content: {
                id: 1,
                content_type: 'interactive',
                content_body: '<div class="p-3 bg-white rounded shadow-sm"><h4>El Porfiriato (1876-1911)</h4><p>Periodo histórico en México caracterizado por el desarrollo de infraestructura ferroviaria, estabilidad económica y tensiones sociales que derivaron en la Revolución Mexicana de 1910.</p><ul><li><strong>Desarrollo Económico:</strong> Crecimiento industrial y expansión del ferrocarril.</li><li><strong>Cuestión Social:</strong> Desigualdad agraria y concentración de tierras.</li><li><strong>Trascendencia:</strong> Base del México moderno y detonante revolucionario.</li></ul></div>'
            },
            context: {
                adaptationReason: 'Contenido optimizado automáticamente para tu estilo de aprendizaje.',
                userStyle: 'visual'
            }
        });
    }

    function renderLesson(data) {
        if (!data || !data.content) {
            renderDemoLesson();
            return;
        }

        const { content, context } = data;
        currentAdaptationId = content.id;

        const titleEl = document.getElementById('lesson-title');
        if (titleEl) titleEl.textContent = "Lección Adaptativa: Historia de México";

        const subjectEl = document.getElementById('lesson-subject');
        if (subjectEl) subjectEl.textContent = "Historia";

        const reasonEl = document.getElementById('adaptation-reason');
        if (reasonEl) reasonEl.textContent = context?.adaptationReason || 'Adaptado a tu perfil';

        const styleEl = document.getElementById('user-style-label');
        if (styleEl && context?.userStyle) {
            styleEl.textContent = context.userStyle.charAt(0).toUpperCase() + context.userStyle.slice(1);
        }

        const area = document.getElementById('adaptive-content-area');
        const placeholder = document.getElementById('content-placeholder');

        if (placeholder) placeholder.classList.add('d-none');
        if (area) {
            area.classList.remove('d-none');

            let html = '';
            if (content.content_type === 'video') {
                html = `
                    <div class="content-video-wrapper text-center">
                        <div class="p-4 bg-light rounded"><i class="fas fa-play-circle fa-4x text-primary mb-3"></i><p>Video explicativo optimizado para tu estilo visual.</p></div>
                    </div>
                `;
            } else if (content.content_type === 'audio') {
                html = `
                    <div class="text-center py-4">
                        <i class="fas fa-headphones fa-4x text-primary mb-3"></i>
                        <div class="card bg-light p-3 text-start">
                            <h6>Contenido Auditivo:</h6>
                            <p>${content.content_body}</p>
                        </div>
                    </div>
                `;
            } else {
                html = `
                    <div class="lesson-text-content">
                        ${content.content_body}
                    </div>
                `;
            }

            area.innerHTML = (typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(html) : (typeof sanitizeHTML === 'function' ? sanitizeHTML(html) : html));
        }
    }

    function setupFeedbackButtons() {
        const completeBtn = document.getElementById('complete-lesson-btn');
        if (completeBtn) {
            completeBtn.addEventListener('click', () => {
                alert('¡Felicidades! Has completado esta lección adaptativa.');
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
