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
            console.log('🔄 [DASHBOARD] Actualizando conteos de tabs...');

            const updates = [];

            // 1. Egresados
            try {
                const egresadosRes = await fetch('/api/egresados');
                const egresadosData = await egresadosRes.json();
                const egresadosCount = egresadosData.total || egresadosData.data?.length || 0;
                updates.push({
                    id: 'egresados-count',
                    value: egresadosCount,
                    label: 'Egresados'
                });
            } catch (e) {
                console.warn('⚠️ [DASHBOARD] Error obteniendo egresados:', e.message);
            }

            // 2. Bolsa de Trabajo
            try {
                const bolsaRes = await fetch('/api/bolsa-trabajo/stats/general');
                const bolsaData = await bolsaRes.json();
                const bolsaCount = bolsaData.data?.total || 0;
                updates.push({
                    id: 'bolsa-trabajo-count',
                    value: bolsaCount,
                    label: 'Bolsa de Trabajo'
                });
            } catch (e) {
                console.warn('⚠️ [DASHBOARD] Error obteniendo bolsa-trabajo:', e.message);
            }

            // 3. Suscriptores
            try {
                const suscRes = await fetch('/api/suscriptores');
                const suscData = await suscRes.json();
                const suscCount = suscData.total || suscData.data?.length || 0;
                updates.push({
                    id: 'suscriptores-count',
                    value: suscCount,
                    label: 'Suscriptores'
                });
            } catch (e) {
                console.warn('⚠️ [DASHBOARD] Error obteniendo suscriptores:', e.message);
            }

            // 4. Citas
            try {
                const citasRes = await fetch('/api/citas/list');
                const citasData = await citasRes.json();
                const citasCount = citasData.total || citasData.citas?.length || 0;
                updates.push({
                    id: 'citas-count',
                    value: citasCount,
                    label: 'Citas'
                });
            } catch (e) {
                console.warn('⚠️ [DASHBOARD] Error obteniendo citas:', e.message);
            }

            // 5. Aprobaciones (pendientes)
            try {
                const approvalsRes = await fetch('/api/approvals/pending');
                const approvalsData = await approvalsRes.json();
                const approvalsCount = approvalsData.total || approvalsData.data?.length || 0;
                updates.push({
                    id: 'approvals-count',
                    value: approvalsCount,
                    label: 'Aprobaciones'
                });
            } catch (e) {
                console.warn('⚠️ [DASHBOARD] Error obteniendo aprobaciones:', e.message);
            }

            // 6. Usuarios Activos (opcional - puede ser métrica de otros sistemas)
            // Dejar como 0 por ahora, ya que no hay endpoint específico
            updates.push({
                id: 'active-users-count',
                value: 0, // Puede actualizarse si existe endpoint
                label: 'Usuarios Activos'
            });

            // Aplicar actualizaciones al DOM
            updates.forEach(update => {
                const element = document.getElementById(update.id);
                if (element) {
                    element.textContent = update.value;
                    element.setAttribute('title', `${update.label}: ${update.value} registros`);
                    console.log(`✅ [DASHBOARD] ${update.label}: ${update.value}`);
                } else {
                    console.warn(`⚠️ [DASHBOARD] Elemento no encontrado: #${update.id}`);
                }
            });

            console.log('✅ [DASHBOARD] Conteos actualizados exitosamente');
        } catch (error) {
            console.error('❌ [DASHBOARD] Error actualizando conteos:', error);
        }
    }

    /**
     * Inicializar sistema de conteos
     */
    function initCounters() {
        // Actualizar conteos al cargar
        updateTabCounters();

        // Actualizar conteos cada 30 segundos (permite ver cambios en tiempo casi real)
        setInterval(updateTabCounters, 30000);

        console.log('✅ [DASHBOARD] Sistema de conteos dinámicos iniciado');
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
