import { authManager } from '../../../core/auth/auth-manager';
import { StatsManager } from './stats-manager';
import { debugLog } from '../../../core/debug-logger';

declare const Chart: any;
declare const bootstrap: any; // Para modales si se usan

export class DashboardManager {
    private static instance: DashboardManager;
    private statsManager: StatsManager;
    private refreshInterval: any;
    private academicChart: any = null;

    private constructor() {
        this.statsManager = new StatsManager();
        this.init();
    }

    public static getInstance(): DashboardManager {
        if (!DashboardManager.instance) {
            DashboardManager.instance = new DashboardManager();
        }
        return DashboardManager.instance;
    }

    private async init(): Promise<void> {
        debugLog.log('DASHBOARD', '🚀 Dashboard Manager TS starting...');

        // Escuchar eventos de autenticación
        window.addEventListener('bge-user-logged-in', ((e: CustomEvent) => this.handleLogin(e.detail.user)) as unknown as EventListener);
        window.addEventListener('bge-user-logged-out', () => this.handleLogout());
        window.addEventListener('bge-auth-ready', () => this.checkInitialState());

        // Setup manual refresh button
        const refreshBtn = document.getElementById('refreshDashboardBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshDashboard());
        }
    }

    private async checkInitialState(): Promise<void> {
        if (authManager.isAuthenticated()) {
            const user = authManager.getCurrentUser();
            this.handleLogin(user);
        } else {
            this.hideAdminPanel();
        }
    }

    public async handleLogin(user: any): Promise<void> {
        if (!user) return;

        // Verificar rol
        const allowedRoles = ['admin', 'director', 'administrator'];
        if (allowedRoles.includes(user.role)) {
            debugLog.log('DASHBOARD', '✅ Admin access granted');
            this.showAdminPanel();
            await this.refreshDashboard();
            this.startAutoRefresh();
        } else {
            debugLog.log('DASHBOARD', 'ℹ️ User is not admin, hiding dashboard');
            this.hideAdminPanel();
        }
    }

    public handleLogout(): void {
        this.stopAutoRefresh();
        this.destroyCharts();
        this.hideAdminPanel();
        // Limpiar datos visuales
        this.resetUI();
    }

    private showAdminPanel(): void {
        const hero = document.getElementById('hero');
        const adminPanel = document.getElementById('adminPanel');

        if (hero) hero.style.display = 'none';

        document.body.style.paddingTop = '90px';

        if (adminPanel) {
            adminPanel.classList.remove('d-none');
            // Scroll to it
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 300);
        }

        // Update User Info in Dashboard Header
        const user = authManager.getCurrentUser();
        if (user) {
            const welcomeMsg = document.getElementById('adminWelcomeMsg');
            if (welcomeMsg) welcomeMsg.textContent = `Bienvenido, ${user.nombre || 'Administrador'}`;
        }
    }

    private hideAdminPanel(): void {
        const hero = document.getElementById('hero');
        const adminPanel = document.getElementById('adminPanel');

        if (hero) {
            hero.style.display = '';
            hero.style.visibility = 'visible';
            hero.style.opacity = '1';
        }

        document.body.style.paddingTop = '';

        if (adminPanel) {
            adminPanel.classList.add('d-none');
        }
    }

    private async refreshDashboard(): Promise<void> {
        const btn = document.getElementById('refreshDashboardBtn');
        if (btn) {
            btn.classList.add('fa-spin');
            (btn as HTMLButtonElement).disabled = true;
        }

        try {
            const stats = await this.statsManager.loadStats();
            this.updateStatsUI(stats);

            // Recargar gráfico si existe datos históricos (placeholder)
            this.updateCharts();

            // Update timestamp
            const timeEl = document.getElementById('lastUpdateTimestamp');
            if (timeEl) {
                timeEl.textContent = new Date().toLocaleTimeString();
            }

        } catch (error) {
            debugLog.error('DASHBOARD', 'Error refreshing dashboard', error);
        } finally {
            if (btn) {
                btn.classList.remove('fa-spin');
                (btn as HTMLButtonElement).disabled = false;
            }
        }
    }

    private updateStatsUI(stats: any): void {
        this.setElementText('totalStudentsValue', stats.totalStudents);
        this.setElementText('totalTeachersValue', stats.totalTeachers);
        this.setElementText('totalSubjectsValue', stats.totalSubjects);
        this.setElementText('generalAverageValue', stats.generalAverage);

        // Elementos adicionales del dashboard antiguo
        this.setElementText('activeUsersCount', stats.activeUsers);
        this.setElementText('contentItemsCount', stats.contentItems);
    }

    private setElementText(id: string, value: any): void {
        const el = document.getElementById(id);
        if (el) el.textContent = value.toString();
    }

    private updateCharts(): void {
        // Implementación básica de Chart.js basada en el original
        const ctx = document.getElementById('academicChart') as HTMLCanvasElement;
        if (!ctx) return;

        if (this.academicChart) {
            this.academicChart.destroy();
        }

        if (typeof Chart !== 'undefined') {
            this.academicChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Promedio General',
                        data: [8.2, 8.3, 8.1, 8.4, 8.5, 8.4],
                        borderColor: '#0d6efd',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
    }

    private destroyCharts(): void {
        if (this.academicChart) {
            this.academicChart.destroy();
            this.academicChart = null;
        }
    }

    private startAutoRefresh(): void {
        if (this.refreshInterval) clearInterval(this.refreshInterval);
        this.refreshInterval = setInterval(() => this.refreshDashboard(), 60000); // 1 min
    }

    private stopAutoRefresh(): void {
        if (this.refreshInterval) clearInterval(this.refreshInterval);
    }

    private resetUI(): void {
        this.setElementText('totalStudentsValue', '-');
        this.setElementText('totalTeachersValue', '-');
    }
}

export const dashboardManager = DashboardManager.getInstance();

// Legacy compatibility
if (typeof window !== 'undefined') {
    (window as any).dashboardManagerTS = dashboardManager;
}
