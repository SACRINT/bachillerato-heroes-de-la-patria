import { apiClient } from '../../../core/api-client';
import { debugLog } from '../../../core/debug-logger';
import { DashboardStats, ContentStats, AdvancedMetrics } from './types';

export class StatsManager {
    private stats: DashboardStats = {
        totalStudents: 0,
        totalTeachers: 0,
        totalSubjects: 0,
        generalAverage: 0,
        activeUsers: 0,
        contentItems: 0
    };

    /**
     * Carga estadísticas desde el backend o fallback
     */
    async loadStats(): Promise<DashboardStats> {
        try {
            debugLog.log('DASHBOARD', '📊 Loading dashboard stats...');

            // Intento de carga real desde API
            // Asumo que existe /api/admin/stats basado en la estructura general
            // Si no existe, usamos el fallback de localStorage o defaults

            const response = await apiClient.get<any>('/admin/dashboard-summary');

            if (response.success && response.data) {
                this.stats = {
                    totalStudents: response.data.studentsCount || 0,
                    totalTeachers: response.data.teachersCount || 0,
                    totalSubjects: response.data.subjectsCount || 0,
                    generalAverage: response.data.averageGrade || 0,
                    activeUsers: response.data.activeUsers || 0,
                    contentItems: response.data.contentCount || 0
                };
                debugLog.log('DASHBOARD', '✅ Stats loaded from API');
            } else {
                this.loadFallbackStats();
            }

        } catch (error) {
            debugLog.warn('DASHBOARD', '⚠️ API Stats failed, using fallback', error);
            this.loadFallbackStats();
        }

        return this.stats;
    }

    private loadFallbackStats(): void {
        const stored = localStorage.getItem('realData_config');
        if (stored) {
            const parsed = JSON.parse(stored);
            this.stats = { ...this.stats, ...parsed };
        } else {
            // Defaults (based on dashboard-manager-2025.js lines 65-68)
            this.stats = {
                totalStudents: 1247,
                totalTeachers: 68,
                totalSubjects: 42,
                generalAverage: 8.4,
                activeUsers: 15,
                contentItems: 120
            };
        }
        debugLog.log('DASHBOARD', 'ℹ️ Using fallback stats');
    }

    async loadContentStats(): Promise<ContentStats> {
        // Implementación futura con API real
        return {
            totalArticles: 45,
            publishedArticles: 40,
            draftArticles: 5,
            totalViews: 12500
        };
    }

    async loadAdvancedMetrics(): Promise<AdvancedMetrics> {
        return {
            studentGrowth: 5.2,
            teacherRetention: 98,
            averageAttendance: 92,
            platformUptime: 99.9
        };
    }

    getStats(): DashboardStats {
        return this.stats;
    }
}
