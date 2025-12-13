/**
 * @fileoverview Admin Dashboard Module.
 * Migrated from public/js/admin-dashboard.js
 */

import Chart from 'chart.js/auto';
import { apiClient } from '../../core/api-client';
import { authInterface } from '../../core/auth';
import { sanitizeHTML } from '../../core/utils/sanitizer';

declare const bootstrap: any;

// Interfaces for Data Models
export interface DashboardStats {
    totalStudents: number;
    totalTeachers: number;
    totalSubjects: number;
    generalAverage: number;
}

export interface Student {
    id: string;
    nombre?: string;
    name?: string;
    semestre?: string;
    semester?: string;
    matricula?: string;
    promedio?: number | string;
    average?: number | string;
    estado?: string;
    status?: string;
    riskLevel?: string;
}

export interface Teacher {
    id: string;
    name: string;
    specialty: string;
    subjects: string[];
    workload: number;
    status: string;
}

export interface AnalyticsData {
    students?: any;
    teachers?: any;
    academic?: any;
    chatbot?: any;
    [key: string]: any;
}

export interface PendingRegistration {
    email: string;
    nombre: string;
    apellido_paterno: string;
    telefono: string;
    tipo_usuario: string;
    fecha_solicitud: string;
    motivo: string;
    matricula?: string;
}

export interface DashboardData {
    analytics?: AnalyticsData;
    students: Student[];
    teachers: Teacher[];
    statistics: DashboardStats;
    pendingRegistrations?: PendingRegistration[];
    lastUpdate: string;
}

export class AdminDashboard {
    private isLoggedIn: boolean = false;
    private academicChart: Chart | null = null;
    private dashboardData: DashboardData = {
        students: [],
        teachers: [],
        statistics: { totalStudents: 0, totalTeachers: 0, totalSubjects: 0, generalAverage: 0 },
        lastUpdate: new Date().toISOString()
    };
    private refreshInterval: any = null;

    constructor() {
        this.init();
    }

    private async init(): Promise<void> {
        // Only run dashboard logic on admin pages
        const currentPage = window.location.pathname;
        const isAdminPage = currentPage.includes('admin-') || currentPage.includes('dashboard');

        if (!isAdminPage) {
            // On non-admin pages, just skip initialization
            console.log('🔧 AdminDashboard: Skipping - not an admin page');
            return;
        }

        await this.checkAuthentication();
        this.setupInterface();

        if (this.isLoggedIn && this.isAdmin()) {
            await this.loadDashboardData();
            this.showDashboard();
            this.updateDashboardUI();
            this.displayPendingRegistrations();
            this.startAutoRefresh();
        } else {
            this.showLoginPrompt();
        }
    }

    private setupInterface(): void {
        console.log('🔧 AdminDashboard: Interface setup');
    }

    private async checkAuthentication(): Promise<void> {
        // Use authInterface as the source of truth
        if (authInterface.currentUser) {
            this.isLoggedIn = true;
        } else {
            // Try to restore session via authInterface logic directly
            // Assuming authInterface constructor already tried to restore
            this.isLoggedIn = !!authInterface.currentUser;
        }
    }

    private isAdmin(): boolean {
        const user = authInterface.currentUser;
        if (!user) return false;

        // Check flexible roles
        const validRoles = ['admin', 'administrativo', 'directivo'];
        return validRoles.includes(user.tipo_usuario) || validRoles.includes((user as any).role || '');
    }

    private showLoginPrompt(): void {
        alert('Acceso restringido: Debes iniciar sesión como administrador para acceder al dashboard.');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }

    private showDashboard(): void {
        const dashboardSection = document.querySelector('.dashboard-section') as HTMLElement;
        if (dashboardSection) dashboardSection.style.display = 'block';

        const loginSection = document.querySelector('.login-section') as HTMLElement;
        if (loginSection) loginSection.style.display = 'none';

        document.getElementById('adminPanel')?.classList.remove('d-none');
    }

