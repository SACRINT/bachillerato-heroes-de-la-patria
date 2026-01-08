/**
 * 📊 DASHBOARD WIDGETS
 * Propósito: Gestionar carga de widgets de IA en el dashboard del estudiante (Fase 7 - Semana 50)
 */

document.addEventListener('DOMContentLoaded', () => {
    loadAiWidgets();
});

async function loadAiWidgets() {
    // 1. Predictive Risk
    try {
        const riskRes = await fetch('/api/analytics/predictive/at-risk/me', {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        // Note: Endpoint /me for privacy, needs implementation or reuse existing
    } catch (e) { console.warn('Risk widget failed', e); }

    // 2. Recommendations
    try {
        const recRes = await fetch('/api/recommendations', {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        const recData = await recRes.json();
        if (recData.success) {
            renderRecommendations(recData.data);
        }
    } catch (e) { console.warn('Recs widget failed', e); }

    // 3. AI Tutor Status
    renderTutorStatus();
}

function renderRecommendations(recs) {
    const container = document.getElementById('ai-recs-container');
    if (!container) return; // Si no existe el placeholder en HTML

    container.innerHTML = '<h6>Recomendado para ti (IA)</h6>';
    recs.slice(0, 3).forEach(rec => {
        const card = document.createElement('div');
        card.className = 'card mb-2 p-2 bg-dark text-white border-secondary';
        card.innerHTML = `
            <small class="text-muted">${rec.reason}</small>
            <div>${rec.details ? rec.details.title : 'Contenido Recomendado'}</div>
        `;
        container.appendChild(card);
    });
}

function renderTutorStatus() {
    const container = document.getElementById('ai-tutor-widget');
    if (!container) return;

    container.innerHTML = `
        <div class="d-flex align-items-center justify-content-between">
            <span><i class="fas fa-robot text-primary"></i> Tutor IA: Activo</span>
            <a href="voice-assistant.html" class="btn btn-sm btn-outline-primary">Hablar</a>
        </div>
    `;
}
