/**
 * 📊 DASHBOARD TAB COUNTERS - Actualizar conteos dinámicos
 * Actualiza los números en los títulos de los tabs del dashboard
 * con datos consolidados para evitar saturación de peticiones.
 */

(function() {
    'use strict';

    /**
     * Actualizar conteos de tabs
     */
    async function updateTabCounters() {
        try {
            const token = localStorage.getItem('bge_auth_token') || sessionStorage.getItem('bge_auth_token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            let summary = null;
            try {
                const res = await fetch('/api/admin/dashboard-summary', { headers });
                if (res.ok) {
                    const json = await res.json();
                    if (json && json.success && json.data) {
                        summary = json.data;
                    }
                }
            } catch (e) {}

            const updates = [];

            // 1. Egresados
            const egresadosCount = summary?.egresados?.total ?? 0;
            updates.push({ id: 'egresados-count', value: egresadosCount, label: 'Egresados' });

            // 2. Bolsa de Trabajo
            const bolsaCount = summary?.bolsaTrabajo?.total ?? summary?.vacantes?.total ?? 0;
            updates.push({ id: 'bolsa-trabajo-count', value: bolsaCount, label: 'Bolsa de Trabajo' });

            // 3. Suscriptores
            const suscCount = summary?.suscriptores?.total ?? 0;
            updates.push({ id: 'suscriptores-count', value: suscCount, label: 'Suscriptores' });

            // 4. Citas
            const citasCount = summary?.citas?.total ?? 0;
            updates.push({ id: 'citas-count', value: citasCount, label: 'Citas' });

            // 5. Aprobaciones
            const approvalsCount = summary?.aprobaciones?.total ?? summary?.pendientes?.total ?? 0;
            updates.push({ id: 'approvals-count', value: approvalsCount, label: 'Aprobaciones' });

            // Aplicar actualizaciones al DOM
            updates.forEach(update => {
                const element = document.getElementById(update.id);
                if (element) {
                    element.textContent = update.value;
                    element.setAttribute('title', `${update.label}: ${update.value} registros`);
                }
            });
        } catch (error) {}
    }

    /**
     * Inicializar sistema de conteos
     */
    function initCounters() {
        updateTabCounters();
    }

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCounters);
    } else {
        initCounters();
    }

    // Exportar para uso manual si es necesario
    window.dashboardCounters = {
        update: updateTabCounters,
        init: initCounters
    };

})();
