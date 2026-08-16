/**
 * 📊 DASHBOARD TAB COUNTERS - Actualizar conteos dinámicos
 * Actualiza los números en los títulos de los tabs del dashboard
 * con datos reales de la base de datos
 */

(function() {
    'use strict';

    console.log('📊 [DASHBOARD] Iniciando sistema de conteos dinámicos...');

    /**
     * Actualizar conteos de tabs
     */
    async function updateTabCounters() {
        try {
            const client = window.apiClient || {
                get: async (url) => {
                    const token = localStorage.getItem('bge_auth_token') || sessionStorage.getItem('bge_auth_token');
                    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                    const res = await fetch(url, { headers });
                    return await res.json();
                }
            };

            const updates = [];

            // 1. Egresados
            try {
                const egresadosData = await client.get('/api/egresados');
                const egresadosCount = egresadosData?.total || egresadosData?.data?.length || 0;
                updates.push({ id: 'egresados-count', value: egresadosCount, label: 'Egresados' });
            } catch (e) {}

            // 2. Bolsa de Trabajo
            try {
                const bolsaData = await client.get('/api/bolsa-trabajo/stats/general');
                const bolsaCount = bolsaData?.data?.total || bolsaData?.total || 0;
                updates.push({ id: 'bolsa-trabajo-count', value: bolsaCount, label: 'Bolsa de Trabajo' });
            } catch (e) {}

            // 3. Suscriptores
            try {
                const suscData = await client.get('/api/suscriptores');
                const suscCount = suscData?.total || suscData?.data?.length || 0;
                updates.push({ id: 'suscriptores-count', value: suscCount, label: 'Suscriptores' });
            } catch (e) {}

            // 4. Citas
            try {
                const citasData = await client.get('/api/citas/list');
                const citasCount = citasData?.total || citasData?.citas?.length || 0;
                updates.push({ id: 'citas-count', value: citasCount, label: 'Citas' });
            } catch (e) {}

            // 5. Aprobaciones
            try {
                const approvalsData = await client.get('/api/approvals/pending');
                const approvalsCount = approvalsData?.total || approvalsData?.data?.length || 0;
                updates.push({ id: 'approvals-count', value: approvalsCount, label: 'Aprobaciones' });
            } catch (e) {}

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
