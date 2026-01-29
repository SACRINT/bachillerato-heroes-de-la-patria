'use client';

import { Calendar as CalendarIcon, Clock, BookOpen, Users, AlertCircle } from 'lucide-react';
import ParentDashboardLayout from '@/components/ParentDashboardLayout';

export default function CalendarioPage() {
    return (
        <ParentDashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Calendario Escolar</h1>
                    <p className="text-gray-500">Consulta eventos, exámenes y actividades escolares</p>
                </div>

                {/* Coming Soon */}
                <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-12">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-pink-100">
                        <CalendarIcon className="h-10 w-10 text-purple-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        Calendario Interactivo
                    </h3>
                    <p className="text-gray-500 text-center max-w-md mb-6">
                        El calendario escolar interactivo estará disponible próximamente. Podrás consultar
                        eventos, exámenes, juntas y actividades extracurriculares.
                    </p>

                    {/* Features Preview */}
                    <div className="grid gap-4 md:grid-cols-4 w-full max-w-3xl mt-4">
                        <div className="rounded-lg border border-gray-200 p-4 text-center">
                            <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                            <div className="text-sm font-medium text-gray-900">Exámenes</div>
                            <div className="text-xs text-gray-500 mt-1">
                                Fechas de evaluaciones
                            </div>
                        </div>
                        <div className="rounded-lg border border-gray-200 p-4 text-center">
                            <Users className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                            <div className="text-sm font-medium text-gray-900">Juntas</div>
                            <div className="text-xs text-gray-500 mt-1">
                                Reuniones con docentes
                            </div>
                        </div>
                        <div className="rounded-lg border border-gray-200 p-4 text-center">
                            <CalendarIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                            <div className="text-sm font-medium text-gray-900">Eventos</div>
                            <div className="text-xs text-gray-500 mt-1">
                                Actividades escolares
                            </div>
                        </div>
                        <div className="rounded-lg border border-gray-200 p-4 text-center">
                            <AlertCircle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                            <div className="text-sm font-medium text-gray-900">Recordatorios</div>
                            <div className="text-xs text-gray-500 mt-1">
                                Notificaciones automáticas
                            </div>
                        </div>
                    </div>
                </div>

                {/* Placeholder Calendar */}
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Enero 2026</h2>
                        <div className="flex gap-2">
                            <button className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50">
                                ← Anterior
                            </button>
                            <button className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50">
                                Siguiente →
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                                {day}
                            </div>
                        ))}
                        {Array.from({ length: 35 }, (_, i) => {
                            const day = i - 2; // Simula que el mes empieza en miércoles
                            const isCurrentMonth = day > 0 && day <= 31;
                            const isToday = day === 23;

                            return (
                                <div
                                    key={i}
                                    className={`aspect-square rounded-lg border p-2 text-sm ${isCurrentMonth
                                            ? isToday
                                                ? 'border-emerald-500 bg-emerald-50 font-semibold text-emerald-700'
                                                : 'border-gray-200 hover:bg-gray-50'
                                            : 'border-transparent text-gray-300'
                                        }`}
                                >
                                    {isCurrentMonth ? day : ''}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </ParentDashboardLayout>
    );
}
