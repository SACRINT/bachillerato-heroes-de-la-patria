'use client';

import { BookOpen, Users, GraduationCap, TrendingUp, Calendar, Award } from 'lucide-react';
import AdminDashboardLayout from '@/components/AdminDashboardLayout';

export default function AcademicoAdminPage() {
    const stats = [
        {
            title: 'Total Materias',
            value: '45',
            icon: BookOpen,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
        },
        {
            title: 'Promedio General',
            value: '8.5',
            icon: TrendingUp,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-100',
        },
        {
            title: 'Grupos Activos',
            value: '18',
            icon: Users,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
        },
        {
            title: 'Ciclo Escolar',
            value: '2025-2026',
            icon: Calendar,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100',
        },
    ];

    return (
        <AdminDashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestión Académica</h1>
                    <p className="text-gray-500">Administra planes de estudio, materias y grupos</p>
                </div>

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <div key={index} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">{stat.title}</p>
                                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                    </div>
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${stat.bgColor}`}>
                                        <Icon className={`h-6 w-6 ${stat.color}`} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Coming Soon */}
                <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-12">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-purple-100">
                        <GraduationCap className="h-10 w-10 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        Sistema de Gestión Académica
                    </h3>
                    <p className="text-gray-500 text-center max-w-md mb-6">
                        El módulo de gestión académica completo estará disponible próximamente.
                        Podrás administrar planes de estudio, asignar materias a grupos y gestionar el calendario escolar.
                    </p>
                </div>
            </div>
        </AdminDashboardLayout>
    );
}
