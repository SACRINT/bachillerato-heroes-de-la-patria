'use client';

import { useState } from 'react';
import { BookOpen, TrendingUp, TrendingDown, Download, Filter } from 'lucide-react';
import ParentDashboardLayout from '@/components/ParentDashboardLayout';
import { useMyStudents, useStudentGrades } from '@/hooks/useParents';

export default function CalificacionesPage() {
    const { data: studentsData, isLoading: loadingStudents } = useMyStudents();
    const students = studentsData || [];

    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [selectedPeriodo, setSelectedPeriodo] = useState('');

    // Seleccionar primer estudiante por defecto
    const selectedStudent = selectedStudentId
        ? students.find((s: any) => s.id === selectedStudentId)
        : students[0];

    const { data: gradesData, isLoading: loadingGrades } = useStudentGrades(
        selectedStudent?.id || 0,
        selectedPeriodo
    );

    if (loadingStudents) {
        return (
            <ParentDashboardLayout>
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <div className="mb-4 text-lg text-gray-600">Cargando información...</div>
                    </div>
                </div>
            </ParentDashboardLayout>
        );
    }

    if (!students || students.length === 0) {
        return (
            <ParentDashboardLayout>
                <div className="flex items-center justify-center py-20">
                    <div className="text-center text-gray-500">
                        No hay estudiantes vinculados
                    </div>
                </div>
            </ParentDashboardLayout>
        );
    }

    const grades = gradesData?.data?.grades || [];
    const summary = gradesData?.data?.summary || {};

    const getGradeColor = (calificacion: number) => {
        if (calificacion >= 9) return 'text-emerald-600';
        if (calificacion >= 8) return 'text-blue-600';
        if (calificacion >= 7) return 'text-yellow-600';
        if (calificacion >= 6) return 'text-orange-600';
        return 'text-red-600';
    };

    return (
        <ParentDashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Calificaciones</h1>
                        <p className="text-gray-500">Consulta las calificaciones de tus hijos</p>
                    </div>
                    <button className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                        <Download className="h-4 w-4" />
                        Descargar Boleta
                    </button>
                </div>

                {/* Filters */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="flex-1">
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Estudiante
                            </label>
                            <select
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                value={selectedStudent?.id || ''}
                                onChange={(e) => setSelectedStudentId(Number(e.target.value))}
                            >
                                {students.map((student: any) => (
                                    <option key={student.id} value={student.id}>
                                        {student.nombre_completo} - {student.grado}° {student.grupo}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Periodo
                            </label>
                            <select
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                value={selectedPeriodo}
                                onChange={(e) => setSelectedPeriodo(e.target.value)}
                            >
                                <option value="">Todos los periodos</option>
                                <option value="Parcial 1">Parcial 1</option>
                                <option value="Parcial 2">Parcial 2</option>
                                <option value="Parcial 3">Parcial 3</option>
                                <option value="Final">Final</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Summary Stats */}
                {summary.promedio_general && (
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Promedio General</p>
                                    <p className={`text-3xl font-bold ${getGradeColor(summary.promedio_general)}`}>
                                        {summary.promedio_general.toFixed(2)}
                                    </p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                                    <TrendingUp className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Total de Materias</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {summary.total_materias || 0}
                                    </p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                                    <BookOpen className="h-6 w-6 text-purple-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Grades Table */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    {loadingGrades ? (
                        <div className="py-12 text-center text-gray-500">
                            Cargando calificaciones...
                        </div>
                    ) : grades.length === 0 ? (
                        <div className="py-12 text-center text-gray-500">
                            No hay calificaciones disponibles
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Materia
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Periodo
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Calificación
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Observaciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {grades.map((grade: any, index: number) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                                                        <BookOpen className="h-5 w-5 text-emerald-600" />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {grade.materia || 'Sin especificar'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-center">
                                                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                                                    {grade.periodo}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-center">
                                                <span className={`text-2xl font-bold ${getGradeColor(grade.calificacion)}`}>
                                                    {grade.calificacion?.toFixed(1) || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {grade.observaciones || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </ParentDashboardLayout>
    );
}
