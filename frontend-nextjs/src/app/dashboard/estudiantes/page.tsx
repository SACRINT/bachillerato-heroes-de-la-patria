'use client';

import StatsCard from '@/components/StatsCard';
import DashboardLayout from '@/components/DashboardLayout';
import { BookOpen, FileText, Flame, Trophy, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { useStudentProfile, useStudentGrades, useStudentAssignments } from '@/hooks/use-api';

export default function EstudiantesDashboardPage() {
    // Fetch real data with React Query
    const { data: profile, isLoading: profileLoading } = useStudentProfile();
    const { data: grades, isLoading: gradesLoading } = useStudentGrades();
    const { data: assignments, isLoading: assignmentsLoading } = useStudentAssignments('pendiente');

    // Calculate stats from real data
    const promedio = grades?.length
        ? (grades.reduce((sum, g) => sum + g.calificacion, 0) / grades.length).toFixed(1)
        : '0.0';

    const tareasCompletadas = assignments?.filter((a) => a.estado === 'calificada').length || 0;
    const tareasPendientes = assignments?.filter((a) => a.estado === 'pendiente').length || 0;

    const stats = [
        {
            title: 'Promedio General',
            value: profileLoading ? '...' : promedio,
            icon: BookOpen,
            trend: { value: 2.5, isPositive: true },
            iconColor: 'text-blue-600',
            iconBgColor: 'bg-blue-100',
        },
        {
            title: 'Tareas Pendientes',
            value: assignmentsLoading ? '...' : tareasPendientes.toString(),
            icon: FileText,
            iconColor: 'text-orange-600',
            iconBgColor: 'bg-orange-100',
        },
        {
            title: 'Racha de Estudio',
            value: '7 días',
            icon: Flame,
            trend: { value: 2, isPositive: true },
            iconColor: 'text-red-600',
            iconBgColor: 'bg-red-100',
        },
        {
            title: 'IA Coins',
            value: '2,450',
            icon: Trophy,
            iconColor: 'text-yellow-600',
            iconBgColor: 'bg-yellow-100',
            trend: { value: 15, isPositive: true },
        },
    ];

    // Mock logros (TODO: create API for achievements)
    const logros = [
        {
            nombre: 'Primera Semana Completa',
            descripcion: 'Completaste todas las tareas de una semana',
            icono: '🎯',
        },
        {
            nombre: 'Maestro de Matemáticas',
            descripcion: 'Obtuviste 10 en 3 exámenes seguidos',
            icono: '🧮',
        },
        {
            nombre: 'Racha de Fuego',
            descripcion: '7 días seguidos estudiando',
            icono: '🔥',
        },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Welcome Header */}
                <div className="rounded-xl bg-gradient-to-r from-blue-900 to-cyan-900 p-6 text-white md:p-8">
                    <h1 className="mb-2 text-3xl font-bold md:text-4xl">
                        ¡Bienvenido, {profileLoading ? 'Estudiante' : profile?.nombre || 'Estudiante'}! 👋
                    </h1>
                    <p className="text-lg text-blue-100">
                        {profileLoading
                            ? 'Cargando información...'
                            : `${profile?.nivel || 'Nivel'} - ${profile?.grado || 'Grado'} "${profile?.grupo || 'A'}"`}
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat, index) => (
                        <StatsCard key={index} {...stat} />
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Calificaciones Recientes - Takes 2 columns */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Calificaciones Recientes
                            </h2>
                            <Link
                                href="/dashboard/estudiantes/calificaciones"
                                className="text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                                Ver todas →
                            </Link>
                        </div>

                        {gradesLoading ? (
                            <div className="py-8 text-center text-gray-500">
                                Cargando calificaciones...
                            </div>
                        ) : grades && grades.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b bg-gray-50">
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                                Materia
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                                Periodo
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                                Calificación
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                                Fecha
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {grades.slice(0, 5).map((grade) => (
                                            <tr key={grade.id} className="border-b hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                    {grade.materia}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {grade.periodo}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${grade.calificacion >= 9
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : grade.calificacion >= 7
                                                                    ? 'bg-blue-100 text-blue-700'
                                                                    : 'bg-red-100 text-red-700'
                                                            }`}
                                                    >
                                                        {grade.calificacion}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {new Date(grade.fecha).toLocaleDateString('es-MX')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="py-8 text-center text-gray-500">
                                No hay calificaciones  disponibles
                            </div>
                        )}
                    </div>

                    {/* Sidebar - Tareas y Logros */}
                    <div className="space-y-6">
                        {/* Tareas Pendientes */}
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-4 font-semibold text-gray-900">Tareas Pendientes</h3>

                            {assignmentsLoading ? (
                                <div className="py-4 text-center text-sm text-gray-500">
                                    Cargando tareas...
                                </div>
                            ) : assignments && assignments.length > 0 ? (
                                <div className="space-y-3">
                                    {assignments.slice(0, 5).map((assignment) => (
                                        <div
                                            key={assignment.id}
                                            className="rounded-lg border border-gray-200 bg-white p-3 hover:bg-gray-50"
                                        >
                                            <div className="mb-1 font-medium text-gray-900">
                                                {assignment.materia}
                                            </div>
                                            <div className="mb-2 text-sm text-gray-600">
                                                {assignment.titulo}
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-gray-500">
                                                    Entrega:{' '}
                                                    {new Date(
                                                        assignment.fechaEntrega
                                                    ).toLocaleDateString('es-MX')}
                                                </span>
                                                <span
                                                    className={`rounded-full px-2 py-1 font-medium ${assignment.estado === 'pendiente'
                                                            ? 'bg-orange-100 text-orange-700'
                                                            : assignment.estado === 'entregada'
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'bg-emerald-100 text-emerald-700'
                                                        }`}
                                                >
                                                    {assignment.estado}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-4 text-center text-sm text-gray-500">
                                    ¡No tienes tareas pendientes!
                                </div>
                            )}
                        </div>

                        {/* Logros */}
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-4 font-semibold text-gray-900">Logros Recientes</h3>
                            <div className="space-y-3">
                                {logros.map((logro, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-3 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 p-3"
                                    >
                                        <div className="text-2xl">{logro.icono}</div>
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">
                                                {logro.nombre}
                                            </div>
                                            <div className="text-xs text-gray-600">
                                                {logro.descripcion}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
