'use client';

import { Users, BookOpen, Calendar, TrendingUp, Clock, Award } from 'lucide-react';
import TeacherDashboardLayout from '@/components/TeacherDashboardLayout';
import StatsCard from '@/components/StatsCard';

export default function DocentesDashboard() {
    const stats = [
        {
            title: 'Total de Estudiantes',
            value: '156',
            icon: Users,
            trend: { value: 3.1, isPositive: true },
            iconColor: 'text-blue-600',
            iconBgColor: 'bg-blue-100',
        },
        {
            title: 'Clases Esta Semana',
            value: '18',
            icon: Calendar,
            iconColor: 'text-emerald-600',
            iconBgColor: 'bg-emerald-100',
        },
        {
            title: 'Promedio General',
            value: '8.4',
            icon: TrendingUp,
            trend: { value: 2.5, isPositive: true },
            iconColor: 'text-cyan-600',
            iconBgColor: 'bg-cyan-100',
        },
        {
            title: 'Tareas Pendientes',
            value: '7',
            icon: Clock,
            iconColor: 'text-orange-600',
            iconBgColor: 'bg-orange-100',
        },
    ];

    const misClases = [
        {
            nombre: 'Matemáticas III - Grupo A',
            estudiantes: 32,
            horario: 'Lun/Mier 8:00 - 9:30',
            promedio: 8.7,
        },
        {
            nombre: 'Álgebra Lineal - Grupo B',
            estudiantes: 28,
            horario: 'Mar/Jue 10:00 - 11:30',
            promedio: 8.3,
        },
        {
            nombre: 'Cálculo Diferencial - Grupo C',
            estudiantes: 30,
            horario: 'Vie 13:00 - 15:00',
            promedio: 8.9,
        },
    ];

    const proximasClases = [
        {
            materia: 'Matemáticas III',
            grupo: 'Grupo A',
            hora: '8:00 AM',
            aula: '301',
            dia: 'Lunes',
        },
        {
            materia: 'Álgebra Lineal',
            grupo: 'Grupo B',
            hora: '10:00 AM',
            aula: '205',
            dia: 'Martes',
        },
        {
            materia: 'Cálculo Diferencial',
            grupo: 'Grupo C',
            hora: '1:00 PM',
            aula: '401',
            dia: 'Viernes',
        },
    ];

    const tareasRecientes = [
        {
            materia: 'Matemáticas III',
            titulo: 'Sistemas de Ecuaciones',
            entregadas: 28,
            total: 32,
            fecha: '18 Ene 2026',
        },
        {
            materia: 'Álgebra Lineal',
            titulo: 'Matrices y Determinantes',
            entregadas: 25,
            total: 28,
            fecha: '17 Ene 2026',
        },
        {
            materia: 'Cálculo Diferencial',
            titulo: 'Derivadas Parciales',
            entregadas: 30,
            total: 30,
            fecha: '16 Ene 2026',
        },
    ];

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
                    {stats.map((stat, index) => (
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
                            {misClases.map((clase, index) => (
                                <div
                                    key={index}
                                    className="rounded-lg border border-gray-100 p-4 transition-colors hover:bg-gray-50"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">
                                                {clase.nombre}
                                            </div>
                                            <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Users className="h-4 w-4" />
                                                    {clase.estudiantes} estudiantes
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-4 w-4" />
                                                    {clase.horario}
                                                </span>
                                            </div>
                                        </div>
                                        <div
                                            className={`text-xl font-bold ${clase.promedio >= 9
                                                    ? 'text-emerald-600'
                                                    : clase.promedio >= 8
                                                        ? 'text-blue-600'
                                                        : 'text-orange-600'
                                                }`}
                                        >
                                            {clase.promedio}
                                        </div>
                                    </div>
                                </div>
                            ))}
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
                            {proximasClases.map((clase, index) => (
                                <div
                                    key={index}
                                    className="rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">
                                                {clase.materia}
                                            </div>
                                            <div className="mt-1 text-sm text-gray-500">
                                                {clase.grupo} • Aula {clase.aula}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-medium text-blue-600">
                                                {clase.hora}
                                            </div>
                                            <div className="text-xs text-gray-500">{clase.dia}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
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
                        {tareasRecientes.map((tarea, index) => {
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
                        })}
                    </div>
                </div>
            </div>
        </TeacherDashboardLayout>
    );
}
