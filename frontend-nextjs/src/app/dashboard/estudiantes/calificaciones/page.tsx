'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { BookOpen, TrendingUp, TrendingDown, Download } from 'lucide-react';
import { useStudentGrades } from '@/hooks/use-api';
import { useState } from 'react';

export default function CalificacionesPage() {
    const [selectedPeriodo, setSelectedPeriodo] = useState('actual');
    const { data: grades, isLoading } = useStudentGrades(selectedPeriodo);

    const periodos = ['Primer Parcial', 'Segundo Parcial', 'Tercer Parcial', 'Final'];

    const promedio = grades?.length
        ? (grades.reduce((sum, g) => sum + g.calificacion, 0) / grades.length).toFixed(1)
        : '0.0';

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Mis Calificaciones</h1>
                        <p className="mt-1 text-gray-600">
                            Promedio General: <span className="font-bold text-blue-600">{promedio}</span>
                        </p>
                    </div>
                    <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
                        <Download className="h-5 w-5" />
                        Descargar Boleta
                    </button>
                </div>

                {/* Period Filter */}
                <div className="flex gap-2 overflow-x-auto">
                    {periodos.map((periodo) => (
                        <button
                            key={periodo}
                            onClick={() => setSelectedPeriodo(periodo.toLowerCase())}
                            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${selectedPeriodo === periodo.toLowerCase()
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            {periodo}
                        </button>
                    ))}
                </div>

                {/* Grades Table */}
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                    {isLoading ? (
                        <div className="py-12 text-center text-gray-500">
                            Cargando calificaciones...
                        </div>
                    ) : grades && grades.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-gray-50">
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                            Materia
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                            Periodo
                                        </th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                                            Calificación
                                        </th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                                            Tendencia
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                            Fecha
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {grades.map((grade) => (
                                        <tr key={grade.id} className="border-b hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <BookOpen className="h-5 w-5 text-blue-600" />
                                                    <span className="font-medium text-gray-900">
                                                        {grade.materia}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{grade.periodo}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span
                                                    className={`inline-flex rounded-full px-4 py-1.5 text-sm font-semibold ${grade.calificacion >= 9
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : grade.calificacion >= 7
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'bg-red-100 text-red-700'
                                                        }`}
                                                >
                                                    {grade.calificacion}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {grade.calificacion >= 8 ? (
                                                    <TrendingUp className="mx-auto h-5 w-5 text-emerald-600" />
                                                ) : (
                                                    <TrendingDown className="mx-auto h-5 w-5 text-red-600" />
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(grade.fecha).toLocaleDateString('es-MX')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-12 text-center text-gray-500">
                            No hay calificaciones disponibles para este periodo
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
