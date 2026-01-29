'use client';

import { useState } from 'react';
import { Calendar, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import ParentDashboardLayout from '@/components/ParentDashboardLayout';
import { useMyStudents, useStudentAttendance } from '@/hooks/useParents';

export default function AsistenciaPage() {
    const { data: studentsData, isLoading: loadingStudents } = useMyStudents();
    const students = studentsData || [];

    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

    // Seleccionar primer estudiante por defecto
    const selectedStudent = selectedStudentId
        ? students.find((s: any) => s.id === selectedStudentId)
        : students[0];

    // Obtener últimos 30 días de asistencia
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const { data: attendanceData, isLoading: loadingAttendance } = useStudentAttendance(
        selectedStudent?.id || 0,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        30
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

    const attendance = attendanceData?.data?.attendance || [];
    const stats = attendanceData?.data?.stats || {
        asistencias: 0,
        faltas: 0,
        retardos: 0,
        porcentaje_asistencia: 0
    };

    return (
        <ParentDashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Asistencia</h1>
                    <p className="text-gray-500">Consulta el registro de asistencia de tus hijos</p>
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
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Asistencias</p>
                                <p className="text-2xl font-bold text-emerald-600">{stats.asistencias}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                                <CheckCircle className="h-6 w-6 text-emerald-600" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Faltas</p>
                                <p className="text-2xl font-bold text-red-600">{stats.faltas}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                                <XCircle className="h-6 w-6 text-red-600" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Retardos</p>
                                <p className="text-2xl font-bold text-yellow-600">{stats.retardos}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                                <Clock className="h-6 w-6 text-yellow-600" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Porcentaje</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {stats.porcentaje_asistencia?.toFixed(1) || 0}%
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                                <TrendingUp className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Attendance Records */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 p-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Últimos 30 días
                        </h2>
                    </div>
                    {loadingAttendance ? (
                        <div className="py-12 text-center text-gray-500">
                            Cargando registro de asistencia...
                        </div>
                    ) : attendance.length === 0 ? (
                        <div className="py-12 text-center text-gray-500">
                            No hay registros de asistencia
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {attendance.map((record: any, index: number) => (
                                <div key={index} className="flex items-center justify-between p-4 hover:bg-gray-50">
                                    <div className="flex items-center gap-4">
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${record.tipo === 'asistencia' ? 'bg-emerald-100' :
                                                record.tipo === 'falta' ? 'bg-red-100' :
                                                    record.tipo === 'retardo' ? 'bg-yellow-100' : 'bg-gray-100'
                                            }`}>
                                            {record.tipo === 'asistencia' && <CheckCircle className="h-5 w-5 text-emerald-600" />}
                                            {record.tipo === 'falta' && <XCircle className="h-5 w-5 text-red-600" />}
                                            {record.tipo === 'retardo' && <Clock className="h-5 w-5 text-yellow-600" />}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">
                                                {record.materia || 'Sin especificar'}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {new Date(record.fecha).toLocaleDateString('es-MX', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${record.tipo === 'asistencia' ? 'bg-emerald-100 text-emerald-700' :
                                                record.tipo === 'falta' ? 'bg-red-100 text-red-700' :
                                                    record.tipo === 'retardo' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                            {record.tipo === 'asistencia' && 'Asistencia'}
                                            {record.tipo === 'falta' && (record.justificada ? 'Falta Justificada' : 'Falta')}
                                            {record.tipo === 'retardo' && 'Retardo'}
                                        </span>
                                        {record.motivo_justificacion && (
                                            <div className="mt-1 text-xs text-gray-500">
                                                {record.motivo_justificacion}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </ParentDashboardLayout>
    );
}
