'use client';

import { Calendar as CalendarIcon, Plus, Filter } from 'lucide-react';
import AdminDashboardLayout from '@/components/AdminDashboardLayout';

export default function CalendarioAdminPage() {
    return (
        <AdminDashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Calendario Escolar</h1>
                        <p className="text-gray-500">Gestiona eventos, exámenes y actividades</p>
                    </div>
                    <button className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                        <Plus className="h-4 w-4" />
                        Nuevo Evento
                    </button>
                </div>

                {/* Coming Soon */}
                <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-12">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-pink-100">
                        <CalendarIcon className="h-10 w-10 text-purple-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        Calendario Escolar Interactivo
                    </h3>
                    <p className="text-gray-500 text-center max-w-md">
                        El calendario escolar interactivo estará disponible próximamente con gestión de eventos,
                        exámenes, juntas y recordatorios automáticos.
                    </p>
                </div>
            </div>
        </AdminDashboardLayout>
    );
}
