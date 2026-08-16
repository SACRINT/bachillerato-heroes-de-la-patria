/**
 * @file admin-risk-dashboard.js
 * @description Script para el panel de administración de Alerta Temprana (Riesgo de Deserción).
 */

class RiskDashboard {
    constructor() {
        this.apiUrl = '/api/ai/predict/dropout';
        this.chartInstance = null;
    }

    /**
     * Inicializa el dashboard.
     */
    init() {
        void 0;
        // Buscar contenedores en el DOM
        this.container = document.getElementById('risk-dashboard-container');
        if (!this.container) return; // No estamos en la página correcta

        this.loadRiskData();
    }

    /**
     * Carga datos de riesgo (Simulado batch loading para el demo).
     * En producción, esto iteraría sobre una lista de alumnos o llamaría a un endpoint de resumen.
     */
    async loadRiskData() {
        // Mock de IDs de estudiantes para demo
        const demoStudentIds = [1, 2, 3, 4, 5];
        const results = [];

        this.showLoading(true);

        try {
            for (const id of demoStudentIds) {
                const response = await fetch('/api/ai/v1/process', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        intent: 'ANALYTICS_PREDICT',
                        payload: {
                            type: 'risk',
                            studentId: id
                        }
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    results.push(data);
                }
            }

            this.renderTable(results);
            this.renderChart(results);

        } catch (error) {
            console.error('Error cargando riesgos:', error);
            this.container.innerHTML = `<div class="alert alert-danger">Error cargando datos de IA.</div>`;
        } finally {
            this.showLoading(false);
        }
    }

    renderTable(data) {
        const tableBody = document.getElementById('risk-table-body');
        if (!tableBody) return;

        let html = '';
        data.forEach(item => {
            const badgeClass = {
                'CRITICAL': 'badge-danger',
                'HIGH': 'badge-warning',
                'MEDIUM': 'badge-info',
                'LOW': 'badge-success'
            }[item.risk_level] || 'badge-secondary';

            html += `
                <tr>
                    <td>${item.student_id}</td>
                    <td>${(item.probability * 100).toFixed(1)}%</td>
                    <td><span class="badge ${badgeClass}">${item.risk_level}</span></td>
                    <td>${item.risk_factors.join(', ') || 'Ninguno'}</td>
                    <td><button class="btn btn-sm btn-primary" onclick="viewDetails(${item.student_id})">Ver</button></td>
                </tr>
            `;
        });
        tableBody.innerHTML = (typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(html) : (typeof sanitizeHTML === 'function' ? sanitizeHTML(html) : html));
    }

    renderChart(data) {
        const ctx = document.getElementById('riskChart');
        if (!ctx) return;

        // Contar niveles
        const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
        data.forEach(d => counts[d.risk_level]++);

        if (this.chartInstance) this.chartInstance.destroy();

        this.chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Crítico', 'Alto', 'Medio', 'Bajo'],
                datasets: [{
                    data: [counts.CRITICAL, counts.HIGH, counts.MEDIUM, counts.LOW],
                    backgroundColor: ['#dc3545', '#ffc107', '#17a2b8', '#28a745']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' },
                    title: { display: true, text: 'Distribución de Riesgo Escolar' }
                }
            }
        });
    }

    showLoading(show) {
        const loader = document.getElementById('risk-loader');
        if (loader) loader.style.display = show ? 'block' : 'none';
    }
}

// Auto-init
document.addEventListener('DOMContentLoaded', () => {
    window.riskDashboard = new RiskDashboard();
    window.riskDashboard.init();
});
