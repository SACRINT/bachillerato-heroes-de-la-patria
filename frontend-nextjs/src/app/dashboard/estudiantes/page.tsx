'use client';

import { Trophy, TrendingUp, BookOpen, Zap, Calendar, Award } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import StatsCard from '@/components/StatsCard';

export default function EstudiantesDashboard() {
    // TODO: Replace with real data from React Query
    const stats = [
        {
            title: 'Promedio General',
            value: '8.7',
            icon: TrendingUp,
            trend: { value: 5.2, isPositive: true },
            iconColor: 'text-blue-600',
            iconBgColor: 'bg-blue-100',
        },
        {
            title: 'Tareas Pendientes',
            value: '3',
            icon: Calendar,
            iconColor: 'text-orange-600',
            iconBgColor: 'bg-orange-100',
        },
        {
            title: 'Racha de Estudio',
            value: '12 días',
            icon: Zap,
            trend: { value: 8.3, isPositive: true },
            iconColor: 'text-emerald-600',
            iconBgColor: 'bg-emerald-100',
        },
        {
            title: 'IA Coins',
            value: '2,450',
            icon: Trophy,
            trend: { value: 15.0, isPositive: true },
            iconColor: 'text-cyan-600',
            iconBgColor: 'bg-cyan-100',
        },
    ];

    const recentGrades = [
        { materia: 'Matemáticas', calificacion: 9.5, fecha: '15 Ene 2026', tipo: 'Examen' },
        { materia: 'Química', calificacion: 8.8, fecha: '14 Ene 2026', tipo: 'Tarea' },
        { materia: 'Historia', calificacion: 9.0, fecha: '13 Ene 2026', tipo: 'Participación' },
        { materia: 'Inglés', calificacion: 8.5, fecha: '12 Ene 2026', tipo: 'Examen' },
    ];

    const upcomingAssignments = [
        {
            materia: 'Física',
            titulo: 'Laboratorio de Cinemática',
            fecha: '22 Ene 2026',
            prioridad: 'alta',
        },
        {
            materia: 'Literatura',
            titulo: 'Ensayo sobre el Modernismo',
            fecha: '24 Ene 2026',
            prioridad: 'media',
        },
        {
            materia: 'Programación',
            titulo: 'Proyecto Final - Sistema CRUD',
            fecha: '28 Ene 2026',
            prioridad: 'alta',
        },
    ];

    const achievements = [
        { titulo: 'Perfect Score', descripcion: 'Obtén un 10 en cualquier examen', icon: Award },
        {
            titulo: 'Racha de Fuego',
            descripcion: '7 días consecutivos estudiando',
            icon: Zap,
            unlocked: true,
        },
        {
            titulo: 'Bookworm',
            descripcion: 'Completa 20 lecciones',
            icon: BookOpen,
            unlocked: true,
        },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Welcome Header */}
                <div className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white md:p-8">
                    <h1 className="text-3xl font-bold md:text-4xl">
                        ¡Hola, <span className="text-cyan-200">Estudiante</span>!
                    </h1>
                    <p className="mt-2 text-blue-100">
                        Aquí está tu progreso del día. ¡Sigue así! 🚀
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat, index) => (
                        <StatsCard key={index} {...stat} />
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Recent Grades */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Calificaciones Recientes
                            </h2>
                            <a
                                href="/dashboard/estudiantes/calificaciones"
                                className="text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                                Ver todas →
                            </a>
                        </div>
                        <div className="space-y-3">
                            {recentGrades.map((grade, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50"
                                >
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900">
                                            {grade.materia}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {grade.tipo} • {grade.fecha}
                                        </div>
                                    </div>
                                    <div
                                        className={`text-2xl font-bold ${grade.calificacion >= 9
                                                ? 'text-emerald-600'
                                                : grade.calificacion >= 8
                                                    ? 'text-blue-600'
                                                    : 'text-orange-600'
                                            }`}
                                    >
                                        {grade.calificacion}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Upcoming Assignments */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Tareas Pendientes
                            </h2>
                            <a
                                href="/dashboard/estudiantes/tareas"
                                className="text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                                Ver todas →
                            </a>
                        </div>
                        <div className="space-y-3">
                            {upcomingAssignments.map((assignment, index) => (
                                <div
                                    key={index}
                                    className="rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">
                                                {assignment.titulo}
                                            </div>
                                            <div className="mt-1 text-sm text-gray-500">
                                                {assignment.materia}
                                            </div>
                                        </div>
                                        <span
                                            className={`rounded-full px-2 py-1 text-xs font-medium ${assignment.prioridad === 'alta'
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                                }`}
                                        >
                                            {assignment.prioridad === 'alta' ? 'Urgente' : 'Pronto'}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                                        <Calendar className="h-4 w-4" />
                                        {assignment.fecha}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Achievements */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Logros Recientes</h2>
                        <a
                            href="/dashboard/estudiantes/logros"
                            className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                            Ver todos →
                        </a>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {achievements.map((achievement, index) => {
                            const Icon = achievement.icon;
                            return (
                                <div
                                    key={index}
                                    className={`rounded-lg border p-4 transition-all ${achievement.unlocked
                                            ? 'border-emerald-200 bg-emerald-50'
                                            : 'border-gray-200 bg-gray-50 opacity-60'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={`flex h-10 w-10 items-center justify-center rounded-lg ${achievement.unlocked
                                                    ? 'bg-emerald-200'
                                                    : 'bg-gray-200'
                                                }`}
                                        >
                                            <Icon
                                                className={`h-5 w-5 ${achievement.unlocked
                                                        ? 'text-emerald-700'
                                                        : 'text-gray-500'
                                                    }`}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <div
                                                className={`font-medium ${achievement.unlocked
                                                        ? 'text-emerald-900'
                                                        : 'text-gray-600'
                                                    }`}
                                            >
                                                {achievement.titulo}
                                            </div>
                                            <div
                                                className={`text-sm ${achievement.unlocked
                                                        ? 'text-emerald-700'
                                                        : 'text-gray-500'
                                                    }`}
                                            >
                                                {achievement.descripcion}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
