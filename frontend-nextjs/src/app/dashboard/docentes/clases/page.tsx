'use client';

import { Users, Clock, Calendar, BookOpen, ChevronRight, MoreVertical } from 'lucide-react';
import TeacherDashboardLayout from '@/components/TeacherDashboardLayout';
import { useTeacherClasses } from '@/hooks/useTeacher';
import Link from 'next/link';

export default function MisClasesPage() {
    const { data: clasesData, isLoading } = useTeacherClasses();
    const clases = clasesData?.clases || [];

    // Asignar colores dinámicamente basado en el índice
    const assignColor = (index: number) => {
        const colors = ['blue', 'purple', 'emerald', 'orange', 'pink'];
        return colors[index % colors.length];
    };

    const getColorClasses = (color: string) => {
        switch (color) {
            case 'purple':
                return {
                    bg: 'bg-purple-100',
                    text: 'text-purple-700',
                    border: 'border-purple-200',
                    gradient: 'from-purple-500 to-indigo-600'
                };
            case 'emerald':
                return {
                    bg: 'bg-emerald-100',
                    text: 'text-emerald-700',
                    border: 'border-emerald-200',
                    gradient: 'from-emerald-500 to-teal-600'
                };
            default:
                return {
                    bg: 'bg-blue-100',
                    text: 'text-blue-700',
                    border: 'border-blue-200',
                    gradient: 'from-blue-500 to-cyan-600'
                };
        }
    };

    return (
        <TeacherDashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Mis Clases</h1>
                        <p className="text-gray-500">Gestiona tus grupos y materiales académicos</p>
                    </div>
                    <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                        + Nueva Clase
                    </button>
                </div>

                {/* Grid de Clases */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {isLoading ? (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            Cargando clases...
                        </div>
                    ) : clases.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            No tienes clases asignadas
                        </div>
                    ) : clases.map((clase: any, index: number) => {
                        const color = assignColor(index);
                        const colors = getColorClasses(color);
                        return (
                            <div key={clase.id} className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md">
                                {/* Color accent bar */}
                                <div className={`absolute top-0 left-0 h-1 w-full bg-gradient-to-r ${colors.gradient}`} />

                                <div className="p-6">
                                    <div className="mb-4 flex items-start justify-between">
                                        <div className={`rounded-lg px-3 py-1 text-xs font-semibold ${colors.bg} ${colors.text}`}>
                                            {clase.grupo || 'Sin grupo'}
                                        </div>
                                        <button className="text-gray-400 hover:text-gray-600">
                                            <MoreVertical className="h-5 w-5" />
                                        </button>
                                    </div>

                                    <h3 className="mb-2 text-lg font-bold text-gray-900 group-hover:text-blue-600">
                                        {clase.materia || clase.nombre}
                                    </h3>

                                    <div className="mb-6 space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Users className="h-4 w-4 text-gray-400" />
                                            <span>{clase.total_estudiantes || clase.estudiantes || 0} Estudiantes</span>
                                        </div>
                                        {clase.horario && (
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Clock className="h-4 w-4 text-gray-400" />
                                                <span>{clase.horario}</span>
                                            </div>
                                        )}
                                        {clase.salon && (
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                <span>Aula {clase.salon || clase.aula}</span>
                                            </div>
                                        )}
                                    </div>

                                    {clase.promedio_general && (
                                        <div className="mb-4">
                                            <div className="mb-1 flex items-center justify-between text-xs font-medium text-gray-500">
                                                <span>Promedio General</span>
                                                <span>{clase.promedio_general.toFixed(1)}</span>
                                            </div>
                                            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                                                <div
                                                    className={`h-full rounded-full bg-gradient-to-r ${colors.gradient}`}
                                                    style={{ width: `${(clase.promedio_general / 10) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-3 border-t pt-4">
                                        <Link
                                            href={`/dashboard/docentes/clases/${clase.id}/asistencia`}
                                            className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                        >
                                            <Users className="h-4 w-4" />
                                            Asistencia
                                        </Link>
                                        <Link
                                            href={`/dashboard/docentes/clases/${clase.id}/calificaciones`}
                                            className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                        >
                                            <BookOpen className="h-4 w-4" />
                                            Evaluar
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </TeacherDashboardLayout>
    );
}
