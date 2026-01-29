'use client';

import { Users, BookOpen, Calendar, TrendingUp, Clock, Award } from 'lucide-react';
import TeacherDashboardLayout from '@/components/TeacherDashboardLayout';
import StatsCard from '@/components/StatsCard';
import { useTeacherDashboard, useTeacherClasses } from '@/hooks/useTeacher';

export default function DocentesDashboard() {
    const { data: dashboardData, isLoading: dashboardLoading } = useTeacherDashboard();
    const { data: classes, isLoading: classesLoading } = useTeacherClasses();

    const stats = dashboardData?.data?.stats || dashboardData?.stats;
    const misClases = classes?.slice(0, 3) || [];

    const statsCards = [
        {
            title: 'Total de Estudiantes',
            value: stats?.totalStudents?.toString() || '0',
            icon: Users,
            iconColor: 'text-blue-600',
            iconBgColor: 'bg-blue-100',
        },
        {
            title: 'Clases Activas',
            value: stats?.totalClasses?.toString() || '0',
            icon: BookOpen,
            iconColor: 'text-emerald-600',
            iconBgColor: 'bg-emerald-100',
        },
        {
            title: 'Revisiones Pendientes',
            value: stats?.pendingReviews?.toString() || '0',
            icon: Clock,
            iconColor: 'text-orange-600',
            iconBgColor: 'bg-orange-100',
        },
        {
            title: 'Mensajes No Leídos',
            value: stats?.unreadMessages?.toString() || '0',
            icon: TrendingUp,
            iconColor: 'text-cyan-600',
            iconBgColor: 'bg-cyan-100',
        },
    ];

    const proximasClases = dashboardData?.data?.upcomingClasses || [];
    const tareasRecientes = dashboardData?.data?.pendingTasks || [];

    if (dashboardLoading || classesLoading) {
        return (
            <TeacherDashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Cargando...</div>
                </div>
            </TeacherDashboardLayout>
        );
    }

    return (
        <TeacherDashboardLayout>
            <div className="space-y-6">
                {/* Welcome Header */}
                <div className="rounded-xl bg-gradient-to-r from-blue-700 to-teal-700 p-6 text-white md:p-8">
                    <h1 className="text-3xl font-bold md:text-4xl">
                        Bienvenido, <span className="text-emerald-200">Profesor</span>
                    </h1>
                    <p className="mt-2 text-blue-100">
                        Gestiona tus clases, calificaciones y comunicación con estudiantes
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {statsCards.map((stat, index) => (
                        <StatsCard key={index} {...stat} />
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Mis Clases */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Mis Clases</h2>
                            <a
                                href="/dashboard/docentes/clases"
                                className="text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                                Ver todas →
                            </a>
                        </div>
                        <div className="space-y-3">
                            {misClases.length > 0 ? misClases.map((clase: any, index: number) => (
                                <div
                                    key={index}
                                    className="rounded-lg border border-gray-100 p-4 transition-colors hover:bg-gray-50"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">
                                                {clase.materia} {clase.grupo ? `- ${clase.grupo}` : ''}
                                            </div>
                                            <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Users className="h-4 w-4" />
                                                    {clase.total_estudiantes || clase.estudiantes || 0} estudiantes
                                                </span>
                                                {clase.salon && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-4 w-4" />
                                                        Aula {clase.salon}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-4 text-sm text-gray-500">
                                    No hay clases asignadas
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Próximas Clases */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Próximas Clases
                            </h2>
                            <a
                                href="/dashboard/docentes/calendario"
                                className="text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                                Ver calendario →
                            </a>
                        </div>
                        <div className="space-y-3">
                            {proximasClases.length > 0 ? proximasClases.map((clase: any, index: number) => (
                                <div
                                    key={index}
                                    className="rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">
                                                {clase.materia || clase.nombre}
                                            </div>
                                            <div className="mt-1 text-sm text-gray-500">
                                                {clase.grupo} {clase.aula && `• Aula ${clase.aula}`}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-medium text-blue-600">
                                                {clase.hora}
                                            </div>
                                            {clase.dia && <div className="text-xs text-gray-500">{clase.dia}</div>}
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-4 text-sm text-gray-500">
                                    No hay clases programadas
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tareas para Revisar */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Tareas para Revisar
                        </h2>
                        <a
                            href="/dashboard/docentes/tareas"
                            className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                            Ver todas →
                        </a>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {tareasRecientes.length > 0 ? tareasRecientes.map((tarea: any, index: number) => {
                            const porcentaje = Math.round(
                                (tarea.entregadas / tarea.total) * 100
                            );
                            return (
                                <div
                                    key={index}
                                    className="rounded-lg border border-gray-100 p-4 transition-colors hover:bg-gray-50"
                                >
                                    <div className="mb-2 font-medium text-gray-900">
                                        {tarea.titulo}
                                    </div>
                                    <div className="mb-2 text-sm text-gray-500">
                                        {tarea.materia}
                                    </div>
                                    <div className="mb-2">
                                        <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
                                            <span>
                                                {tarea.entregadas}/{tarea.total} entregadas
                                            </span>
                                            <span>{porcentaje}%</span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                                            <div
                                                className={`h-full rounded-full ${porcentaje === 100
                                                    ? 'bg-emerald-500'
                                                    : porcentaje >= 75
                                                        ? 'bg-blue-500'
                                                        : 'bg-orange-500'
                                                    }`}
                                                style={{ width: `${porcentaje}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Calendar className="h-3 w-3" />
                                        {tarea.fecha}
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="col-span-full text-center py-8 text-sm text-gray-500">
                                No hay tareas pendientes para revisar
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </TeacherDashboardLayout>
    );
}
