'use client';

import {
    FileText,
    Download,
    TrendingUp,
    Users,
    BookOpen,
    BarChart3,
    Calendar,
    Filter
} from 'lucide-react';
import TeacherDashboardLayout from '@/components/TeacherDashboardLayout';
import { useState } from 'react';

export default function ReportesPage() {
    const [selectedPeriod, setSelectedPeriod] = useState('mensual');

    const reportes = [
        {
            id: 1,
            titulo: 'Reporte de Calificaciones',
            descripcion: 'Resumen de calificaciones por grupo y periodo',
            icono: BookOpen,
            color: 'blue',
            fecha: '23 Ene 2026',
            descargas: 45
        },
        {
            id: 2,
            titulo: 'Análisis de Asistencia',
            descripcion: 'Estadísticas de asistencia por alumno y grupo',
            icono: Users,
            color: 'emerald',
            fecha: '22 Ene 2026',
            descargas: 32
        },
        {
            id: 3,
            titulo: 'Desempeño por Materia',
            descripcion: 'Comparativa de rendimiento académico',
            icono: TrendingUp,
            color: 'purple',
            fecha: '20 Ene 2026',
            descargas: 28
        },
        {
            id: 4,
            titulo: 'Tareas y Actividades',
            descripcion: 'Resumen de tareas entregadas y evaluadas',
            icono: FileText,
            color: 'cyan',
            fecha: '18 Ene 2026',
            descargas: 19
        }
    ];

    const estadisticas = [
        {
            titulo: 'Total de Reportes',
            valor: '24',
            icono: FileText,
            color: 'blue',
            cambio: '+12%'
        },
        {
            titulo: 'Descargas Este Mes',
            valor: '124',
            icono: Download,
            color: 'emerald',
            cambio: '+8%'
        },
        {
            titulo: 'Promedio General',
            valor: '8.6',
            icono: BarChart3,
            color: 'purple',
            cambio: '+0.3'
        },
        {
            titulo: 'Grupos Activos',
            valor: '3',
            icono: Users,
            color: 'cyan',
            cambio: '0'
        }
    ];

    const getColorClasses = (color: string) => {
        switch (color) {
            case 'emerald':
                return { bg: 'bg-emerald-100', text: 'text-emerald-600', hover: 'hover:bg-emerald-50' };
            case 'purple':
                return { bg: 'bg-purple-100', text: 'text-purple-600', hover: 'hover:bg-purple-50' };
            case 'cyan':
                return { bg: 'bg-cyan-100', text: 'text-cyan-600', hover: 'hover:bg-cyan-50' };
            default:
                return { bg: 'bg-blue-100', text: 'text-blue-600', hover: 'hover:bg-blue-50' };
        }
    };

    return (
        <TeacherDashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Reportes y Análisis</h1>
                        <p className="text-gray-500">Genera y descarga reportes académicos</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        >
                            <option value="semanal">Última Semana</option>
                            <option value="mensual">Último Mes</option>
                            <option value="trimestral">Trimestre</option>
                            <option value="anual">Año Completo</option>
                        </select>
                        <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                            <FileText className="h-4 w-4" />
                            Nuevo Reporte
                        </button>
                    </div>
                </div>

                {/* Estadísticas */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {estadisticas.map((stat, index) => {
                        const colors = getColorClasses(stat.color);
                        const Icon = stat.icono;
                        return (
                            <div key={index} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">{stat.titulo}</p>
                                        <p className="mt-1 text-2xl font-bold text-gray-900">{stat.valor}</p>
                                        {stat.cambio !== '0' && (
                                            <p className="mt-1 text-xs font-medium text-emerald-600">
                                                {stat.cambio} vs mes anterior
                                            </p>
                                        )}
                                    </div>
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${colors.bg}`}>
                                        <Icon className={`h-6 w-6 ${colors.text}`} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Reportes Disponibles */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Reportes Disponibles</h2>
                        <button className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                            <Filter className="h-4 w-4" />
                            Filtrar
                        </button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {reportes.map((reporte) => {
                            const colors = getColorClasses(reporte.color);
                            const Icon = reporte.icono;
                            return (
                                <div
                                    key={reporte.id}
                                    className="group rounded-lg border border-gray-200 p-5 transition-all hover:shadow-md"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg ${colors.bg}`}>
                                            <Icon className={`h-6 w-6 ${colors.text}`} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="mb-1 font-semibold text-gray-900 group-hover:text-blue-600">
                                                {reporte.titulo}
                                            </h3>
                                            <p className="mb-3 text-sm text-gray-500">
                                                {reporte.descripcion}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {reporte.fecha}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Download className="h-3 w-3" />
                                                        {reporte.descargas} descargas
                                                    </span>
                                                </div>
                                                <button className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
                                                    <Download className="h-3 w-3" />
                                                    Descargar PDF
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Programar Reportes */}
                <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-600">
                            <Calendar className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="mb-1 font-semibold text-gray-900">Reportes Automáticos</h3>
                            <p className="mb-4 text-sm text-gray-600">
                                Programa la generación automática de reportes y recíbelos por correo electrónico
                            </p>
                            <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                                Configurar Reportes Automáticos
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </TeacherDashboardLayout>
    );
}
