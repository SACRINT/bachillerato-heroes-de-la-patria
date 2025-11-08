/**
 * 🏢 TENANTS ADMIN MANAGER
 *
 * Propósito: Gestionar la administración de tenants (escuelas) en el sistema SaaS
 *
 * Funcionalidades:
 * - Listar todos los tenants
 * - Crear nuevos tenants
 * - Editar tenants existentes
 * - Eliminar tenants
 * - Sincronización con base de datos vía API
 *
 * Fecha: 8 de Noviembre de 2025
 * Versión: 1.0.0
 */

class TenantsAdminManager {
    constructor() {
        this.tenants = [];
        this.currentEditingId = null;
        this.init();
    }

    init() {
        console.log('[TENANTS-ADMIN] 🚀 Inicializando Tenants Admin Manager...');
        this.setupEventListeners();
        this.loadTenants();
    }

    setupEventListeners() {
        console.log('[TENANTS-ADMIN] 📋 Configurando event listeners...');

        // Botones de acción
        document.getElementById('btnNuevoTenant').addEventListener('click', () => this.showCreateForm());
        document.getElementById('btnRefreshTenants').addEventListener('click', () => this.loadTenants());
        document.getElementById('btnLimpiar').addEventListener('click', () => this.clearForm());

        // Formulario
        document.getElementById('tenantForm').addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Sincronización de color
        document.getElementById('primaryColor').addEventListener('change', (e) => {
            document.getElementById('primaryColorHex').value = e.target.value;
        });

        document.getElementById('primaryColorHex').addEventListener('change', (e) => {
            document.getElementById('primaryColor').value = e.target.value;
        });

        console.log('[TENANTS-ADMIN] ✅ Event listeners configurados');
    }

    /**
     * Cargar lista de tenants desde API
     */
    async loadTenants() {
        console.log('[TENANTS-ADMIN] 🔄 Cargando tenants...');

        const loadingEl = document.getElementById('loadingTenants');
        const listEl = document.getElementById('tenantsList');
        const emptyEl = document.getElementById('emptyStateTenants');

        // Mostrar loading
        loadingEl.style.display = 'block';
        listEl.style.display = 'none';
        emptyEl.style.display = 'none';

        try {
            const response = await fetch('/api/admin/tenants', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    // Endpoint no existe aún, usar datos vacíos
                    console.warn('[TENANTS-ADMIN] ⚠️ Endpoint no disponible, usando datos de demostración');
                    this.tenants = [];
                } else {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            } else {
                const data = await response.json();
                this.tenants = data.data || data.tenants || [];
                console.log('[TENANTS-ADMIN] ✅ Tenants cargados:', this.tenants.length);
            }

            this.renderTenantsTable();

        } catch (error) {
            console.error('[TENANTS-ADMIN] ❌ Error cargando tenants:', error);
            this.showAlert('Error al cargar tenants', 'danger');
            this.tenants = [];
            this.renderTenantsTable();
        } finally {
            loadingEl.style.display = 'none';
        }
    }

    /**
     * Renderizar tabla de tenants
     */
    renderTenantsTable() {
        console.log('[TENANTS-ADMIN] 📊 Renderizando tabla de tenants...');

        const tbody = document.getElementById('tenantTableBody');
        const listEl = document.getElementById('tenantsList');
        const emptyEl = document.getElementById('emptyStateTenants');

        tbody.innerHTML = '';

        if (this.tenants.length === 0) {
            listEl.style.display = 'none';
            emptyEl.style.display = 'block';
            console.log('[TENANTS-ADMIN] ℹ️ No hay tenants para mostrar');
            return;
        }

        listEl.style.display = 'block';
        emptyEl.style.display = 'none';

        this.tenants.forEach(tenant => {
            const row = document.createElement('tr');

            // Parsear config JSON si existe
            let schoolName = tenant.school_name || 'Sin nombre';
            if (tenant.config_json && typeof tenant.config_json === 'string') {
                try {
                    const config = JSON.parse(tenant.config_json);
                    schoolName = config.school?.name || schoolName;
                } catch (e) {
                    console.warn('[TENANTS-ADMIN] ⚠️ Error parseando config_json:', e);
                }
            }

            const statusClass = (tenant.status === 'activo') ? 'badge-activo' : 'badge-inactivo';
            const statusText = (tenant.status === 'activo') ? 'Activo' : 'Inactivo';
            const createdDate = tenant.created_at ? new Date(tenant.created_at).toLocaleDateString('es-ES') : '-';

            row.innerHTML = `
                <td><strong>#${tenant.id}</strong></td>
                <td>${schoolName}</td>
                <td><code>${tenant.domain}</code></td>
                <td><span class="badge-status ${statusClass}">${statusText}</span></td>
                <td>${createdDate}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-primary btn-sm" onclick="window.tenantsAdminManager.editTenant(${tenant.id})">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="window.tenantsAdminManager.deleteTenant(${tenant.id})">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </td>
            `;

            tbody.appendChild(row);
        });

        console.log('[TENANTS-ADMIN] ✅ Tabla renderizada con', this.tenants.length, 'tenants');
    }