    // ============================================
    // DATA LOADING
    // ============================================

    public async loadDashboardData(): Promise<void> {
        try {
            await this.loadPendingRegistrations();

            // Parallel loading
            // Note: In a real migration we might want to consolidate this if endpoints allow
            // keeping original structure for now.
            const stats = await this.loadAnalytics();
            const studentsData = await this.loadStudentsData();
            const teachersData = await this.loadTeachersData();

            this.dashboardData = {
                analytics: stats,
                students: studentsData.students || [],
                teachers: teachersData.teachers || teachersData, // Handle different API shapes
                statistics: {
                    totalStudents: stats?.students?.total_estudiantes || studentsData?.overview?.totalStudents || 1247,
                    totalTeachers: stats?.teachers?.total_docentes || studentsData?.overview?.totalTeachers || 68,
                    totalSubjects: stats?.academic?.materias_activas || studentsData?.overview?.totalSubjects || 42,
                    generalAverage: stats?.academic?.promedio_general || studentsData?.overview?.generalAverage || 8.4
                },
                lastUpdate: new Date().toISOString(),
                pendingRegistrations: this.dashboardData.pendingRegistrations
            };

        } catch (error) {
            console.error('Dashboard Load Error', error);
            this.showErrorState(error);
        }
    }

    private async loadAnalytics(): Promise<any> {
        try {
            const response = await apiClient.get<any>('/api/analytics/dashboard');
            return response.success ? response.data : this.getDemoAnalytics();
        } catch {
            return this.getDemoAnalytics();
        }
    }

    private async loadStudentsData(): Promise<any> {
        try {
            const response = await apiClient.get<any>('/api/admin/students?limit=10');
            return response.success ? response.data : this.getDemoStudents();
        } catch {
            return this.getDemoStudents();
        }
    }

    private async loadTeachersData(): Promise<any> {
        try {
            const response = await apiClient.get<any>('/api/admin/teachers?limit=10');
            return response.success ? response.data : this.getDemoStudents().teachers;
        } catch {
            return this.getDemoStudents().teachers;
        }
    }

    // ============================================
    // UI RENDERING
    // ============================================

    public updateDashboardUI(): void {
        const stats = this.dashboardData.statistics;
        if (stats) {
            const mappings: Record<string, number> = {
                'totalStudents': stats.totalStudents,
                'totalTeachers': stats.totalTeachers,
                'totalSubjects': stats.totalSubjects,
                'generalAverage': stats.generalAverage
            };

            Object.entries(mappings).forEach(([id, value]) => {
                const el = document.getElementById(id);
                if (el) el.textContent = String(value);
            });
        }

        this.renderStudentsTable();
        this.renderTeachersTable();
        this.createAcademicChart(); // Re-create chart
    }

    private renderStudentsTable(): void {
        const tbody = document.getElementById('studentsTable');
        if (!tbody) return;

        tbody.innerHTML = '';
        const students = this.dashboardData.students || [];

        students.forEach(student => {
            const row = document.createElement('tr');

            // Normalize data
            const id = student.matricula || student.id || 'N/A';
            const name = student.nombre || student.name || 'Sin nombre';
            const semester = student.semestre || student.semester || 'N/A';
            const avg = Number(student.promedio || student.average || 0);
            const status = student.estado || student.status || 'Activo';

            row.innerHTML = sanitizeHTML(`
                <td><strong>${id}</strong></td>
                <td>${name}</td>
                <td class="text-center"><span class="badge bg-info">${semester}°</span></td>
                <td class="text-center"><span class="badge ${this.getGradeColorClass(avg)}">${avg.toFixed(2)}</span></td>
                <td class="text-center"><span class="badge ${status === 'Activo' ? 'bg-success' : 'bg-danger'}">${status}</span></td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="window.adminDashboard.viewStudent('${student.id || id}')" title="Ver"><i class="fas fa-eye"></i></button>
                        <button class="btn btn-outline-success" onclick="window.adminDashboard.editStudent('${student.id || id}')" title="Editar"><i class="fas fa-edit"></i></button>
                    </div>
                </td>
            `);
            tbody.appendChild(row);
        });
    }

