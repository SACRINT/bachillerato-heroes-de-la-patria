/**
 * 🎛️ SUPER ADMIN DASHBOARD - JavaScript
 * Lógica del Panel de Super-Administrador
 * FASE 5 - Dashboard Multi-Tenant
 * Creado: 07 Diciembre 2025
 */

const SuperAdminDashboard = {
    API_BASE: '/api/super-admin',
    charts: {},

    /**
     * Inicializar dashboard
     */
    async init() {
        console.log('[SUPER-ADMIN] 🎛️ Inicializando dashboard...');

        // Verificar autenticación
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        // Cargar datos iniciales
        await this.loadDashboardStats();
        await this.loadTenants();
        await this.loadCharts();

        // Event listeners
        this.setupEventListeners();

        console.log('[SUPER-ADMIN] ✅ Dashboard inicializado');
    },

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Refresh button
        document.getElementById('btnRefresh')?.addEventListener('click', () => {
            this.refresh();
        });

        // New tenant button
        document.getElementById('btnNewTenant')?.addEventListener('click', () => {
            this.showNewTenantModal();
        });

        // Search input
        document.getElementById('searchInput')?.addEventListener('input', (e) => {
            this.filterTenants(e.target.value);
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                if (section) {
                    this.switchSection(section);
                }
            });
        });
    },

    /**
     * Hacer petición autenticada
     */
    async fetchAPI(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${this.API_BASE}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login.html';
            throw new Error('No autorizado');
        }

        return response.json();
    },

    /**
     * Cargar estadísticas del dashboard
     */
    async loadDashboardStats() {
        try {
            const result = await this.fetchAPI('/dashboard');

            if (result.success) {
                const stats = result.data;

                // Actualizar stats cards
                this.updateElement('totalTenants', stats.totalTenants);
                this.updateElement('activeSubscriptions', stats.activeTenants);
                this.updateElement('trialCount', stats.trialTenants);
                this.updateElement('monthlyRevenue', this.formatCurrency(stats.monthlyRevenue));
                this.updateElement('yearlyRevenue', this.formatNumber(stats.yearlyRevenue));
                this.updateElement('totalUsers', this.formatNumber(stats.totalUsers));
                this.updateElement('studentCount', this.formatNumber(stats.totalStudents));

                // Growth change
                const growthChange = document.getElementById('tenantsChange');
                if (growthChange) {
                    const isPositive = stats.growthRate >= 0;
                    growthChange.className = `stat-change ${isPositive ? 'positive' : 'negative'}`;
                    growthChange.innerHTML = `<span>${isPositive ? '↑' : '↓'}</span> ${Math.abs(stats.growthRate)}% vs mes anterior`;
                }
            }
        } catch (error) {
            console.error('[SUPER-ADMIN] Error cargando stats:', error);
            this.showError('Error cargando estadísticas');
        }
    },

    /**
     * Cargar lista de tenants
     */
    async loadTenants(search = '') {
        try {
            const endpoint = search ? `/tenants?search=${encodeURIComponent(search)}` : '/tenants';
            const result = await this.fetchAPI(endpoint);

            if (result.success) {
                this.renderTenantsTable(result.data);
            }
        } catch (error) {
            console.error('[SUPER-ADMIN] Error cargando tenants:', error);
            this.showError('Error cargando escuelas');
        }
    },

    /**
     * Renderizar tabla de tenants
     */
    renderTenantsTable(tenants) {
        const tbody = document.getElementById('tenantsBody');
        if (!tbody) return;

        if (tenants.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                        No se encontraron escuelas
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = tenants.map(tenant => `
            <tr data-tenant-id="${tenant.id}">
                <td>
                    <div class="tenant-name">
                        <strong>${this.escapeHtml(tenant.school_name)}</strong>
                        <span>${this.escapeHtml(tenant.domain)}</span>
                    </div>
                </td>
                <td>${tenant.plan_name || 'Sin plan'}</td>
                <td>
                    <span class="status-badge ${this.getStatusClass(tenant.subscription_status || tenant.status)}">
                        ${this.formatStatus(tenant.subscription_status || tenant.status)}
                    </span>
                </td>
                <td>${tenant.student_count || 0}</td>
                <td>${tenant.teacher_count || 0}</td>
                <td>${this.formatDate(tenant.last_activity)}</td>
                <td>
                    <button class="btn btn-sm" onclick="SuperAdminDashboard.viewTenant(${tenant.id})">
                        👁️ Ver
                    </button>
                </td>
            </tr>
        `).join('');
    },

    /**
     * Cargar gráficos
     */
    async loadCharts() {
        await Promise.all([
            this.loadGrowthChart(),
            this.loadSubscriptionsChart()
        ]);
    },

    /**
     * Cargar gráfico de crecimiento
     */
    async loadGrowthChart() {
        try {
            const result = await this.fetchAPI('/charts/growth?months=12');
            if (!result.success) return;

            const ctx = document.getElementById('growthChart')?.getContext('2d');
            if (!ctx) return;

            // Destruir chart existente
            if (this.charts.growth) {
                this.charts.growth.destroy();
            }

            const data = result.data.reverse();

            this.charts.growth = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.map(d => this.formatMonth(d.month)),
                    datasets: [{
                        label: 'Nuevas Escuelas',
                        data: data.map(d => d.new_tenants),
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        fill: true,
                        tension: 0.4
                    }, {
                        label: 'Total Acumulado',
                        data: data.map(d => d.cumulative_tenants),
                        borderColor: '#10b981',
                        borderDash: [5, 5],
                        fill: false,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: { color: '#94a3b8' }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: '#334155' },
                            ticks: { color: '#94a3b8' }
                        },
                        x: {
                            grid: { color: '#334155' },
                            ticks: { color: '#94a3b8' }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('[SUPER-ADMIN] Error cargando growth chart:', error);
        }
    },

    /**
     * Cargar gráfico de suscripciones
     */
    async loadSubscriptionsChart() {
        try {
            const result = await this.fetchAPI('/charts/subscriptions');
            if (!result.success) return;

            const ctx = document.getElementById('subscriptionsChart')?.getContext('2d');
            if (!ctx) return;

            // Destruir chart existente
            if (this.charts.subscriptions) {
                this.charts.subscriptions.destroy();
            }

            const data = result.data;
            const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

            this.charts.subscriptions = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: data.map(d => d.plan_name),
                    datasets: [{
                        data: data.map(d => d.subscriber_count || 0),
                        backgroundColor: colors,
                        borderColor: '#1e293b',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: '#94a3b8' }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('[SUPER-ADMIN] Error cargando subscriptions chart:', error);
        }
    },

    /**
     * Filtrar tenants por búsqueda
     */
    filterTenants(search) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.loadTenants(search);
        }, 300);
    },

    /**
     * Ver detalles de tenant
     */
    async viewTenant(tenantId) {
        try {
            const result = await this.fetchAPI(`/tenants/${tenantId}`);
            if (result.success) {
                console.log('Tenant details:', result.data);
                // TODO: Mostrar modal con detalles
                alert(`Detalles de: ${result.data.tenant.school_name}\n\nEstudiantes: ${result.data.userStats.find(u => u.role === 'estudiante')?.count || 0}\nDocentes: ${result.data.userStats.find(u => u.role === 'docente')?.count || 0}`);
            }
        } catch (error) {
            console.error('[SUPER-ADMIN] Error:', error);
        }
    },

    /**
     * Mostrar modal nueva escuela
     */
    showNewTenantModal() {
        // TODO: Implementar modal
        alert('Función de crear nueva escuela - Próximamente');
    },

    /**
     * Refrescar datos
     */
    async refresh() {
        const btn = document.getElementById('btnRefresh');
        if (btn) btn.disabled = true;

        await this.loadDashboardStats();
        await this.loadTenants();
        await this.loadCharts();

        if (btn) btn.disabled = false;
    },

    /**
     * Cambiar sección
     */
    switchSection(section) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === section);
        });
        // TODO: Implementar cambio de secciones
        console.log('Cambiar a sección:', section);
    },

    // ==================== UTILIDADES ====================

    updateElement(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    },

    formatCurrency(amount) {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 0
        }).format(amount || 0);
    },

    formatNumber(num) {
        return new Intl.NumberFormat('es-MX').format(num || 0);
    },

    formatDate(dateString) {
        if (!dateString) return 'Nunca';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    },

    formatMonth(monthString) {
        if (!monthString) return '';
        const [year, month] = monthString.split('-');
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return `${months[parseInt(month) - 1]} ${year.slice(2)}`;
    },

    formatStatus(status) {
        const statusMap = {
            'active': 'Activo',
            'trial': 'Trial',
            'past_due': 'Pago pendiente',
            'cancelled': 'Cancelado',
            'expired': 'Expirado'
        };
        return statusMap[status] || status || 'Sin plan';
    },

    getStatusClass(status) {
        const classMap = {
            'active': 'active',
            'trial': 'trial',
            'past_due': 'expired',
            'cancelled': 'expired',
            'expired': 'expired'
        };
        return classMap[status] || 'trial';
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    },

    showError(message) {
        console.error('[SUPER-ADMIN]', message);
        // TODO: Mostrar notificación de error
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    SuperAdminDashboard.init();
});
