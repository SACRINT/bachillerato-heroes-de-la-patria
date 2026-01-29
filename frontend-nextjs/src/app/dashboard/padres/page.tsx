'use client';

import { useState } from 'react';
import { User, TrendingUp, Calendar, AlertTriangle, DollarSign, BookOpen, Users } from 'lucide-react';
import ParentDashboardLayout from '@/components/ParentDashboardLayout';
import StatsCard from '@/components/StatsCard';
import { useParentDashboard, useMyStudents } from '@/hooks/useParents';

export default function PadresDashboard() {
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

    const { data: dashboardData, isLoading: loadingDashboard } = useParentDashboard();
    const { data: studentsData, isLoading: loadingStudents } = useMyStudents();

    const students = studentsData || [];
    const dashboard = dashboardData;

    // Seleccionar primer estudiante por defecto
    const selectedStudent = selectedStudentId
        ? students.find((s: any) => s.id === selectedStudentId)
        : students[0];

    // Estadísticas generales
    const stats = [
        {
            title: 'Hijos Registrados',
            value: dashboard?.summary.total_students.toString() || '0',
            icon: Users,
            iconColor: 'text-purple-600',
            iconBgColor: 'bg-purple-100',
        },
        {
            title: 'Notificaciones',
            value: dashboard?.summary.unread_notifications.toString() || '0',
            icon: AlertTriangle,
            iconColor: 'text-orange-600',
            iconBgColor: 'bg-orange-100',
        },
        {
            title: 'Mensajes',
            value: dashboard?.summary.unread_messages.toString() || '0',
            icon: Calendar,
            iconColor: 'text-blue-600',
            iconBgColor: 'bg-blue-100',
        },
        {
            title: 'Pagos Pendientes',
            value: `$${dashboard?.summary.pending_payments.total.toFixed(2) || '0.00'}`,
            icon: DollarSign,
            iconColor: 'text-emerald-600',
            iconBgColor: 'bg-emerald-100',
        },
    ];

    if (loadingDashboard || loadingStudents) {
        return (
            <ParentDashboardLayout>
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <div className="mb-4 text-lg text-gray-600">Cargando información...</div>
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent mx-auto"></div>
                    </div>
                </div>
            </ParentDashboardLayout>
        );
    }

    if (!students || students.length === 0) {
        return (
            <ParentDashboardLayout>
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            No hay estudiantes vinculados
                        </h3>
                        <p className="text-gray-500">
                            Contacte al administrador para vincular estudiantes a su cuenta
                        </p>
                    </div>
                </div>
            </ParentDashboardLayout>
        );
    }

    return (
        <ParentDashboardLayout>
            <div className="space-y-6">
                {/* Student Selector */}
                <div className="rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 p-6 text-white md:p-8">
                    <div className="mb-4">
                        <label className="mb-2 block text-sm font-medium text-emerald-100">
                            Seleccionar hijo(a)
                        </label>
                        <select
                            className="w-full max-w-md rounded-lg bg-white/10 px-4 py-2 text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                            value={selectedStudent?.id || ''}
                            onChange={(e) => setSelectedStudentId(Number(e.target.value))}
                        >
                            {students.map((student: any) => (
                                <option key={student.id} value={student.id} className="text-gray-900">
                                    {student.nombre_completo} - {student.grado}° {student.grupo}
                                </option>
                            ))}
                        </select>
                    </div>
                    <h1 className="text-3xl font-bold md:text-4xl">
                        Monitoreo de <span className="text-emerald-200">{selectedStudent?.nombre_completo}</span>
                    </h1>
                    <p className="mt-2 text-emerald-100">
                        {selectedStudent?.grado}° {selectedStudent?.grupo} • {selectedStudent?.turno || 'Matutino'}
                        {selectedStudent?.especialidad && ` • ${selectedStudent.especialidad}`}
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
                    {/* Estudiantes Vinculados */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Mis Hijos
                            </h2>
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
                                {students.length} {students.length === 1 ? 'hijo' : 'hijos'}
                            </span>
                        </div>
                        <div className="space-y-3">
                            {students.map((student: any, index: number) => (
                                <div
                                    key={student.id}
                                    className={`rounded-lg border p-4 transition-all cursor-pointer hover:shadow-md ${selectedStudent?.id === student.id
                                            ? 'border-emerald-500 bg-emerald-50'
                                            : 'border-gray-100 hover:bg-gray-50'
                                        }`}
                                    onClick={() => setSelectedStudentId(student.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-lg font-bold text-white">
                                            {student.nombre_completo?.charAt(0) || 'E'}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">
                                                {student.nombre_completo}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {student.grado}° {student.grupo} • {student.matricula}
                                            </div>
                                        </div>
                                        {selectedStudent?.id === student.id && (
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600">
                                                <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Accesos Rápidos */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Accesos Rápidos
                            </h2>
                        </div>
                        <div className="grid gap-3">
                            <a
                                href={`/dashboard/padres/calificaciones?student=${selectedStudent?.id}`}
                                className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 transition-all hover:border-emerald-500 hover:bg-emerald-50"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                                    <BookOpen className="h-6 w-6 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900">Calificaciones</div>
                                    <div className="text-sm text-gray-500">Ver boleta de calificaciones</div>
                                </div>
                            </a>

                            <a
                                href={`/dashboard/padres/asistencia?student=${selectedStudent?.id}`}
                                className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 transition-all hover:border-emerald-500 hover:bg-emerald-50"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                                    <Calendar className="h-6 w-6 text-emerald-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900">Asistencia</div>
                                    <div className="text-sm text-gray-500">Consultar registro de asistencia</div>
                                </div>
                            </a>

                            <a
                                href="/dashboard/padres/pagos"
                                className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 transition-all hover:border-emerald-500 hover:bg-emerald-50"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                                    <DollarSign className="h-6 w-6 text-purple-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900">Pagos</div>
                                    <div className="text-sm text-gray-500">
                                        {dashboard?.summary.pending_payments.count || 0} pagos pendientes
                                    </div>
                                </div>
                            </a>

                            <a
                                href="/dashboard/padres/mensajes"
                                className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 transition-all hover:border-emerald-500 hover:bg-emerald-50"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900">Mensajes</div>
                                    <div className="text-sm text-gray-500">
                                        {dashboard?.summary.unread_messages || 0} mensajes sin leer
                                    </div>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Información Adicional */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600">
                            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-emerald-900 mb-2">
                                Bienvenido al Portal de Padres
                            </h3>
                            <p className="text-sm text-emerald-800">
                                Desde aquí puede monitorear el desempeño académico de sus hijos, revisar calificaciones,
                                consultar asistencia, realizar pagos y comunicarse con los docentes. Si tiene alguna duda,
                                no dude en contactarnos.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </ParentDashboardLayout>
    );
}