    private renderTeachersTable(): void {
        const tbody = document.getElementById('teachersTable');
        if (!tbody) return;

        tbody.innerHTML = '';
        const teachers = this.dashboardData.teachers || [];

        teachers.forEach(teacher => {
            const row = document.createElement('tr');
            const statusBadge = teacher.status === 'Activo' ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-secondary">Inactivo</span>';

            row.innerHTML = sanitizeHTML(`
                <td><strong>${teacher.name}</strong></td>
                <td>${teacher.specialty}</td>
                <td><small>${teacher.subjects ? teacher.subjects.join(', ') : 'N/A'}</small></td>
                <td class="text-center"><span class="badge bg-info">${teacher.workload}h</span></td>
                <td class="text-center">${statusBadge}</td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="window.adminDashboard.viewTeacher('${teacher.id}')"><i class="fas fa-eye"></i></button>
                    </div>
                </td>
            `);
            tbody.appendChild(row);
        });
    }

    private getGradeColorClass(grade: number): string {
        if (grade >= 9) return 'bg-success';
        if (grade >= 8) return 'bg-primary';
        if (grade >= 7) return 'bg-info';
        if (grade >= 6) return 'bg-warning';
        return 'bg-danger';
    }

    // ============================================
    // CHARTS
    // ============================================

