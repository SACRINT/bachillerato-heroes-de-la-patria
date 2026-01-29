'use client';

import { Users, BookOpen, Calendar, TrendingUp, Mail, Phone, MapPin } from 'lucide-react';
import ParentDashboardLayout from '@/components/ParentDashboardLayout';
import { useMyStudents } from '@/hooks/useParents';
import Link from 'next/link';

export default function HijosPage() {
    const { data: studentsData, isLoading } = useMyStudents();
    const students = studentsData || [];

    if (isLoading) {
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

    return (
        <ParentDashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mis Hijos</h1>
                    <p className="text-gray-500">Información de los estudiantes vinculados a tu cuenta</p>
                </div>

                {/* Students Grid */}
                {students.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-12">
                        <Users className="h-16 w-16 text-gray-400 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            No hay estudiantes vinculados
                        </h3>
                        <p className="text-gray-500 text-center max-w-md">
                            Contacte al administrador para vincular estudiantes a su cuenta
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {students.map((student: any) => (
                            <div
                                key={student.id}
                                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                            >
                                {/* Header Card */}
                                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-2xl font-bold backdrop-blur-sm">
                                            {student.nombre_completo?.charAt(0) || 'E'}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <h3 className="truncate text-lg font-bold">
                                                {student.nombre_completo}
                                            </h3>
                                            <p className="text-sm text-emerald-100">
                                                {student.matricula}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 space-y-4">
                                    {/* Academic Info */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">Grado</span>
                                            <span className="font-medium text-gray-900">
                                                {student.grado}° {student.grupo}
                                            </span>
                                        </div>
                                        {student.turno && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-500">Turno</span>
                                                <span className="font-medium text-gray-900">
                                                    {student.turno}
                                                </span>
                                            </div>
                                        )}
                                        {student.especialidad && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-500">Especialidad</span>
                                                <span className="font-medium text-gray-900">
                                                    {student.especialidad}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">Relación</span>
                                            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 capitalize">
                                                {student.tipo_relacion || 'tutor'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="grid grid-cols-2 gap-2 pt-4 border-t">
                                        <Link
                                            href={`/dashboard/padres/calificaciones?student=${student.id}`}
                                            className="flex flex-col items-center gap-1 rounded-lg border border-gray-200 p-3 text-center transition-colors hover:bg-emerald-50 hover:border-emerald-500"
                                        >
                                            <BookOpen className="h-5 w-5 text-emerald-600" />
                                            <span className="text-xs font-medium text-gray-700">
                                                Calificaciones
                                            </span>
                                        </Link>
                                        <Link
                                            href={`/dashboard/padres/asistencia?student=${student.id}`}
                                            className="flex flex-col items-center gap-1 rounded-lg border border-gray-200 p-3 text-center transition-colors hover:bg-blue-50 hover:border-blue-500"
                                        >
                                            <Calendar className="h-5 w-5 text-blue-600" />
                                            <span className="text-xs font-medium text-gray-700">
                                                Asistencia
                                            </span>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Info Card */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600">
                            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-emerald-900 mb-1">
                                ¿Necesitas vincular más estudiantes?
                            </h3>
                            <p className="text-sm text-emerald-800">
                                Contacta al administrador del sistema para solicitar la vinculación de más estudiantes a tu cuenta.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </ParentDashboardLayout>
    );
}
