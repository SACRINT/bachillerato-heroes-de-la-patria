/**
 * Adaptive Lesson Viewer Logic
 */
(function () {
    'use strict';

    // Para demo, usamos ID fijo de nodo (el creado en seed)
    // En real, vendría de URL params ?nodeId=X
    let currentNodeId = null;
    let currentAdaptationId = null;

    // Obtener nodeId real via API o usar último disponible
    // Simulo obtener el creado en la migración

    async function init() {
        console.log('Inicializando lección adaptativa...');

        // Intentar obtener un nodeId válido (hack para demo, buscamos el primero disponible)
        // En prod, esto se pasaría por URL

        // Paso 1: Obtener contenido
        // Como no tengo el ID generado por el seed (es serial), haré una búsqueda dummy o hardcode
        // Para que funcione el demo, necesito saber el ID.
        // Voy a hacer un fetch a un endpoint temporal o usar lógica de fallback en frontend si falla.

        // Simulación: Asumimos que el usuario navega a /adaptive-lesson.html?nodeId=1
        // Si falla, mostrar error amigable.

        const urlParams = new URLSearchParams(window.location.search);
        const nodeIdParam = urlParams.get('nodeId'); // Si existe

        if (nodeIdParam) {
            currentNodeId = nodeIdParam;
            loadContent(currentNodeId);
        } else {
            // Demo mode: Try to find "Porfiriato" node via separate API call or just fail gracefully
            // Como no expuse endpoint de búsqueda de nodos, usaré un ID probable (1, 2...)
            // O mejor: mostrar mensaje de error
            console.warn('No nodeId provided. Trying ID 1 for demo purposes.');
            loadContent(1); // Try ID 1
        }
    }

    async function loadContent(nodeId) {
        try {
            const token = localStorage.getItem('student_auth_token');
            if (!token) {
                alert('Debes iniciar sesión');
                window.location.href = 'login.html';
                return;
            }

            const res = await fetch(`/api/adaptive-content/${nodeId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const json = await res.json();

            if (json.success) {
                renderLesson(json.data);
            } else {
                document.getElementById('content-placeholder').innerHTML = `
                    <div class="alert alert-warning">
                        ${json.message || 'No se pudo cargar el contenido adaptado.'}
                        <br><br>
                        <small>Nota: Asegúrate de haber ejecutado la migración de contenido semilla.</small>
                    </div>
                `;
            }
        } catch (error) {
            console.error(error);
            document.getElementById('content-placeholder').innerHTML = `<p class="text-danger">Error de conexión</p>`;
        }
    }

    function renderLesson(data) {
        const { content, context } = data;
        currentAdaptationId = content.id;

        // Update Header
        // Nota: El título del nodo no viene en content_adaptations, necesitaría un JOIN en el servicio
        // Para simplificar, usaré un título genérico o lo que venga
        document.getElementById('lesson-title').textContent = "Lección Adaptativa"; // Ideal: data.nodeTitle
        document.getElementById('lesson-subject').textContent = "Historia"; // Ideal: data.subject
        document.getElementById('adaptation-reason').textContent = context.adaptationReason;
        document.getElementById('user-style-label').textContent = context.userStyle.charAt(0).toUpperCase() + context.userStyle.slice(1);

        // Render Content Body
        const area = document.getElementById('adaptive-content-area');
        const placeholder = document.getElementById('content-placeholder');

        placeholder.classList.add('d-none');
        area.classList.remove('d-none');

        let html = '';

        if (content.content_type === 'video') {
            html = `
                <div class="content-video-wrapper">
                    <iframe src="${content.content_body}" frameborder="0" allowfullscreen></iframe>
                </div>
                <div class="mt-4">
                    <h3>Video Explicativo</h3>
                    <p>Seleccionado para tu estilo <strong>Visual</strong>.</p>
                </div>
            `;
        } else if (content.content_type === 'audio') {
            html = `
                <div class="text-center py-5">
                    <i class="fas fa-headphones fa-5x text-primary mb-4"></i>
                    <audio controls class="w-100">
                         <!-- Mock source -->
                        <source src="#" type="audio/mpeg">
                        Tu navegador no soporta audio.
                    </audio>
                    <div class="card bg-light mt-4 p-3 text-start">
                        <h6>Transcripción:</h6>
                        <p>${content.content_body}</p>
                    </div>
                </div>
            `;
        } else if (content.content_type === 'interactive') {
            html = `
                <div class="content-interactive">
                    <i class="fas fa-hand-pointer fa-3x text-info mb-3"></i>
                    <h3>Ejercicio Interactivo</h3>
                    <p>${JSON.parse(content.content_body).type}</p>
                    <button class="btn btn-primary mt-3">Iniciar Actividad</button>
                    <p class="text-muted mt-2 small">Seleccionado para tu estilo <strong>Kinestésico</strong>.</p>
                </div>
            `;
        } else {
            // Text
            html = `
                <div class="content-text">
                    ${content.content_body}
                </div>
            `;
        }

        area.innerHTML = html;

        // Update Icons
        document.querySelectorAll('.profile-icon-sm').forEach(el => el.classList.remove('active'));
    }

    // Expose global functions for buttons
    window.completeLesson = async function () {
        if (!currentAdaptationId) return;

        try {
            const token = localStorage.getItem('student_auth_token');
            await fetch('/api/adaptive-content/log', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    adaptationId: currentAdaptationId,
                    interactionType: 'complete',
                    score: 100, // Completed
                    success: true
                })
            });

            alert('¡Lección completada! Tu progreso ha sido guardado y la IA ajustará futuras clases.');
            window.location.href = 'iacoins-dashboard.html';
        } catch (e) {
            console.error(e);
        }
    };

    window.logFeedback = async function (type) {
        // Implementar
        alert('Gracias por tu feedback. Ajustaremos la dificultad.');
    }

    window.trackMood = async function (emotionName) {
        try {
            const token = sessionStorage.getItem('bge_auth_token') || localStorage.getItem('bge_auth_token');
            if (!token) return;

            const res = await fetch('/api/emotions/track', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    emotion: emotionName,
                    source: 'SELF_REPORT',
                    context: {
                        lessonId: currentAdaptationId,
                        nodeId: currentNodeId
                    }
                })
            });

            if (res.ok) {
                const feedbackEl = document.getElementById('mood-feedback');
                feedbackEl.classList.remove('v-hidden');
                setTimeout(() => feedbackEl.classList.add('v-hidden'), 2000);

                // Check if intervention is needed after mood update
                checkIntervention();
            }
        } catch (e) {
            console.error('Mood track error', e);
        }
    }

    async function checkIntervention() {
        try {
            const token = sessionStorage.getItem('bge_auth_token') || localStorage.getItem('bge_auth_token');
            const res = await fetch('/api/emotions/check-intervention', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();

            if (json.success && json.data.shouldIntervene) {
                const modal = new bootstrap.Modal(document.getElementById('interventionModal'));
                document.getElementById('interventionMessage').textContent = json.data.message;

                if (json.data.interventionType === 'SWITCH_TOPIC') {
                    document.getElementById('interventionTitle').innerHTML = '<i class="fas fa-random text-info me-2"></i>¿Cambiamos de tema?';
                }

                modal.show();
            }
        } catch (e) {
            console.error('Intervention check error', e);
        }
    }

    window.takeBreak = function () {
        // Redirigir a una página de "descanso" o simplemente cerrar el modal y pausar cronómetro (si hubiera)
        // Por ahora redirigimos al dashboard de gamificación para "distraerse"
        window.location.href = 'gamification-center.html';
    }

    // Init
    init();

})();
