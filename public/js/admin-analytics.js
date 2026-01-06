document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadDashboard();

    document.getElementById('runAnalysisBtn').addEventListener('click', runAnalysis);
});

// Admin Authentication Check
async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        // Verifica si es admin. Puedes usar un endpoint de perfil o decodificar el token si confías en él cliente (no recomendado para seguridad real)
        // Por ahora asumimos que si tiene token puede intentar cargar, y el backend rechazará si no es admin.
    } catch (e) {
        console.error('Auth Check Error', e);
    }
}

async function loadDashboard() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch('/api/analytics/dashboard/risk', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401 || response.status === 403) {
            alert('Acceso no autorizado. Se requiere rol de Administrador.');
            window.location.href = 'index.html';
            return;
        }

        const result = await response.json();

        if (result.success) {
            updateStats(result.data.stats);
            renderRiskTable(result.data.atRiskStudents);
            renderCharts(result.data.stats, result.data.atRiskStudents);
        } else {
            console.error('Error loading dashboard:', result.error);
        }

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
    }
}

async function runAnalysis() {
    const btn = document.getElementById('runAnalysisBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Analizando...';

    const token = localStorage.getItem('token');
    try {
        const response = await fetch('/api/analytics/predict/run', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const result = await response.json();
        if (result.success) {
            alert(`Análisis completado. Procesados: ${result.data.processed} estudiantes.`);
            loadDashboard(); // Reload data
        } else {
            alert('Error al ejecutar análisis: ' + result.error);
        }
    } catch (error) {
        console.error('Analysis error:', error);
        alert('Error de conexión al ejecutar análisis.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sync-alt me-2"></i> Ejecutar Análisis de Riesgo';
    }
}

function updateStats(stats) {
    if (!stats) return;
    document.getElementById('stat-total').innerText = stats.total || 0;
    document.getElementById('stat-critical').innerText = stats.critical || 0;
    document.getElementById('stat-high').innerText = stats.high || 0;

    // Calcular promedio aproximado si no viene del backend
    // (En una implementación real el backend debería mandar avg_score)
    document.getElementById('stat-avg').innerText = 'N/A'; // Placeholder
}

function renderRiskTable(students) {
    const tbody = document.getElementById('risk-table-body');
    tbody.innerHTML = '';

    if (!students || students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay estudiantes en riesgo detectados.</td></tr>';
        return;
    }

    students.forEach(s => {
        const riskClass = {
            'CRITICAL': 'bg-danger text-white',
            'HIGH': 'bg-warning text-dark',
            'MEDIUM': 'bg-info text-dark',
            'LOW': 'bg-success text-white'
        }[s.risk_level] || 'bg-secondary';

        const row = `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar-circle me-2 bg-secondary text-white">${s.nombre.charAt(0)}</div>
                        <div>
                            <div class="fw-bold">${s.nombre} ${s.apellido_paterno}</div>
                            <div class="small text-muted">${s.email}</div>
                        </div>
                    </div>
                </td>
                <td><span class="badge ${riskClass}">${s.risk_level}</span></td>
                <td>${s.risk_score}</td>
                <td>${s.primary_factor || 'N/A'}</td>
                <td>${new Date(s.last_updated).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="alert('Detalles de ${s.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success" onclick="alert('Intervención para ${s.id}')">
                        <i class="fas fa-hands-helping"></i>
                    </button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function renderCharts(stats, students) {
    // Risk Distribution Chart
    const ctx = document.getElementById('riskDistributionChart').getContext('2d');

    // Destroy previous chart if exists (simple check or store instance globally)
    // For simplicity, we assume one render per load or handle reload carefully.
    if (window.riskChart) window.riskChart.destroy();

    window.riskChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Low', 'Medium', 'High', 'Critical'],
            datasets: [{
                label: '# Estudiantes',
                data: [stats.low, stats.medium, stats.high, stats.critical],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(255, 99, 132, 0.6)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(255, 99, 132, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: { beginAtZero: true }
            }
        }
    });

    // Factors Chart (Placeholder logic)
    // In real app, aggregate primary_factor from students array
    const factors = {};
    students.forEach(s => {
        const factor = s.primary_factor || 'Desconocido';
        factors[factor] = (factors[factor] || 0) + 1;
    });

    const ctxFactors = document.getElementById('factorsChart').getContext('2d');
    if (window.factorsChart) window.factorsChart.destroy();

    window.factorsChart = new Chart(ctxFactors, {
        type: 'doughnut',
        data: {
            labels: Object.keys(factors),
            datasets: [{
                data: Object.values(factors),
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0'
                ]
            }]
        }
    });
}
