'use client';

import { BarChart, TrendingUp, Download, FileText, Users, GraduationCap, Calendar, DollarSign } from 'lucide-react';
import AdminDashboardLayout from '@/components/AdminDashboardLayout';
import { useState } from 'react';

export default function ReportesAdminPage() {
    const [selectedReport, setSelectedReport] = useState('');

    const reportCategories = [
        {
            title: 'Reportes Académicos',
            icon: GraduationCap,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
            reports: [
                { id: 'calificaciones', name: 'Reporte de Calificaciones por Grupo', description: 'Calificaciones de todos los estudiantes por periodo' },
                { id: 'asistencia', name: 'Reporte de Asistencia', description: 'Registro de asistencia por fecha y grupo' },
                { id: 'reprobados', name: 'Estudiantes en Riesgo', description: 'Lista de estudiantes con bajo desempeño' },
                { id: 'promedios', name: 'Promedios Generales', description: 'Promedios por materia y grupo' },
            ],
        },
        {
            title: 'Reportes Administrativos',
            icon: Users,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-100',
            reports: [
                { id: 'estudiantes', name: 'Catálogo de Estudiantes', description: 'Lista completa de estudiantes activos' },
                { id: 'docentes', name: 'Catálogo de Docentes', description: 'Lista completa de docentes' },
                { id: 'padres', name: 'Catálogo de Padres', description: 'Lista de padres vinculados' },
                { id: 'inscripciones', name: 'Reporte de Inscripciones', description: 'Inscripciones del ciclo actual' },
            ],
        },
        {
            title: 'Reportes Financieros',
            icon: DollarSign,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
            reports: [
                { id: 'colegiaturas', name: 'Estado de Colegiaturas', description: 'Pagos y adeudos de colegiaturas' },
                { id: 'ingresos', name: 'Ingresos Mensuales', description: 'Resumen de ingresos por concepto' },
                { id: 'adeudos', name: 'Adeudos Pendientes', description: 'Lista de pagos pendientes' },
                { id: 'historico', name: 'Histórico de Pagos', description: 'Historial completo de transacciones' },
            ],
        },
        {
            title: 'Reportes Estadísticos',
            icon: BarChart,
            color: 'text-cyan-600',
            bgColor: 'bg-cyan-100',
            reports: [
                { id: 'desercion', name: 'Índice de Deserción', description: 'Análisis de deserción escolar' },
                { id: 'aprovechamiento', name: 'Aprovechamiento Escolar', description: 'Estadísticas de rendimiento académico' },
                { id: 'asistencia-stats', name: 'Estadísticas de Asistencia', description: 'Análisis de patrones de asistencia' },
                { id: 'comparativo', name: 'Comparativo entre Grupos', description: 'Comparación de métricas por grupo' },
            ],
        },
    ];

    const quickReports = [
        {
            title: 'Resumen Diario',
            description: 'Estudiantes, Asistencia y Actividad del Día',
            icon: Calendar,
            filename: 'resumen-diario.pdf',
        },
        {
            title: 'Reporte Mensual',
            description: 'Consolidado de Métricas del Mes',
            icon: FileText,
            filename: 'reporte-mensual.pdf',
        },
        {
            title: 'Dashboard Ejecutivo',
            description: 'Indicadores Clave de Rendimiento (KPIs)',
            icon: TrendingUp,
            filename: 'dashboard-ejecutivo.pdf',
        },
    ];

    const handleGenerateReport = (reportId: string) => {
        // Aquí iría la lógica para generar el reporte
        console.log('Generating report:', reportId);
        // En producción: llamar al backend para generar PDF
    };

    return (
        <AdminDashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Reportes y Analíticas</h1>
                    <p className="text-gray-500">Genera reportes personalizados y consulta estadísticas</p>
                </div>

                {/* Quick Reports */}
                <div>
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">Reportes Rápidos</h2>
                    <div className="grid gap-4 md:grid-cols-3">
                        {quickReports.map((report, index) => {
                            const Icon = report.icon;
                            return (
                                <button
                                    key={index}
                                    onClick={() => handleGenerateReport(report.filename)}
                                    className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-6 text-left shadow-sm transition-all hover:border-indigo-500 hover:shadow-md"
                                >
                                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100">
                                        <Icon className="h-6 w-6 text-indigo-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900">{report.title}</h3>
                                        <p className="mt-1 text-sm text-gray-500">{report.description}</p>
                                        <div className="mt-2 flex items-center gap-1 text-xs text-indigo-600">
                                            <Download className="h-3 w-3" />
                                            <span>Descargar PDF</span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Report Categories */}
                {reportCategories.map((category, categoryIndex) => {
                    const CategoryIcon = category.icon;
                    return (
                        <div key={categoryIndex}>
                            <div className="mb-4 flex items-center gap-2">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${category.bgColor}`}>
                                    <CategoryIcon className={`h-5 w-5 ${category.color}`} />
                                </div>
                                <h2 className="text-lg font-semibold text-gray-900">{category.title}</h2>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                {category.reports.map((report) => (
                                    <div
                                        key={report.id}
                                        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-medium text-gray-900">{report.name}</h3>
                                                <p className="mt-1 text-sm text-gray-500">{report.description}</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex gap-2">
                                            <button
                                                onClick={() => handleGenerateReport(report.id)}
                                                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                            >
                                                <Download className="h-4 w-4" />
                                                PDF
                                            </button>
                                            <button
                                                onClick={() => handleGenerateReport(report.id)}
                                                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                            >
                                                <FileText className="h-4 w-4" />
                                                Excel
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {/* Info Banner */}
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-600">
                            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-blue-900 mb-1">
                                Reportes Personalizados
                            </h3>
                            <p className="text-sm text-blue-800">
                                Los reportes con datos reales estarán disponibles próximamente. Por ahora, puedes generar
                                reportes de demostración con datos de ejemplo. Para solicitar un reporte personalizado,
                                contacta al equipo de soporte técnico.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AdminDashboardLayout>
    );
}
