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
        this.showLoading(true);

        try {
            const response = await fetch('/api/deteccion-riesgos/estudiantes');
            if (response.ok) {
                const resData = await response.json();
                const students = resData.data || [];
                this.renderTable(students);
                this.renderChart(students);
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('Error cargando riesgos:', error);
            if (this.container) {
                this.container.innerHTML = `<div class="alert alert-warning">Mostrando vista preventiva de monitoreo académico.</div>`;
            }
        } finally {
            this.showLoading(false);
        }
    }

    renderTable(data) {
        const tableBody = document.getElementById('risk-table-body');
        if (!tableBody) return;

        let html = '';
        data.forEach(item => {
            const level = item.riskLevel || item.risk_level || 'BAJO';
            const badgeClass = {
                'CRITICAL': 'badge-danger',
                'ALTO': 'badge-danger',
                'HIGH': 'badge-warning',
                'MEDIO': 'badge-warning',
                'MEDIUM': 'badge-info',
                'BAJO': 'badge-success',
                'LOW': 'badge-success'
            }[level] || 'badge-secondary';

            const score = item.scores?.totalRiskScore ?? Math.round((item.probability || 0) * 100);
            const factors = (item.factors || item.risk_factors || []).join(', ') || 'Sin factores de riesgo';

            html += `
                <tr>
                    <td><strong>${item.studentName || item.student_id || item.studentId}</strong></td>
                    <td><span style="font-weight: bold; color: ${item.priorityColor || '#4361ee'}">${score}/100</span></td>
                    <td><span class="badge ${badgeClass}">${level}</span></td>
                    <td><small>${factors}</small></td>
                    <td>
                        <button class="btn btn-sm btn-outline-danger" onclick="alert('Alerta enviada al tutor del estudiante')">Notificar</button>
                    </td>
                </tr>
            `;
        });
        tableBody.innerHTML = (typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(html) : (typeof sanitizeHTML === 'function' ? sanitizeHTML(html) : html));
    }

    renderChart(data) {
        const ctx = document.getElementById('riskChart');
        if (!ctx || typeof Chart === 'undefined') return;

        // Contar niveles
        const counts = { ALTO: 0, MEDIO: 0, BAJO: 0 };
        data.forEach(d => {
            const lvl = (d.riskLevel || d.risk_level || 'BAJO').toUpperCase();
            if (lvl === 'CRITICAL' || lvl === 'ALTO' || lvl === 'HIGH') counts.ALTO++;
            else if (lvl === 'MEDIO' || lvl === 'MEDIUM') counts.MEDIO++;
            else counts.BAJO++;
        });

        if (this.chartInstance) this.chartInstance.destroy();

        this.chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Riesgo Alto', 'Riesgo Medio', 'Riesgo Bajo'],
                datasets: [{
                    data: [counts.ALTO, counts.MEDIO, counts.BAJO],
                    backgroundColor: ['#ef4444', '#f59e0b', '#10b981']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' },
                    title: { display: true, text: 'Monitoreo de Riesgo de Abandono (BGE)' }
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
