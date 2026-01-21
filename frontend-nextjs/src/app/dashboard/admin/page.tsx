'use client';

import {
    Users,
    GraduationCap,
    DollarSign,
    TrendingUp,
    UserCheck,
    BookOpen,
    Calendar,
    AlertCircle,
} from 'lucide-react';
import AdminDashboardLayout from '@/components/AdminDashboardLayout';
import StatsCard from '@/components/StatsCard';

export default function AdminDashboard() {
    const stats = [
        {
            title: 'Total Estudiantes',
            value: '1,248',
            icon: GraduationCap,
            trend: { value: 12.5, isPositive: true },
            iconColor: 'text-blue-600',
            iconBgColor: 'bg-blue-100',
        },
        {
            title: 'Total Docentes',
            value: '87',
            icon: Users,
            trend: { value: 5.3, isPositive: true },
            iconColor: 'text-emerald-600',
            iconBgColor: 'bg-emerald-100',
        },
        {
            title: 'Ingresos Mes',
            value: '$485K',
            icon: DollarSign,
            trend: { value: 8.1, isPositive: true },
            iconColor: 'text-cyan-600',
            iconBgColor: 'bg-cyan-100',
        },
        {
            title: 'Asistencia hoy',
            value: '94%',
            icon: UserCheck,
            trend: { value: 2.3, isPositive: true },
            iconColor: 'text-indigo-600',
            iconBgColor: 'bg-indigo-100',
        },
    ];

    const recentActivity = [
        {
            tipo: 'inscripcion',
            descripcion: 'Nueva inscripción: Juan Pérez - 3er Semestre',
            timestamp: 'Hace 5 min',
            icon: GraduationCap,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
        },
        {
            tipo: 'pago',
            descripcion: 'Pago recibido: María González - Colegiatura Enero',
            timestamp: 'Hace 12 min',
            icon: DollarSign,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-100',
        },
        {
            tipo: 'calificacion',
            descripcion: 'Calificaciones capturadas: Matemáticas III - Grupo A',
            timestamp: 'Hace 28 min',
            icon: BookOpen,
            color: 'text-cyan-600',
            bgColor: 'bg-cyan-100',
        },
        {
            tipo: 'alerta',
            descripcion: 'Alerta: 15 estudiantes con bajo promedio',
            timestamp: 'Hace 1 hora',
            icon: AlertCircle,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100',
        },
    ];

    const proximosEventos = [
        {
            titulo: 'Junta de Coordinadores',
            fecha: '22 Ene 2026',
            hora: '10:00 AM',
            tipo: 'Reunión',
        },
        {
            titulo: 'Ceremonia de Graduación',
            fecha: '28 Ene 2026',
            hora: '6:00 PM',
            tipo: 'Evento',
        },
        {
            titulo: 'Cierre de Inscripciones',
            fecha: '31 Ene 2026',
            hora: '11:59 PM',
            tipo: 'Deadline',
        },
    ];

    const resumenFinanciero = [
        { categoria: 'Colegiaturas', monto: 385000, porcentaje: 79 },
        { categoria: 'Inscripciones', monto: 65000, porcentaje: 13 },
        { categoria: 'Servicios', monto: 35000, porcentaje: 7 },
    ];

    return (
        <AdminDashboardLayout>
            <div className="space-y-6">
                {/* Welcome Header */}
                <div className="rounded-xl bg-gradient-to-r from-indigo-700 to-purple-700 p-6 text-white md:p-8">
                    <h1 className="text-3xl font-bold md:text-4xl">
                        Panel de <span className="text-indigo-200">Administración</span>
                    </h1>
                    <p className="mt-2 text-indigo-100">
                        Vista general del sistema y métricas en tiempo real
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat, index) => (
                        <StatsCard key={index} {...stat} />
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Recent Activity - Takes 2 columns */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Actividad Reciente
                            </h2>
                            <a
                                href="/dashboard/admin/actividad"
                                className="text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                                Ver todo →
                            </a>
                        </div>
                        <div className="space-y-3">
                            {recentActivity.map((activity, index) => {
                                const Icon = activity.icon;
                                return (
                                    <div
                                        key={index}
                                        className="flex items-start gap-3 rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50"
                                    >
                                        <div
                                            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${activity.bgColor}`}
                                        >
                                            <Icon className={`h-5 w-5 ${activity.color}`} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-gray-900">
                                                {activity.descripcion}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {activity.timestamp}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Próximos Eventos */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Próximos Eventos
                            </h2>
                        </div>
                        <div className="space-y-3">
                            {proximosEventos.map((evento, index) => (
                                <div
                                    key={index}
                                    className="rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50"
                                >
                                    <span className="mb-1 inline-block rounded bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">
                                        {evento.tipo}
                                    </span>
                                    <div className="mt-1 font-medium text-gray-900">
                                        {evento.titulo}
                                    </div>
                                    <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                                        <Calendar className="h-4 w-4" />
                                        {evento.fecha} • {evento.hora}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Resumen Financiero */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Resumen Financiero - Enero 2026
                        </h2>
                        <a
                            href="/dashboard/admin/finanzas"
                            className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                            Ver detalles →
                        </a>
                    </div>
                    <div className="space-y-4">
                        {resumenFinanciero.map((item, index) => (
                            <div key={index}>
                                <div className="mb-2 flex items-center justify-between text-sm">
                                    <span className="font-medium text-gray-700">
                                        {item.categoria}
                                    </span>
                                    <span className="font-semibold text-gray-900">
                                        ${item.monto.toLocaleString()}
                                    </span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                                        style={{ width: `${item.porcentaje}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                        <div className="mt-4 rounded-lg bg-gray-50 p-4">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-gray-900">Total</span>
                                <span className="text-2xl font-bold text-blue-600">$485,000</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminDashboardLayout>
    );
}
