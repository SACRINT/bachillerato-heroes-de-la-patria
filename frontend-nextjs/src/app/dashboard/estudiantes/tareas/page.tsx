'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { FileText, Calendar, Clock, Upload } from 'lucide-react';
import { useStudentAssignments } from '@/hooks/use-api';
import { useState } from 'react';

export default function TareasPage() {
    const [filter, setFilter] = useState('todas');
    const { data: allAssignments, isLoading } = useStudentAssignments();

    const filteredAssignments = allAssignments?.filter((a) => {
        if (filter === 'pendientes') return a.estado === 'pendiente';
        if (filter === 'entregadas') return a.estado === 'entregada';
        if (filter === 'calificadas') return a.estado === 'calificada';
        return true;
    });

    const counts = {
        pendientes: allAssignments?.filter((a) => a.estado === 'pendiente').length || 0,
        entregadas: allAssignments?.filter((a) => a.estado === 'entregada').length || 0,
        calificadas: allAssignments?.filter((a) => a.estado === 'calificada').length || 0,
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Mis Tareas</h1>
                    <p className="mt-1 text-gray-600">
                        {counts.pendientes} pendientes · {counts.entregadas} entregadas ·{' '}
                        {counts.calificadas} calificadas
                    </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 border-b">
                    {[
                        { key: 'todas', label: 'Todas' },
                        { key: 'pendientes', label: `Pendientes (${counts.pendientes})` },
                        { key: 'entregadas', label: `Entregadas (${counts.entregadas})` },
                        { key: 'calificadas', label: `Calificadas (${counts.calificadas})` },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`px-4 py-2 text-sm font-medium transition-colors ${filter === tab.key
                                    ? 'border-b-2 border-blue-600 text-blue-600'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Assignments List */}
                {isLoading ? (
                    <div className="py-12 text-center text-gray-500">Cargando tareas...</div>
                ) : filteredAssignments && filteredAssignments.length > 0 ? (
                    <div className="space-y-4">
                        {filteredAssignments.map((assignment) => (
                            <div
                                key={assignment.id}
                                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <FileText className="h-5 w-5 text-blue-600" />
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {assignment.titulo}
                                            </h3>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-medium ${assignment.estado === 'pendiente'
                                                        ? 'bg-orange-100 text-orange-700'
                                                        : assignment.estado === 'entregada'
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-emerald-100 text-emerald-700'
                                                    }`}
                                            >
                                                {assignment.estado}
                                            </span>
                                        </div>
                                        <p className="mb-3 text-gray-600">{assignment.descripcion}</p>
                                        <div className="flex items-center gap-6 text-sm text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4" />
                                                <span>{assignment.materia}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                <span>
                                                    Entrega:{' '}
                                                    {new Date(assignment.fechaEntrega).toLocaleDateString(
                                                        'es-MX'
                                                    )}
                                                </span>
                                            </div>
                                            {assignment.calificacion && (
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-blue-600">
                                                        Calificación: {assignment.calificacion}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {assignment.estado === 'pendiente' && (
                                        <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                                            <Upload className="h-4 w-4" />
                                            Entregar
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-12 text-center">
                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-gray-500">No hay tareas en esta categoría</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