    /**
     * Mostrar formulario para crear nuevo tenant
     */
    showCreateForm() {
        console.log('[TENANTS-ADMIN] 📝 Mostrando formulario de crear tenant');

        this.currentEditingId = null;
        document.getElementById('tenantId').value = '';
        document.getElementById('formTitle').textContent = 'Crear Nuevo Tenant';
        document.getElementById('submitBtnText').textContent = 'Guardar Tenant';
        this.clearForm();

        // Scroll al formulario
        document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Editar tenant existente
     */
    editTenant(tenantId) {
        console.log('[TENANTS-ADMIN] ✏️ Editando tenant:', tenantId);

        const tenant = this.tenants.find(t => t.id === tenantId);
        if (!tenant) {
            console.warn('[TENANTS-ADMIN] ⚠️ Tenant no encontrado:', tenantId);
            return;
        }

        this.currentEditingId = tenantId;

        // Parsear config JSON
        let config = {};
        if (tenant.config_json) {
            try {
                config = typeof tenant.config_json === 'string'
                    ? JSON.parse(tenant.config_json)
                    : tenant.config_json;
            } catch (e) {
                console.warn('[TENANTS-ADMIN] ⚠️ Error parseando config:', e);
            }
        }

        // Llenar formulario
        document.getElementById('tenantId').value = tenant.id;
        document.getElementById('schoolName').value = tenant.school_name || '';
        document.getElementById('domain').value = tenant.domain || '';
        document.getElementById('schoolAbbreviation').value = config.school?.abbreviation || '';
        document.getElementById('adminEmail').value = tenant.admin_email || '';
        document.getElementById('primaryColor').value = config.branding?.primaryColor || '#1976D2';
        document.getElementById('primaryColorHex').value = config.branding?.primaryColor || '#1976D2';
        document.getElementById('status').value = tenant.status || 'activo';

        // Actualizar UI
        document.getElementById('formTitle').textContent = `Editando: ${tenant.school_name}`;
        document.getElementById('submitBtnText').textContent = 'Actualizar Tenant';

        // Scroll al formulario
        document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });

