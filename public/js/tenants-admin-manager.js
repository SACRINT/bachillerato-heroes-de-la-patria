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
        void 0;
        this.setupEventListeners();
        this.loadTenants();
    }

    setupEventListeners() {
        void 0;

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

        void 0;
    }

    getAuthToken() {
        return localStorage.getItem('bge_auth_token') ||
            localStorage.getItem('authToken') ||
            sessionStorage.getItem('bge_auth_token') ||
            localStorage.getItem('token') || '';
    }

    /**
     * Cargar lista de tenants desde API
     */
    async loadTenants() {
        const loadingEl = document.getElementById('loadingTenants');
        const listEl = document.getElementById('tenantsList');
        const emptyEl = document.getElementById('emptyStateTenants');

        // Mostrar loading
        loadingEl.classList.remove('d-none');
        listEl.classList.add('d-none');
        emptyEl.classList.add('d-none');

        try {
            const token = this.getAuthToken();
            const response = await fetch('/api/admin/tenants', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    // Endpoint no existe aún, usar datos vacíos
                    void 0;
                    this.tenants = [];
                } else {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            } else {
                const data = await response.json();
                this.tenants = data.data || data.tenants || [];
                void 0;
            }

            this.renderTenantsTable();

        } catch (error) {
            console.error('[TENANTS-ADMIN] ❌ Error cargando tenants:', error);
            this.showAlert('Error al cargar tenants', 'danger');
            this.tenants = [];
            this.renderTenantsTable();
        } finally {
            loadingEl.classList.add('d-none');
        }
    }

    /**
     * Renderizar tabla de tenants
     */
    renderTenantsTable() {
        void 0;

        const tbody = document.getElementById('tenantTableBody');
        const listEl = document.getElementById('tenantsList');
        const emptyEl = document.getElementById('emptyStateTenants');

        tbody.innerHTML = DOMPurify.sanitize(sanitizeHTML(''));

        if (this.tenants.length === 0) {
            listEl.classList.add('d-none');
            emptyEl.classList.remove('d-none');
            void 0;
            return;
        }

        listEl.classList.remove('d-none');
        emptyEl.classList.add('d-none');

        this.tenants.forEach(tenant => {
            const row = document.createElement('tr');

            // Parsear config JSON si existe
            let schoolName = tenant.school_name || 'Sin nombre';
            if (tenant.config_json && typeof tenant.config_json === 'string') {
                try {
                    const config = JSON.parse(tenant.config_json);
                    schoolName = config.school?.name || schoolName;
                } catch (e) {
                    void 0;
                }
            }

            const statusClass = (tenant.status === 'activo') ? 'badge-activo' : 'badge-inactivo';
            const statusText = (tenant.status === 'activo') ? 'Activo' : 'Inactivo';
            const createdDate = tenant.created_at ? new Date(tenant.created_at).toLocaleDateString('es-ES') : '-';

            row.innerHTML = sanitizeHTML(`
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
            `);

            tbody.appendChild(row);
        });

        void 0;
    }

    /**
     * Mostrar formulario para crear nuevo tenant
     */
    showCreateForm() {
        void 0;

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
        void 0;

        const tenant = this.tenants.find(t => t.id === tenantId);
        if (!tenant) {
            void 0;
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
                void 0;
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

        void 0;
    }

    /**
     * Manejar submit del formulario
     */
    async handleFormSubmit(e) {
        e.preventDefault();
        void 0;

        // Validar formulario
        if (!document.getElementById('tenantForm').checkValidity()) {
            void 0;
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
                    logoUrl: '/images/logo/logo-general-bge.webp',
                    faviconUrl: '/images/logo/logo-general-bge.webp'
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

        void 0;

        try {
            const method = isCreating ? 'POST' : 'PUT';
            const url = isCreating ? '/api/admin/tenants' : `/api/admin/tenants/${tenantId}`;

            const token = this.getAuthToken();
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify(tenantData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            void 0;

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
        void 0;

        const tenant = this.tenants.find(t => t.id === tenantId);
        if (!tenant) return;

        // Confirmación
        if (!confirm(`¿Estás seguro de que deseas eliminar "${tenant.school_name}"? Esta acción no se puede deshacer.`)) {
            void 0;
            return;
        }

        try {
            const token = this.getAuthToken();
            const response = await fetch(`/api/admin/tenants/${tenantId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            void 0;
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
        void 0;

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
        void 0;

        const alertContainer = document.getElementById('alertContainer');
        const alertId = `alert-${Date.now()}`;

        const alertHTML = `
            <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
                <strong>${type === 'success' ? '✅ Éxito:' : type === 'danger' ? '❌ Error:' : 'ℹ️ Información:'}</strong>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;

        alertContainer.insertAdjacentHTML('beforeend', DOMPurify.sanitize(sanitizeHTML(alertHTML)));

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
document.addEventListener('DOMContentLoaded', function () {
    void 0;
    window.tenantsAdminManager = new TenantsAdminManager();
});

void 0;