    private createAcademicChart(): void {
        const ctx = document.getElementById('academicChart') as HTMLCanvasElement;
        if (!ctx) return;

        if (this.academicChart) {
            this.academicChart.destroy();
        }

        const months = ['Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene'];

        this.academicChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [
                    {
                        label: '1° Semestre',
                        data: [8.2, 8.4, 8.6, 8.5, 8.7, 8.7],
                        borderColor: '#198754',
                        backgroundColor: '#19875420',
                        tension: 0.4,
                        fill: false
                    },
                    {
                        label: '3° Semestre',
                        data: [7.8, 8.0, 8.2, 8.3, 8.4, 8.4],
                        borderColor: '#0d6efd',
                        backgroundColor: '#0d6efd20',
                        tension: 0.4,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 6,
                        max: 10
                    }
                }
            }
        });
    }

    // ============================================
    // REGISTRATIONS
    // ============================================

    private async loadPendingRegistrations(): Promise<void> {
        try {
            const response = await apiClient.get<any>('/api/admin/pending-registrations');
            if (response.success) {
                this.dashboardData.pendingRegistrations = response.data;
            } else {
                this.loadLocalRegistrations();
            }
        } catch {
            this.loadLocalRegistrations();
        }
        this.updatePendingCounter();
    }

    private loadLocalRegistrations(): void {
        const local = JSON.parse(localStorage.getItem('pending_registrations') || '[]');
        this.dashboardData.pendingRegistrations = local;
    }

    private displayPendingRegistrations(): void {
        const container = document.getElementById('pending-registrations-container');
        if (!container) return;

        const registrations = this.dashboardData.pendingRegistrations || [];

        if (registrations.length === 0) {
            container.innerHTML = sanitizeHTML(`
                <div class="text-center py-4">
                    <p class="text-muted">No hay solicitudes pendientes</p>
                </div>
            `);
            return;
        }

        // We use global function references for onClick in this simple migration
        // ideally we would attach event listeners, but for string HTML generation this is cleaner for now
        const html = registrations.map(reg => `
            <div class="card mb-3">
                <div class="card-header d-flex justify-content-between">
                    <h6 class="mb-0">${reg.nombre} ${reg.apellido_paterno}</h6>
                    <span class="badge bg-warning">Pendiente</span>
                </div>
                <div class="card-body">
                    <p><strong>Email:</strong> ${reg.email}</p>
                    <p><strong>Tipo:</strong> ${reg.tipo_usuario}</p>
                    <button class="btn btn-success btn-sm" onclick="window.adminDashboard.approveRegistration('${reg.email}')">Aprobar</button>
                    <button class="btn btn-danger btn-sm" onclick="window.adminDashboard.rejectRegistration('${reg.email}')">Rechazar</button>
                </div>
            </div>
        `).join('');

        container.innerHTML = sanitizeHTML(html);
    }

    private updatePendingCounter(): void {
        const count = this.dashboardData.pendingRegistrations?.length || 0;
        const badge = document.getElementById('pending-count');
        if (badge) {
            badge.textContent = String(count);
            badge.style.display = count > 0 ? 'inline' : 'none';
        }
    }

    // ============================================
    // ACTIONS (Exposed for HTML interactions)
    // ============================================

    public async approveRegistration(email: string): Promise<void> {
        if (!confirm('¿Aprobar solicitud?')) return;
        try {
            await apiClient.post('/api/admin/approve-registration', { email });
            authInterface.showToast('success', 'Aprobado', 'Solicitud aprobada');
            this.removeLocalRegistration(email);
            this.loadPendingRegistrations(); // Reload
            this.displayPendingRegistrations();
        } catch (e) {
            console.error(e);
            authInterface.showToast('danger', 'Error', 'Falló la aprobación');
        }
    }

    public async rejectRegistration(email: string): Promise<void> {
        const reason = prompt('Motivo:');
        if (!reason) return;
        try {
            await apiClient.post('/api/admin/reject-registration', { email, reason });
            authInterface.showToast('info', 'Rechazado', 'Solicitud rechazada');
            this.removeLocalRegistration(email);
            this.loadPendingRegistrations();
            this.displayPendingRegistrations();
        } catch (e) {
            authInterface.showToast('danger', 'Error', 'Falló el rechazo');
        }
    }

    private removeLocalRegistration(email: string): void {
        const local = JSON.parse(localStorage.getItem('pending_registrations') || '[]');
        const filtered = local.filter((r: any) => r.email !== email);
        localStorage.setItem('pending_registrations', JSON.stringify(filtered));
    }

    public viewStudent(id: string): void {
        const s = this.dashboardData.students.find(x => x.id === id || x.matricula === id);
        if (!s) return;
        alert(`Detalles Estudiante: ${s.name || s.nombre}\nPromedio: ${s.average || s.promedio}`);
    }

    public editStudent(id: string): void {
        authInterface.showToast('info', 'Editar', `Función editar ${id} en desarrollo`);
    }

    public viewTeacher(id: string): void {
        const t = this.dashboardData.teachers.find(x => x.id === id);
        if (!t) return;
        alert(`Docente: ${t.name}\nEspecialidad: ${t.specialty}`);
    }

    public startAutoRefresh(): void {
        this.refreshInterval = setInterval(() => {
            if (!document.hidden && this.isLoggedIn) {
                this.loadDashboardData().then(() => {
                    this.updateDashboardUI();
                    this.displayPendingRegistrations();
                });
            }
        }, 10 * 60 * 1000);
    }

    // Demo Data
    private getDemoAnalytics() { return { students: { total_estudiantes: 1200 }, teachers: { total_docentes: 60 } }; }
    private getDemoStudents() {
        return {
            overview: { totalStudents: 1200, totalTeachers: 60 },
            students: [
                { id: '2023001', name: 'Juan Demo', semester: '3', average: 8.5, status: 'Activo' }
            ],
            teachers: [
                { id: 'T01', name: 'Prof. Demo', specialty: 'Ciencias', subjects: ['Física'], workload: 20, status: 'Activo' }
            ]
        };
    }

    private showErrorState(e: any): void {
        const container = document.querySelector('.dashboard-section');
        if (container) {
            container.insertAdjacentHTML('afterbegin', sanitizeHTML(`<div class="alert alert-warning">Error cargando dashboard: ${e.message}</div>`));
        }
    }
}

// Global Export
export const adminDashboard = new AdminDashboard();
(window as any).adminDashboard = adminDashboard;