        console.log('[TENANTS-ADMIN] ✅ Formulario cargado para edición');
    }

    /**
     * Manejar submit del formulario
     */
    async handleFormSubmit(e) {
        e.preventDefault();
        console.log('[TENANTS-ADMIN] 📤 Procesando submit del formulario...');

        // Validar formulario
        if (!document.getElementById('tenantForm').checkValidity()) {
            console.warn('[TENANTS-ADMIN] ⚠️ Formulario inválido');
            document.getElementById('tenantForm').classList.add('was-validated');
            return;
        }

        // Recopilar datos del formulario
        const tenantId = document.getElementById('tenantId').value;
        const isCreating = !tenantId;

        const tenantData = {
            school_name: document.getElementById('schoolName').value,
            domain: document.getElementById('domain').value,
            admin_email: document.getElementById('adminEmail').value,
            status: document.getElementById('status').value,
            config_json: {
                school: {
                    name: document.getElementById('schoolName').value,
                    abbreviation: document.getElementById('schoolAbbreviation').value,
                    clave: 'XXX0000000',
                    zone: 'unknown'
                },
                branding: {
                    primaryColor: document.getElementById('primaryColor').value,
                    secondaryColor: '#F57C00',
                    logoUrl: '/images/logo-bachillerato-HDLP.webp',
                    faviconUrl: '/images/favicon.ico'
                },
                contact: {
                    address: 'C. Manuel Ávila Camacho #7, Coronel Tito Hernández, V. Carranza, Puebla',
                    email: document.getElementById('adminEmail').value,
                    phone: 'Disponible próximamente',
                    hours: 'Lun - Vie: 8:00 AM - 1:30 PM'
                },
                features: {
                    googleOAuth: true,
                    tinymce: true,
                    pwaMobile: true,
                    darkMode: true,
                    notifications: true,
                    multiTenant: true
                }
            }
        };

        console.log('[TENANTS-ADMIN] 📋 Datos a enviar:', tenantData);

        try {
            const method = isCreating ? 'POST' : 'PUT';
            const url = isCreating ? '/api/admin/tenants' : `/api/admin/tenants/${tenantId}`;

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(tenantData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            console.log('[TENANTS-ADMIN] ✅ Operación exitosa:', result);

            const successMsg = isCreating
                ? 'Tenant creado exitosamente'
                : 'Tenant actualizado exitosamente';

            this.showAlert(successMsg, 'success');

            // Recargar y limpiar
            await this.loadTenants();
            this.clearForm();

        } catch (error) {
            console.error('[TENANTS-ADMIN] ❌ Error guardando tenant:', error);
            this.showAlert(`Error al guardar: ${error.message}`, 'danger');
        }
    }

    /**
     * Eliminar tenant
     */
    async deleteTenant(tenantId) {
        console.log('[TENANTS-ADMIN] 🗑️ Eliminando tenant:', tenantId);

        const tenant = this.tenants.find(t => t.id === tenantId);
        if (!tenant) return;

        // Confirmación
        if (!confirm(`¿Estás seguro de que deseas eliminar "${tenant.school_name}"? Esta acción no se puede deshacer.`)) {
            console.log('[TENANTS-ADMIN] ℹ️ Eliminación cancelada por usuario');
            return;
        }

        try {
            const response = await fetch(`/api/admin/tenants/${tenantId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            console.log('[TENANTS-ADMIN] ✅ Tenant eliminado');
            this.showAlert('Tenant eliminado exitosamente', 'success');

            // Recargar
            await this.loadTenants();
            this.clearForm();

        } catch (error) {
            console.error('[TENANTS-ADMIN] ❌ Error eliminando tenant:', error);
            this.showAlert(`Error al eliminar: ${error.message}`, 'danger');
        }
    }

    /**
     * Limpiar formulario
     */
    clearForm() {
        console.log('[TENANTS-ADMIN] 🧹 Limpiando formulario...');

        this.currentEditingId = null;
        document.getElementById('tenantForm').reset();
        document.getElementById('tenantForm').classList.remove('was-validated');
        document.getElementById('primaryColor').value = '#1976D2';
        document.getElementById('primaryColorHex').value = '#1976D2';
        document.getElementById('status').value = 'activo';
        document.getElementById('formTitle').textContent = 'Crear Nuevo Tenant';
        document.getElementById('submitBtnText').textContent = 'Guardar Tenant';
    }

    /**
     * Mostrar alert
     */
    showAlert(message, type = 'info') {
        console.log(`[TENANTS-ADMIN] 📢 Alert [${type}]:`, message);

        const alertContainer = document.getElementById('alertContainer');
        const alertId = `alert-${Date.now()}`;

        const alertHTML = `
            <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
                <strong>${type === 'success' ? '✅ Éxito:' : type === 'danger' ? '❌ Error:' : 'ℹ️ Información:'}</strong>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;

        alertContainer.insertAdjacentHTML('beforeend', alertHTML);

        // Auto-dismiss después de 5 segundos
        setTimeout(() => {
            const alertEl = document.getElementById(alertId);
            if (alertEl) {
                const alert = new bootstrap.Alert(alertEl);
                alert.close();
            }
        }, 5000);
    }
}

// Inicializar cuando DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('[TENANTS-ADMIN] 🎯 DOM cargado, iniciando TenantsAdminManager...');
    window.tenantsAdminManager = new TenantsAdminManager();
});

console.log('[TENANTS-ADMIN] 📦 Módulo tenants-admin-manager.js cargado');
