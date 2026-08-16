
// Gestión de Planes de Estudio Personalizados (Frontend)

document.addEventListener('DOMContentLoaded', () => {
    // Escuchar cambios de tab si es necesario
});

async function loadStudyPlan() {
    void 0;
    const container = document.getElementById('weekly-plan-container');
    const goalsContainer = document.getElementById('active-goals-list');

    // Auth Check
    const token = localStorage.getItem('student_auth_token');
    if (!token) {
        container.innerHTML = '<div class="alert alert-warning text-center">Debes iniciar sesión para ver tu plan.</div>';
        return;
    }

    try {
        // 1. Cargar Plan Semanal
        const planRes = await fetch('/api/study-plans/current', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const planData = await planRes.json();

        if (planData.success && planData.data) {
            renderWeeklyPlan(planData.data);
        } else {
            // Mostrar estado vacío
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-calendar-day fa-3x text-muted mb-3 opacity-50"></i>
                    <p class="text-muted">No tienes un plan activo esta semana.</p>
                    <button class="btn btn-sm btn-primary" onclick="generateNewPlan()">
                        <i class="fas fa-magic me-2"></i>Generar Plan Ahora
                    </button>
                </div>
            `;
        }

        // 2. Cargar Metas
        const goalsRes = await fetch('/api/study-plans/goals', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const goalsData = await goalsRes.json();

        if (goalsData.success && goalsData.data.length > 0) {
            goalsContainer.innerHTML = goalsData.data.map(goal => `
                <div class="d-flex align-items-center mb-2">
                    <i class="fas fa-check-circle text-${goal.priority === 'HIGH' ? 'danger' : 'success'} me-2"></i>
                    <div>
                        <div class="small fw-bold">${goal.title}</div>
                        <div class="text-muted" style="font-size: 0.75rem">Fin: ${new Date(goal.target_date).toLocaleDateString()}</div>
                    </div>
                </div>
            `).join('');
        } else {
            goalsContainer.innerHTML = '<p class="text-muted small text-center">No tienes metas activas.</p>';
        }

    } catch (error) {
        console.error('Error loading plan:', error);
        container.innerHTML = `<div class="alert alert-danger">Error cargando el plan: ${error.message}</div>`;
    }
}

function renderWeeklyPlan(plan) {
    const container = document.getElementById('weekly-plan-container');
    const dateRange = document.getElementById('plan-date-range');

    const start = new Date(plan.start_date);
    const end = new Date(plan.end_date);
    dateRange.textContent = `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}`;

    if (!plan.items || plan.items.length === 0) {
        container.innerHTML = '<div class="p-3 text-center">El plan está vacío.</div>';
        return;
    }

    // Agrupar por día (1=Lunes, 2=Martes...)
    const days = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 0: 'Domingo' };
    let html = '';

    // Ordenar items por día
    const itemsByDay = {};
    plan.items.forEach(item => {
        if (!itemsByDay[item.day_of_week]) itemsByDay[item.day_of_week] = [];
        itemsByDay[item.day_of_week].push(item);
    });

    Object.keys(itemsByDay).sort().forEach(dayNum => {
        const dayName = days[dayNum] || 'Día ' + dayNum;
        const tasks = itemsByDay[dayNum];

        html += `
            <div class="list-group-item bg-light border-0 fw-bold text-uppercase small text-muted mt-2">
                ${dayName}
            </div>
        `;

        tasks.forEach(task => {
            const icon = getTaskIcon(task.activity_type);
            const badgeClass = getDifficultyBadge(task.difficulty_level);

            html += `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        <div class="rounded-circle bg-soft-primary p-2 me-3 text-primary">
                            <i class="${icon}"></i>
                        </div>
                        <div>
                            <h6 class="mb-0 text-dark">${task.subject}</h6>
                            <small class="text-muted">${task.description} (${task.activity_type})</small>
                        </div>
                    </div>
                    <span class="badge ${badgeClass}">${task.difficulty_level}</span>
                </div>
            `;
        });
    });

    container.innerHTML = (typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(html) : (typeof sanitizeHTML === 'function' ? sanitizeHTML(html) : html));
}

async function generateNewPlan() {
    const btn = event?.target; // Si fue disparado por clic
    if (btn) btn.disabled = true;

    try {
        const token = localStorage.getItem('student_auth_token');
        const res = await fetch('/api/study-plans/generate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await res.json();

        if (data.success) {
            alert('¡Plan generado con éxito! Vamos a por ello 🚀');
            loadStudyPlan(); // Recargar
        } else {
            alert('Error: ' + (data.error || 'No se pudo generar'));
        }
    } catch (e) {
        console.error(e);
        alert('Error de conexión');
    } finally {
        if (btn) btn.disabled = false;
    }
}

function getTaskIcon(type) {
    if (type === 'VIDEO') return 'fas fa-play-circle';
    if (type === 'QUIZ') return 'fas fa-question-circle';
    if (type === 'READING') return 'fas fa-book-reader';
    if (type === 'EXERCISE') return 'fas fa-pencil-alt';
    return 'fas fa-tasks';
}


// ==========================================
// RECOMENDACIONES DE CONTENIDO (AI)
// ==========================================

async function loadRecommendations() {
    const wrapper = document.getElementById('ai-recommendations-wrapper');
    const container = document.getElementById('ai-recommendations-container');

    const token = localStorage.getItem('student_auth_token');
    if (!token) return; // No mostrar si no hay auth

    try {
        const res = await fetch('/api/ai/v1/process', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                intent: 'ANALYTICS_PREDICT',
                payload: { type: 'recommendations' }
            })
        });
        const json = await res.json();
        // Adapt Orchestrator response structure (assuming standard {success: true, data: ...})
        const data = json;

        if (data.success && data.data.length > 0) {
            renderRecommendations(data.data);
            wrapper.classList.remove('d-none');
        }
    } catch (error) {
        console.error('Error loading recommendations:', error);
    }
}

function renderRecommendations(resources) {
    const container = document.getElementById('ai-recommendations-container');

    container.innerHTML = resources.map(res => `
        <div class="col-md-4 col-lg-3">
            <div class="card h-100 border-primary shadow-sm hover-lift">
                <div class="card-header bg-soft-primary text-primary small fw-bold d-flex justify-content-between">
                    <span>${res.subject}</span>
                    <span class="badge bg-primary">${res.difficulty}</span>
                </div>
                <div class="card-body">
                    <h6 class="card-title fw-bold text-dark">${res.title}</h6>
                    <div class="small text-muted mb-2">
                        <i class="${getTaskIcon(res.type.toUpperCase())} me-1"></i> ${res.type}
                        ${res.duration_minutes ? `• ${res.duration_minutes} min` : ''}
                    </div>
                </div>
                <div class="card-footer bg-white border-0">
                    <a href="${res.url || '#'}" target="_blank" class="btn btn-sm btn-outline-primary w-100">
                        Ver Ahora <i class="fas fa-external-link-alt ms-1"></i>
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    loadRecommendations();
});

