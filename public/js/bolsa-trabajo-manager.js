/**
 * 💼 GESTOR DE BOLSA DE TRABAJO
 * Módulo para gestionar candidatos y CVs en el dashboard administrativo
 * Fecha: 09 Octubre 2025
 */

class BolsaTrabajoManager {
    constructor() {
        this.API_BASE = '/api/bolsa-trabajo';
        this.candidatos = [];
        this.filtroEstado = 'todos';
        this.filtroGeneracion = 'todos';
    }

    /**
     * Inicializar el gestor
     */
    async init() {
        console.log('💼 Inicializando Bolsa de Trabajo Manager...');
        await this.cargarCandidatos();
        await this.cargarEstadisticas();
        this.setupEventListeners();
    }

    /**
     * Cargar candidatos desde la API
     */
    async cargarCandidatos() {
        try {
            const response = await fetch(this.API_BASE);
            const data = await response.json();

            if (data.success) {
                this.candidatos = data.candidatos;
                this.renderizarTabla();
                console.log(`✅ ${data.total} candidatos cargados`);
            }
        } catch (error) {
            console.error('❌ Error al cargar candidatos:', error);
            this.mostrarError('Error al cargar candidatos');
        }
    }

    /**
     * Cargar estadísticas generales
     */
    async cargarEstadisticas() {
        try {
            const response = await fetch(`${this.API_BASE}/stats/general`);
            const data = await response.json();

            if (data.success) {
                this.renderizarEstadisticas(data.stats);
            }
        } catch (error) {
            console.error('❌ Error al cargar estadísticas:', error);
        }
    }

    /**
     * Renderizar estadísticas en cards
     */
    renderizarEstadisticas(stats) {
        // Actualizar IDs individuales que ya existen en el HTML
        const totalEl = document.getElementById('stats-total-bolsa');
        const nuevosEl = document.getElementById('stats-nuevos-bolsa');
        const revisadosEl = document.getElementById('stats-revisados-bolsa');
        const contratadosEl = document.getElementById('stats-contratados-bolsa');

        const estadosMap = {};
        stats.porEstado.forEach(e => {
            estadosMap[e.estado] = e.cantidad;
        });

        if (totalEl) totalEl.textContent = stats.total;
        if (nuevosEl) nuevosEl.textContent = stats.nuevosUltimos7Dias;
        if (revisadosEl) revisadosEl.textContent = estadosMap.revisado || 0;
        if (contratadosEl) contratadosEl.textContent = estadosMap.contratado || 0;
    }

