/**
 * MLOps Dashboard Logic
 * Handles data fetching and rendering for the Model Registry Dashboard
 */

// Configuración API
const BASE_API_URL = '/api'; // Proxy maneja la URL completa o ruta relativa

document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación admin
    checkAuth();

    // Cargar datos iniciales
    loadDashboard();

    // Inicializar gráficos dummy (placeholder)
    initCharts();
});

async function checkAuth() {
    const token = localStorage.getItem('bge_auth_token');
    if (!token) {
        window.location.href = 'admin-dashboard.html'; // Redirigir a login si no hay token
        return;
    }
}

async function loadDashboard() {
    try {
        const token = localStorage.getItem('bge_auth_token');
        const response = await fetch(`${BASE_API_URL}/ai/mlops/dashboard`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401 || response.status === 403) {
            alert('Sesión expirada o permisos insuficientes.');
            window.location.href = 'admin-dashboard.html';
            return;
        }

        const result = await response.json();

        if (result.success) {
            renderDashboard(result.data);
        } else {
            console.error('Error cargando dashboard:', result.error);
            showError('No se pudieron cargar los datos del dashboard.');
        }

    } catch (error) {
        console.error('Error de red:', error);
        showError('Error de conexión con el servidor.');
    }
}

function renderDashboard(data) {
    const tableBody = document.getElementById('models-table-body');
    const driftAlertsEl = document.getElementById('stat-drift-alerts');
    const prodModelsEl = document.getElementById('stat-prod-models');

    if (!data || data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4">No hay modelos registrados.</td></tr>';
        return;
    }

    // Calcular contadores
    let prodCount = 0;
    let driftCount = 0;

    let html = '';

    data.forEach(model => {
        // Lógica de estado y alertas
        const isProd = !!model.prod_version;
        if (isProd) prodCount++;

        // Simular drift check simple si hay latencia alta o precisión baja (esto vendría del backend idealmente como flag)
        const hasDrift = model.avg_latency > 200 || (model.prod_accuracy && model.prod_accuracy < 0.7);
        if (hasDrift) driftCount++;

        const statusBadge = hasDrift
            ? '<span class="status-badge status-warning">Drift Detected</span>'
            : (isProd ? '<span class="status-badge status-healthy">Healthy</span>' : '<span class="status-badge status-warning">Staging</span>');

        // Formatear fecha
        const deployedDate = model.deployed_at ? new Date(model.deployed_at).toLocaleDateString() : '-';

        html += `
            <tr>
                <td>
                    <div class="fw-bold">${model.model_name}</div>
                    <small class="text-muted">ID: ${model.model_id || 'N/A'}</small>
                </td>
                <td><span class="badge-framework">${model.framework}</span></td>
                <td>${model.prod_version || '<span class="text-muted">Not deployed</span>'}</td>
                <td>${deployedDate}</td>
                <td>${model.prod_accuracy ? (model.prod_accuracy * 100).toFixed(1) + '%' : '-'}</td>
                <td>${model.avg_latency ? Math.round(model.avg_latency) + ' ms' : '-'}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="ViewModelDetails('${model.model_name}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${hasDrift ? `<button class="btn btn-sm btn-outline-warning" title="Retrain"><i class="fas fa-sync"></i></button>` : ''}
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = (typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(html) : (typeof sanitizeHTML === 'function' ? sanitizeHTML(html) : html));

    // Actualizar contadores
    prodModelsEl.textContent = prodCount;
    driftAlertsEl.textContent = driftCount;
    // document.getElementById('stat-total-versions').textContent = '...'; // Este dato no viene en el summary actual, podría agregarse al endpoint
}


function showError(msg) {
    document.getElementById('models-table-body').innerHTML = `
        <tr><td colspan="8" class="text-center text-danger py-4"><i class="fas fa-exclamation-circle me-2"></i>${msg}</td></tr>
    `;
}

function initCharts() {
    // Placeholder Charts para visualización
    const ctxPerf = document.getElementById('chartPerformance').getContext('2d');
    new Chart(ctxPerf, {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
                label: 'Model Accuracy (Avg)',
                data: [0.88, 0.87, 0.86, 0.85],
                borderColor: '#0d6efd',
                tension: 0.4
            }]
        },
        options: { responsive: true }
    });

    const ctxLat = document.getElementById('chartLatency').getContext('2d');
    new Chart(ctxLat, {
        type: 'bar',
        data: {
            labels: ['VAK Classifier', 'Dropout Pred', 'Content Adapter'],
            datasets: [{
                label: 'Latency (ms)',
                data: [45, 120, 15],
                backgroundColor: ['#20c997', '#ffc107', '#0dcaf0']
            }]
        },
        options: { responsive: true }
    });
}
