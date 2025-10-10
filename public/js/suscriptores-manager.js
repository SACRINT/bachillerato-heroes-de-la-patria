/**
 * 📧 GESTOR DE SUSCRIPTORES
 * Módulo para gestionar suscriptores de notificaciones en el dashboard
 * Fecha: 09 Octubre 2025
 */

class SuscriptoresManager {
    constructor() {
        this.API_BASE = '/api/suscriptores';
        this.suscriptores = [];
        this.filtroEstado = 'todos';
    }

    /**
     * Inicializar el gestor
     */
    async init() {
        console.log('📧 Inicializando Suscriptores Manager...');
        await this.cargarSuscriptores();
        await this.cargarEstadisticas();
        this.setupEventListeners();
    }

    /**
     * Cargar suscriptores desde la API
     */
    async cargarSuscriptores() {
        try {
            const response = await fetch(this.API_BASE);
            const data = await response.json();

            if (data.success) {
                this.suscriptores = data.suscriptores;
                this.renderizarTabla();
                console.log(`✅ ${data.total} suscriptores cargados`);
            }
        } catch (error) {
            console.error('❌ Error al cargar suscriptores:', error);
            this.mostrarError('Error al cargar suscriptores');
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
        const totalEl = document.getElementById('stats-total-suscriptores');
        const activosEl = document.getElementById('stats-activos-suscriptores');
        const verificadosEl = document.getElementById('stats-verificados-suscriptores');
        const nuevosEl = document.getElementById('stats-nuevos-suscriptores');

        const estadosMap = {};
        stats.porEstado.forEach(e => {
            estadosMap[e.estado] = e.cantidad;
        });

        const verificadosMap = {};
        stats.porVerificacion.forEach(e => {
            verificadosMap[e.verificado] = e.cantidad;
        });

        if (totalEl) totalEl.textContent = stats.total;
        if (activosEl) activosEl.textContent = estadosMap.activo || 0;
        if (verificadosEl) verificadosEl.textContent = verificadosMap[1] || 0;
        if (nuevosEl) nuevosEl.textContent = stats.nuevosUltimos7Dias;
    }

    /**
     * Renderizar tabla de suscriptores
     */
    renderizarTabla() {
        const tbody = document.getElementById('suscriptores-table-body');
        if (!tbody) return;

        // Ocultar loading, mostrar tabla
        const loading = document.getElementById('suscriptores-loading');
        const tableContainer = document.getElementById('suscriptores-table-container');
        const emptyState = document.getElementById('suscriptores-empty');

        if (loading) loading.style.display = 'none';
        if (emptyState) emptyState.style.display = 'none';

        // Aplicar filtro por estado
        let suscriptoresFiltrados = this.suscriptores;

        if (this.filtroEstado !== 'todos') {
            suscriptoresFiltrados = suscriptoresFiltrados.filter(s => s.estado === this.filtroEstado);
        }

        // Renderizar filas
        tbody.innerHTML = suscriptoresFiltrados.map(suscriptor => `
            <tr>
                <td>${suscriptor.id}</td>
                <td>
                    <strong>${suscriptor.email}</strong><br>
                    ${suscriptor.nombre ? `<small class="text-muted">${suscriptor.nombre}</small>` : ''}
                </td>
                <td>
                    <div class="d-flex flex-column">
                        ${suscriptor.notif_todas ? '<span class="badge bg-primary mb-1">Todas</span>' : ''}
                        ${suscriptor.notif_convocatorias ? '<span class="badge bg-info mb-1">Convocatorias</span>' : ''}
                        ${suscriptor.notif_becas ? '<span class="badge bg-success mb-1">Becas</span>' : ''}
                        ${suscriptor.notif_eventos ? '<span class="badge bg-warning mb-1">Eventos</span>' : ''}
                        ${suscriptor.notif_noticias ? '<span class="badge bg-danger mb-1">Noticias</span>' : ''}
                    </div>
                </td>
                <td>
                    <span class="badge bg-${this.getEstadoBadgeColor(suscriptor.estado)}">
                        ${suscriptor.estado}
                    </span>
                </td>
                <td class="text-center">
                    ${suscriptor.verificado ?
                        '<i class="fas fa-check-circle text-success" title="Verificado"></i>' :
                        '<i class="fas fa-times-circle text-danger" title="No verificado"></i>'
                    }
                </td>
                <td class="text-center">
                    ${suscriptor.total_enviados}
                </td>
                <td class="text-center">
                    ${suscriptor.total_abiertos}
                </td>
                <td class="text-center">
                    ${suscriptor.total_enviados > 0 ?
                        Math.round((suscriptor.total_abiertos / suscriptor.total_enviados) * 100) + '%' :
                        '-'
                    }
                </td>
                <td>
                    <small class="text-muted">
                        ${new Date(suscriptor.fecha_registro).toLocaleDateString('es-MX')}
                    </small>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-info" onclick="suscriptoresManager.verDetalle(${suscriptor.id})" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-warning" onclick="suscriptoresManager.editar(${suscriptor.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${suscriptor.estado === 'activo' ?
                            `<button class="btn btn-secondary" onclick="suscriptoresManager.cancelar('${suscriptor.email}')" title="Cancelar">
                                <i class="fas fa-ban"></i>
                            </button>` :
                            ''
                        }
                        <button class="btn btn-danger" onclick="suscriptoresManager.eliminar(${suscriptor.id})" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Mostrar tabla o estado vacío
        if (suscriptoresFiltrados.length > 0) {
            if (tableContainer) tableContainer.style.display = 'block';
        } else {
            if (emptyState) emptyState.style.display = 'block';
        }

        // Actualizar contadores
        const showingCount = document.getElementById('showing-count-suscriptores');
        const totalCount = document.getElementById('total-count-suscriptores');

        if (showingCount) showingCount.textContent = suscriptoresFiltrados.length;
        if (totalCount) totalCount.textContent = this.suscriptores.length;
    }

    /**
     * Obtener color de badge según estado
     */
    getEstadoBadgeColor(estado) {
        const colores = {
            'activo': 'success',
            'inactivo': 'warning',
            'cancelado': 'danger'
        };
        return colores[estado] || 'secondary';
    }

    /**
     * Ver detalle de suscriptor
     */
    async verDetalle(id) {
        try {
            const response = await fetch(`${this.API_BASE}/${id}`);
            const data = await response.json();

            if (data.success) {
                this.mostrarModalDetalle(data.suscriptor);
            }
        } catch (error) {
            console.error('❌ Error al obtener detalle:', error);
            this.mostrarError('Error al cargar detalles del suscriptor');
        }
    }

    /**
     * Mostrar modal con detalles del suscriptor
     */
    mostrarModalDetalle(suscriptor) {
        const modalHtml = `
            <div class="modal fade" id="suscriptorDetalleModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-envelope"></i> Detalle de Suscriptor
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6>Información General</h6>
                                    <table class="table table-sm">
                                        <tr><td><strong>Email:</strong></td><td>${suscriptor.email}</td></tr>
                                        <tr><td><strong>Nombre:</strong></td><td>${suscriptor.nombre || '-'}</td></tr>
                                        <tr><td><strong>Estado:</strong></td><td>
                                            <span class="badge bg-${this.getEstadoBadgeColor(suscriptor.estado)}">
                                                ${suscriptor.estado}
                                            </span>
                                        </td></tr>
                                        <tr><td><strong>Verificado:</strong></td><td>
                                            ${suscriptor.verificado ?
                                                '<i class="fas fa-check-circle text-success"></i> Sí' :
                                                '<i class="fas fa-times-circle text-danger"></i> No'
                                            }
                                        </td></tr>
                                    </table>
                                </div>
                                <div class="col-md-6">
                                    <h6>Preferencias de Notificaciones</h6>
                                    <div class="list-group">
                                        ${suscriptor.notif_todas ?
                                            '<div class="list-group-item"><i class="fas fa-check text-success"></i> Todas las notificaciones</div>' :
                                            '<div class="list-group-item text-muted"><i class="fas fa-times"></i> Todas las notificaciones</div>'
                                        }
                                        ${suscriptor.notif_convocatorias ?
                                            '<div class="list-group-item"><i class="fas fa-check text-success"></i> Convocatorias</div>' :
                                            '<div class="list-group-item text-muted"><i class="fas fa-times"></i> Convocatorias</div>'
                                        }
                                        ${suscriptor.notif_becas ?
                                            '<div class="list-group-item"><i class="fas fa-check text-success"></i> Becas</div>' :
                                            '<div class="list-group-item text-muted"><i class="fas fa-times"></i> Becas</div>'
                                        }
                                        ${suscriptor.notif_eventos ?
                                            '<div class="list-group-item"><i class="fas fa-check text-success"></i> Eventos</div>' :
                                            '<div class="list-group-item text-muted"><i class="fas fa-times"></i> Eventos</div>'
                                        }
                                        ${suscriptor.notif_noticias ?
                                            '<div class="list-group-item"><i class="fas fa-check text-success"></i> Noticias</div>' :
                                            '<div class="list-group-item text-muted"><i class="fas fa-times"></i> Noticias</div>'
                                        }
                                    </div>
                                </div>
                            </div>
                            <div class="row mt-3">
                                <div class="col-md-12">
                                    <h6>Estadísticas de Envíos</h6>
                                    <table class="table table-sm">
                                        <tr>
                                            <td><strong>Total Enviados:</strong></td>
                                            <td>${suscriptor.total_enviados}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Total Abiertos:</strong></td>
                                            <td>${suscriptor.total_abiertos}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Tasa de Apertura:</strong></td>
                                            <td>
                                                ${suscriptor.total_enviados > 0 ?
                                                    Math.round((suscriptor.total_abiertos / suscriptor.total_enviados) * 100) + '%' :
                                                    '-'
                                                }
                                            </td>
                                        </tr>
                                        <tr>
                                            <td><strong>Último Envío:</strong></td>
                                            <td>
                                                ${suscriptor.ultimo_envio ?
                                                    new Date(suscriptor.ultimo_envio).toLocaleString('es-MX') :
                                                    'Nunca'
                                                }
                                            </td>
                                        </tr>
                                        <tr>
                                            <td><strong>Fecha de Registro:</strong></td>
                                            <td>${new Date(suscriptor.fecha_registro).toLocaleString('es-MX')}</td>
                                        </tr>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Eliminar modal anterior si existe
        const modalAnterior = document.getElementById('suscriptorDetalleModal');
        if (modalAnterior) modalAnterior.remove();

        // Insertar y mostrar nuevo modal
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('suscriptorDetalleModal'));
        modal.show();
    }

    /**
     * Editar suscriptor (simplificado - solo estado)
     */
    async editar(id) {
        const suscriptor = this.suscriptores.find(s => s.id === id);
        if (!suscriptor) return;

        const nuevoEstado = prompt(
            'Seleccione el nuevo estado:\n\n' +
            '1. Activo\n' +
            '2. Inactivo\n' +
            '3. Cancelado\n\n' +
            'Ingrese el número (1-3):',
            suscriptor.estado === 'activo' ? '1' : (suscriptor.estado === 'inactivo' ? '2' : '3')
        );

        if (!nuevoEstado) return;

        const estados = ['activo', 'inactivo', 'cancelado'];
        const estadoSeleccionado = estados[parseInt(nuevoEstado) - 1];

        if (!estadoSeleccionado) {
            this.mostrarError('Estado inválido');
            return;
        }

        try {
            const response = await fetch(`${this.API_BASE}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...suscriptor,
                    estado: estadoSeleccionado
                })
            });

            const data = await response.json();

            if (data.success) {
                this.mostrarExito('Suscriptor actualizado correctamente');
                await this.cargarSuscriptores();
                await this.cargarEstadisticas();
            }
        } catch (error) {
            console.error('❌ Error al actualizar suscriptor:', error);
            this.mostrarError('Error al actualizar suscriptor');
        }
    }

    /**
     * Cancelar suscripción
     */
    async cancelar(email) {
        if (!confirm(`¿Está seguro de cancelar la suscripción de ${email}?`)) {
            return;
        }

        try {
            const response = await fetch(`${this.API_BASE}/cancelar/${encodeURIComponent(email)}`, {
                method: 'PATCH'
            });

            const data = await response.json();

            if (data.success) {
                this.mostrarExito('Suscripción cancelada correctamente');
                await this.cargarSuscriptores();
                await this.cargarEstadisticas();
            }
        } catch (error) {
            console.error('❌ Error al cancelar suscripción:', error);
            this.mostrarError('Error al cancelar suscripción');
        }
    }

    /**
     * Eliminar suscriptor
     */
    async eliminar(id) {
        const suscriptor = this.suscriptores.find(s => s.id === id);
        if (!confirm(`¿Está seguro de eliminar al suscriptor ${suscriptor?.email}?\n\nEsta acción no se puede deshacer.`)) {
            return;
        }

        try {
            const response = await fetch(`${this.API_BASE}/${id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                this.mostrarExito('Suscriptor eliminado correctamente');
                await this.cargarSuscriptores();
                await this.cargarEstadisticas();
            }
        } catch (error) {
            console.error('❌ Error al eliminar suscriptor:', error);
            this.mostrarError('Error al eliminar suscriptor');
        }
    }

    /**
     * Exportar a CSV
     */
    exportarCSV() {
        const headers = ['ID', 'Email', 'Nombre', 'Estado', 'Verificado', 'Enviados', 'Abiertos', 'Tasa %', 'Fecha'];
        const rows = this.suscriptores.map(s => [
            s.id,
            s.email,
            s.nombre || '',
            s.estado,
            s.verificado ? 'Sí' : 'No',
            s.total_enviados,
            s.total_abiertos,
            s.total_enviados > 0 ? Math.round((s.total_abiertos / s.total_enviados) * 100) : 0,
            new Date(s.fecha_registro).toLocaleDateString('es-MX')
        ]);

        let csv = headers.join(',') + '\n';
        csv += rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `suscriptores-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        this.mostrarExito('CSV exportado correctamente');
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Filtro por estado
        const filtroEstado = document.getElementById('filtro-estado-suscriptores');
        if (filtroEstado) {
            filtroEstado.addEventListener('change', (e) => {
                this.filtroEstado = e.target.value;
                this.renderizarTabla();
            });
        }

        // Botón exportar
        const btnExportar = document.getElementById('btn-exportar-suscriptores');
        if (btnExportar) {
            btnExportar.addEventListener('click', () => this.exportarCSV());
        }

        // Botón refrescar
        const btnRefrescar = document.getElementById('btn-refrescar-suscriptores');
        if (btnRefrescar) {
            btnRefrescar.addEventListener('click', () => {
                this.cargarSuscriptores();
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
window.loadSuscriptores = async function() {
    if (window.suscriptoresManager) {
        await window.suscriptoresManager.cargarSuscriptores();
        await window.suscriptoresManager.cargarEstadisticas();
    }
};

window.exportSuscriptoresCSV = function() {
    if (window.suscriptoresManager) {
        window.suscriptoresManager.exportarCSV();
    }
};

window.filterSuscriptores = function() {
    if (window.suscriptoresManager) {
        window.suscriptoresManager.renderizarTabla();
    }
};

window.clearFiltersSuscriptores = function() {
    if (window.suscriptoresManager) {
        window.suscriptoresManager.filtroEstado = 'todos';
        window.suscriptoresManager.renderizarTabla();
    }
};