    /**
     * Renderizar tabla de candidatos
     */
    renderizarTabla() {
        const tbody = document.getElementById('bolsa-table-body');
        if (!tbody) return;

        // Ocultar loading, mostrar tabla
        const loading = document.getElementById('bolsa-loading');
        const tableContainer = document.getElementById('bolsa-table-container');
        const emptyState = document.getElementById('bolsa-empty');

        if (loading) loading.style.display = 'none';
        if (emptyState) emptyState.style.display = 'none';

        // Aplicar filtros
        let candidatosFiltrados = this.candidatos;

        if (this.filtroEstado !== 'todos') {
            candidatosFiltrados = candidatosFiltrados.filter(c => c.estado === this.filtroEstado);
        }

        if (this.filtroGeneracion !== 'todos') {
            candidatosFiltrados = candidatosFiltrados.filter(c => c.generacion === this.filtroGeneracion);
        }

        // Renderizar filas
        tbody.innerHTML = candidatosFiltrados.map(candidato => `
            <tr>
                <td>${candidato.id}</td>
                <td>
                    <strong>${candidato.nombre}</strong><br>
                    <small class="text-muted">${candidato.email}</small>
                </td>
                <td>${candidato.telefono || '-'}</td>
                <td>${candidato.ciudad || '-'}</td>
                <td>${candidato.generacion || '-'}</td>
                <td>${candidato.area_interes || '-'}</td>
                <td>
                    <span class="badge bg-${this.getEstadoBadgeColor(candidato.estado)}">
                        ${candidato.estado}
                    </span>
                </td>
                <td>
                    ${candidato.cv_filename ?
                        `<span class="badge bg-success">✓ CV</span>` :
                        `<span class="badge bg-secondary">Sin CV</span>`
                    }
                </td>
                <td>
                    <small class="text-muted">
                        ${new Date(candidato.fecha_registro).toLocaleDateString('es-MX')}
                    </small>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-info" onclick="bolsaManager.verDetalle(${candidato.id})" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-warning" onclick="bolsaManager.cambiarEstado(${candidato.id})" title="Cambiar estado">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-primary" onclick="bolsaManager.agregarNotas(${candidato.id})" title="Notas">
                            <i class="fas fa-sticky-note"></i>
                        </button>
                        <button class="btn btn-danger" onclick="bolsaManager.eliminar(${candidato.id})" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Mostrar tabla o estado vacío
        if (candidatosFiltrados.length > 0) {
            if (tableContainer) tableContainer.style.display = 'block';
        } else {
            if (emptyState) emptyState.style.display = 'block';
        }

        // Actualizar contadores
        const showingCount = document.getElementById('showing-count-bolsa');
        const totalCount = document.getElementById('total-count-bolsa');

        if (showingCount) showingCount.textContent = candidatosFiltrados.length;
        if (totalCount) totalCount.textContent = this.candidatos.length;
    }

    /**
     * Obtener color de badge según estado
     */
    getEstadoBadgeColor(estado) {
        const colores = {
            'nuevo': 'warning',
            'revisado': 'info',
            'contactado': 'primary',
            'contratado': 'success',
            'rechazado': 'danger',
            'archivado': 'secondary'
        };
        return colores[estado] || 'secondary';
    }

    /**
     * Ver detalle de candidato
     */
    async verDetalle(id) {
        try {
            const response = await fetch(`${this.API_BASE}/${id}`);
            const data = await response.json();

            if (data.success) {
                this.mostrarModalDetalle(data.candidato);
            }
        } catch (error) {
            console.error('❌ Error al obtener detalle:', error);
            this.mostrarError('Error al cargar detalles del candidato');
        }
    }

    /**
     * Mostrar modal con detalles del candidato
     */
    mostrarModalDetalle(candidato) {
        const modalHtml = `
            <div class="modal fade" id="candidatoDetalleModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-user-circle"></i> Detalle de Candidato
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6>Información Personal</h6>
                                    <table class="table table-sm">
                                        <tr><td><strong>Nombre:</strong></td><td>${candidato.nombre}</td></tr>
                                        <tr><td><strong>Email:</strong></td><td>${candidato.email}</td></tr>
                                        <tr><td><strong>Teléfono:</strong></td><td>${candidato.telefono || '-'}</td></tr>
                                        <tr><td><strong>Ciudad:</strong></td><td>${candidato.ciudad || '-'}</td></tr>
                                    </table>
                                </div>
                                <div class="col-md-6">
                                    <h6>Información Académica</h6>
                                    <table class="table table-sm">
                                        <tr><td><strong>Generación:</strong></td><td>${candidato.generacion || '-'}</td></tr>
                                        <tr><td><strong>Área de Interés:</strong></td><td>${candidato.area_interes || '-'}</td></tr>
                                        <tr><td><strong>Estado:</strong></td><td>
                                            <span class="badge bg-${this.getEstadoBadgeColor(candidato.estado)}">
                                                ${candidato.estado}
                                            </span>
                                        </td></tr>
                                        <tr><td><strong>Fecha Registro:</strong></td><td>
                                            ${new Date(candidato.fecha_registro).toLocaleString('es-MX')}
                                        </td></tr>
                                    </table>
                                </div>
                            </div>
                            ${candidato.resumen_profesional ? `
                                <div class="mt-3">
                                    <h6>Resumen Profesional</h6>
                                    <p>${candidato.resumen_profesional}</p>
                                </div>
                            ` : ''}
                            ${candidato.habilidades ? `
                                <div class="mt-3">
                                    <h6>Habilidades</h6>
                                    <p>${candidato.habilidades}</p>
                                </div>
                            ` : ''}
                            ${candidato.notas_admin ? `
                                <div class="mt-3">
                                    <h6>Notas Administrativas</h6>
                                    <div class="alert alert-info">${candidato.notas_admin}</div>
                                </div>
                            ` : ''}
                            ${candidato.cv_filename ? `
                                <div class="mt-3">
                                    <h6>Curriculum Vitae</h6>
                                    <p>
                                        <i class="fas fa-file-pdf text-danger"></i>
                                        <a href="${candidato.cv_url || '#'}" target="_blank">${candidato.cv_filename}</a>
                                    </p>
                                </div>
                            ` : ''}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Eliminar modal anterior si existe
        const modalAnterior = document.getElementById('candidatoDetalleModal');
        if (modalAnterior) modalAnterior.remove();

        // Insertar y mostrar nuevo modal
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('candidatoDetalleModal'));
        modal.show();
    }

