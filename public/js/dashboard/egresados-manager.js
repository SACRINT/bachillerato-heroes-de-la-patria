/**
 * 🎓 MÓDULO DE GESTIÓN DE EGRESADOS
 * Sistema simplificado integrado con el dashboard
 * Extraído de admin-dashboard.html para cumplir con CSP (No inline scripts)
 * Versión: 1.0.0 - 03-OCT-2025
 * Fecha extracción: 19 Nov 2025
 */

class EgresadosManager {
    constructor() {
        this.egresados = [];
        this.filteredEgresados = [];
        this.apiBaseUrl = '/api';
    }

    async init() {
        await this.loadEgresados();
        this.setupEventListeners();
    }

    async loadEgresados() {
        const loadingEl = document.getElementById('egresados-loading');
        const errorEl = document.getElementById('egresados-error');
        const emptyEl = document.getElementById('egresados-empty');
        const tableContainer = document.getElementById('egresados-table-container');

        if (loadingEl) loadingEl.style.display = 'block';
        if (errorEl) errorEl.style.display = 'none';
        if (emptyEl) emptyEl.style.display = 'none';
        if (tableContainer) tableContainer.style.display = 'none';

        try {
            const response = await fetch(`${this.apiBaseUrl}/egresados/list`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const result = await response.json();
            if (result.success) {
                this.egresados = result.egresados || result.data || [];
                this.filteredEgresados = [...this.egresados];

                this.updateStatistics();
                this.populateFilters();
                this.renderTable();

                if (loadingEl) loadingEl.style.display = 'none';
                if (this.egresados.length === 0) {
                    if (emptyEl) emptyEl.style.display = 'block';
                } else {
                    if (tableContainer) tableContainer.style.display = 'block';
                }
            } else {
                throw new Error(result.error || 'Error desconocido');
            }
        } catch (error) {
            console.error('❌ [EgresadosManager] Error:', error);
            if (loadingEl) loadingEl.style.display = 'none';
            if (errorEl) {
                errorEl.style.display = 'block';
                const msgEl = document.getElementById('egresados-error-message');
                if (msgEl) msgEl.textContent = `Error: ${error.message}`;
            }
        }
    }

    updateStatistics() {
        const total = this.egresados.length;
        const titulados = this.egresados.filter(e => e.estatus_estudios === 'titulado').length;
        const estudiando = this.egresados.filter(e => e.estatus_estudios === 'estudiando').length;
        const conHistoria = this.egresados.filter(e => e.autoriza_publicar === 1 && e.historia_exito).length;

        // Actualizar cards de estadísticas
        this.updateElement('stats-total', total);
        this.updateElement('stats-titulados', titulados);
        this.updateElement('stats-estudiando', estudiando);
        this.updateElement('stats-historias', conHistoria);

        // Actualizar badge en tab
        this.updateElement('egresados-count', total);

        // Actualizar contador en footer
        this.updateElement('total-count', total);

        // Actualizar porcentajes
        if (total > 0) {
            this.updateElement('porcentaje-titulados', `${Math.round((titulados / total) * 100)}%`);
            this.updateElement('porcentaje-estudiando', `${Math.round((estudiando / total) * 100)}%`);
            this.updateElement('porcentaje-historias', `${Math.round((conHistoria / total) * 100)}%`);
        }
    }

    populateFilters() {
        // Llenar generaciones dinámicamente de 1950 al año actual
        const selectGen = document.getElementById('filter-generacion');
        if (selectGen) {
            selectGen.innerHTML = '<option value="">Todas las generaciones</option>';
            const currentYear = new Date().getFullYear();
            for (let year = currentYear; year >= 1950; year--) {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = `Generación ${year}`;
                selectGen.appendChild(option);
            }
        }

        // Llenar estatus dinámicamente
        const estatusUnicos = [...new Set(this.egresados
            .map(e => e.estatus_estudios)
            .filter(e => e !== null && e !== undefined && e !== '')
        )].sort();

        const selectEstatus = document.getElementById('filter-estatus');
        if (selectEstatus) {
            selectEstatus.innerHTML = '<option value="">Todos los estatus</option>';
            estatusUnicos.forEach(estatus => {
                const opt = document.createElement('option');
                opt.value = estatus;
                // Capitalizar y formatear texto
                opt.textContent = estatus.charAt(0).toUpperCase() + estatus.slice(1);
                selectEstatus.appendChild(opt);
            });
        }
    }

    renderTable() {
        const tbody = document.getElementById('egresados-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';
        if (this.filteredEgresados.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">
                <i class="fas fa-search fa-2x mb-2"></i><p>No se encontraron egresados</p></td></tr>`;
            this.updateElement('showing-count', 0);
            return;
        }

        this.filteredEgresados.forEach(egresado => {
            tbody.appendChild(this.createTableRow(egresado));
        });

        this.updateElement('showing-count', this.filteredEgresados.length);
        this.updateElement('total-count', this.egresados.length);
    }

    createTableRow(e) {
        const tr = document.createElement('tr');
        const badges = {'titulado':'success','pasante':'info','estudiando':'primary','trabajando':'warning','otro':'secondary'};
        const badge = badges[e.estatus_estudios] || 'secondary';
        const status = e.estatus_estudios ? e.estatus_estudios.charAt(0).toUpperCase() + e.estatus_estudios.slice(1) : 'N/D';

        tr.innerHTML = `
            <td><strong>${this.esc(e.nombre)}</strong>
                ${e.historia_exito && e.autoriza_publicar ? '<br><small class="text-muted"><i class="fas fa-star text-warning"></i> Con historia</small>' : ''}
            </td>
            <td>${this.esc(e.generacion || 'N/D')}</td>
            <td><small><i class="fas fa-envelope me-1"></i>${this.esc(e.email || 'N/D')}<br>
                <i class="fas fa-phone me-1"></i>${this.esc(e.telefono || 'N/D')}</small></td>
            <td>${e.universidad ? '<strong>'+this.esc(e.universidad)+'</strong><br>' : ''}
                ${e.carrera ? '<small class="text-muted">'+this.esc(e.carrera)+'</small>' : ''}
                ${e.ocupacion_actual ? '<small class="text-muted">'+this.esc(e.ocupacion_actual)+'</small>' : ''}</td>
            <td><span class="badge bg-${badge}">${status}</span></td>
            <td class="text-center">${e.verificado ?
                '<i class="fas fa-check-circle text-success"></i>' :
                '<i class="fas fa-times-circle text-danger"></i>'}</td>
            <td class="text-center">
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" data-action="egresadosManager">
                        <i class="fas fa-eye"></i></button>
                    <button class="btn btn-outline-danger" data-action="egresadosManager">
                        <i class="fas fa-trash"></i></button>
                </div>
            </td>`;
        return tr;
    }

    showDetail(id) {
        const e = this.egresados.find(x => x.id === id);
        if (!e) return;

        const fecha = e.fecha_registro ? new Date(e.fecha_registro).toLocaleDateString('es-MX') : 'N/D';
        const content = document.getElementById('egresado-detail-content');
        if (!content) return;

        content.innerHTML = `
            <div class="row g-3">
                <div class="col-md-6">
                    <h6 class="text-primary"><i class="fas fa-user me-2"></i>Información Personal</h6>
                    <table class="table table-sm">
                        <tr><th>Nombre:</th><td>${this.esc(e.nombre)}</td></tr>
                        <tr><th>Email:</th><td>${this.esc(e.email||'N/D')}</td></tr>
                        <tr><th>Teléfono:</th><td>${this.esc(e.telefono||'N/D')}</td></tr>
                        <tr><th>Ciudad:</th><td>${this.esc(e.ciudad||'N/D')}</td></tr>
                        <tr><th>Generación:</th><td>${this.esc(e.generacion||'N/D')}</td></tr>
                        <tr><th>Año Egreso:</th><td>${this.esc(e.año_egreso||'N/D')}</td></tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6 class="text-success"><i class="fas fa-graduation-cap me-2"></i>Formación</h6>
                    <table class="table table-sm">
                        <tr><th>Universidad:</th><td>${this.esc(e.universidad||'N/D')}</td></tr>
                        <tr><th>Carrera:</th><td>${this.esc(e.carrera||'N/D')}</td></tr>
                        <tr><th>Estatus:</th><td>${this.esc(e.estatus_estudios||'N/D')}</td></tr>
                        <tr><th>Ocupación:</th><td>${this.esc(e.ocupacion_actual||'N/D')}</td></tr>
                        <tr><th>Verificado:</th><td>${e.verificado?'<span class="badge bg-success">Sí</span>':'<span class="badge bg-danger">No</span>'}</td></tr>
                    </table>
                </div>
                ${e.historia_exito ? `<div class="col-12">
                    <h6 class="text-warning"><i class="fas fa-star me-2"></i>Historia de Éxito</h6>
                    <div class="card bg-light"><div class="card-body">
                        <p class="mb-0">${this.esc(e.historia_exito)}</p>
                        ${e.autoriza_publicar?'<small class="text-success"><i class="fas fa-check"></i> Autorizado</small>':'<small class="text-danger"><i class="fas fa-times"></i> No autorizado</small>'}
                    </div></div>
                </div>` : ''}
                <div class="col-12">
                    <h6 class="text-info"><i class="fas fa-info-circle me-2"></i>Registro</h6>
                    <small class="text-muted"><strong>Fecha:</strong> ${fecha}<br>
                    <strong>IP:</strong> ${this.esc(e.ip_registro||'N/D')}</small>
                </div>
            </div>`;

        new bootstrap.Modal(document.getElementById('egresadoDetailModal')).show();
    }

    confirmDelete(id) {
        const e = this.egresados.find(x => x.id === id);
        if (!e || !confirm(`¿Eliminar a "${e.nombre}"?`)) return;
        this.deleteEgresado(id);
    }

    async deleteEgresado(id) {
        try {
            const res = await fetch(`${this.apiBaseUrl}/egresados/${id}`, {method:'DELETE'});
            const result = await res.json();
            if (result.success) {
                await this.loadEgresados();
                alert('Egresado eliminado correctamente');
            } else throw new Error(result.error);
        } catch (error) {
            console.error('❌ Error:', error);
            alert(`Error: ${error.message}`);
        }
    }

    setupEventListeners() {
        const search = document.getElementById('search-egresado');
        if (search) search.addEventListener('input', () => this.applyFilters());

        const gen = document.getElementById('filter-generacion');
        if (gen) gen.addEventListener('change', () => this.applyFilters());

        const est = document.getElementById('filter-estatus');
        if (est) est.addEventListener('change', () => this.applyFilters());

        const clear = document.getElementById('clear-filters-egresados');
        if (clear) clear.addEventListener('click', () => this.clearFilters());

        const refresh = document.getElementById('refresh-egresados');
        if (refresh) refresh.addEventListener('click', () => this.loadEgresados());
    }

    applyFilters() {
        const search = document.getElementById('search-egresado')?.value.toLowerCase() || '';
        const gen = document.getElementById('filter-generacion')?.value || '';
        const est = document.getElementById('filter-estatus')?.value || '';

        this.filteredEgresados = this.egresados.filter(e => {
            const matchSearch = !search || e.nombre.toLowerCase().includes(search);
            const matchGen = !gen || e.generacion === gen;
            const matchEst = !est || e.estatus_estudios === est;
            return matchSearch && matchGen && matchEst;
        });

        this.renderTable();
    }

    clearFilters() {
        ['search-egresado','filter-generacion','filter-estatus'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        this.filteredEgresados = [...this.egresados];
        this.renderTable();
    }

    updateElement(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }

    esc(txt) {
        if (!txt) return '';
        return String(txt).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
    }
}

// Inicializar
let egresadosManager;
document.addEventListener('DOMContentLoaded', function() {
    const tab = document.getElementById('egresados-tab');
    if (tab) {
        tab.addEventListener('shown.bs.tab', async function() {
            if (!egresadosManager) {
                egresadosManager = new EgresadosManager();
                await egresadosManager.init();
            }
        });
    }
});

// Funciones globales para onclick handlers
window.loadEgresados = async function() {
    if (egresadosManager) {
        await egresadosManager.loadEgresados();
    }
};

window.filterEgresados = function() {
    if (egresadosManager) {
        egresadosManager.applyFilters();
    }
};

window.exportEgresados = function() {
    if (egresadosManager) {
        egresadosManager.exportToCSV();
    }
};