    /**
     * Cambiar estado de candidato
     */
    async cambiarEstado(id) {
        const nuevoEstado = await this.solicitarEstado();
        if (!nuevoEstado) return;

        try {
            const response = await fetch(`${this.API_BASE}/${id}/estado`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado })
            });

            const data = await response.json();

            if (data.success) {
                this.mostrarExito(`Estado actualizado a: ${nuevoEstado}`);
                await this.cargarCandidatos();
                await this.cargarEstadisticas();
            }
        } catch (error) {
            console.error('❌ Error al cambiar estado:', error);
            this.mostrarError('Error al actualizar estado');
        }
    }

    /**
     * Solicitar nuevo estado mediante prompt
     */
    async solicitarEstado() {
        const estados = ['nuevo', 'revisado', 'contactado', 'contratado', 'rechazado', 'archivado'];
        const seleccion = prompt(
            'Seleccione el nuevo estado:\n\n' +
            '1. Nuevo\n' +
            '2. Revisado\n' +
            '3. Contactado\n' +
            '4. Contratado\n' +
            '5. Rechazado\n' +
            '6. Archivado\n\n' +
            'Ingrese el número (1-6):'
        );

        if (!seleccion) return null;
        const index = parseInt(seleccion) - 1;
        return estados[index] || null;
    }

    /**
     * Agregar/editar notas administrativas
     */
    async agregarNotas(id) {
        const candidato = this.candidatos.find(c => c.id === id);
        const notas = prompt('Ingrese las notas administrativas:', candidato?.notas_admin || '');

        if (notas === null) return;

        try {
            const response = await fetch(`${this.API_BASE}/${id}/notas`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notas_admin: notas })
            });

            const data = await response.json();

            if (data.success) {
                this.mostrarExito('Notas actualizadas correctamente');
                await this.cargarCandidatos();
            }
        } catch (error) {
            console.error('❌ Error al actualizar notas:', error);
            this.mostrarError('Error al actualizar notas');
        }
    }

    /**
     * Eliminar candidato
     */
    async eliminar(id) {
        const candidato = this.candidatos.find(c => c.id === id);
        if (!confirm(`¿Está seguro de eliminar a ${candidato?.nombre}?\n\nEsta acción no se puede deshacer.`)) {
            return;
        }

        try {
            const response = await fetch(`${this.API_BASE}/${id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                this.mostrarExito('Candidato eliminado correctamente');
                await this.cargarCandidatos();
                await this.cargarEstadisticas();
            }
        } catch (error) {
            console.error('❌ Error al eliminar candidato:', error);
            this.mostrarError('Error al eliminar candidato');
        }
    }

    /**
     * Exportar a CSV
     */
    exportarCSV() {
        const headers = ['ID', 'Nombre', 'Email', 'Teléfono', 'Ciudad', 'Generación', 'Área', 'Estado', 'Fecha'];
        const rows = this.candidatos.map(c => [
            c.id,
            c.nombre,
            c.email,
            c.telefono || '',
            c.ciudad || '',
            c.generacion || '',
            c.area_interes || '',
            c.estado,
            new Date(c.fecha_registro).toLocaleDateString('es-MX')
        ]);

        let csv = headers.join(',') + '\n';
        csv += rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `bolsa-trabajo-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        this.mostrarExito('CSV exportado correctamente');
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Filtro por estado
        const filtroEstado = document.getElementById('filtro-estado-bolsa');
        if (filtroEstado) {
            filtroEstado.addEventListener('change', (e) => {
                this.filtroEstado = e.target.value;
                this.renderizarTabla();
            });
        }

        // Filtro por generación
        const filtroGeneracion = document.getElementById('filtro-generacion-bolsa');
        if (filtroGeneracion) {
            filtroGeneracion.addEventListener('change', (e) => {
                this.filtroGeneracion = e.target.value;
                this.renderizarTabla();
            });
        }

        // Botón exportar
        const btnExportar = document.getElementById('btn-exportar-bolsa');
        if (btnExportar) {
            btnExportar.addEventListener('click', () => this.exportarCSV());
        }

        // Botón refrescar
        const btnRefrescar = document.getElementById('btn-refrescar-bolsa');
        if (btnRefrescar) {
            btnRefrescar.addEventListener('click', () => {
                this.cargarCandidatos();
                this.cargarEstadisticas();
            });
        }
    }

    /**
     * Mostrar mensaje de éxito
     */
    mostrarExito(mensaje) {
        alert('✅ ' + mensaje);
    }

    /**
     * Mostrar mensaje de error
     */
    mostrarError(mensaje) {
        alert('❌ ' + mensaje);
    }
}

// La inicialización se maneja desde admin-dashboard.html mediante event listener de tab
// No se auto-inicializa para evitar cargas innecesarias

// Funciones globales para onclick handlers en HTML
window.loadBolsaTrabajo = async function() {
    if (window.bolsaManager) {
        await window.bolsaManager.cargarCandidatos();
        await window.bolsaManager.cargarEstadisticas();
    }
};

window.exportBolsaTrabajoCSV = function() {
    if (window.bolsaManager) {
        window.bolsaManager.exportarCSV();
    }
};

window.filterBolsaTrabajo = function() {
    if (window.bolsaManager) {
        window.bolsaManager.renderizarTabla();
    }
};

window.clearFiltersBolsaTrabajo = function() {
    if (window.bolsaManager) {
        window.bolsaManager.filtroEstado = 'todos';
        window.bolsaManager.filtroGeneracion = 'todos';
        window.bolsaManager.renderizarTabla();
    }
};
