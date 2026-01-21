'use client';

import { User, TrendingUp, Calendar, AlertTriangle, DollarSign, BookOpen } from 'lucide-react';
import ParentDashboardLayout from '@/components/ParentDashboardLayout';
import StatsCard from '@/components/StatsCard';

export default function PadresDashboard() {
    // Mock data - represents selected student
    const selectedStudent = {
        id: 1,
        nombre: 'Ana García López',
        grado: '3er Semestre',
        promedio: 8.8,
        asistencia: 96,
    };

    const students = [
        {
            id: 1,
            nombre: 'Ana García López',
            grado: '3er Semestre',
            promedio: 8.8,
            avatar: 'A',
        },
        {
            id: 2,
            nombre: 'Carlos García López',
            grado: '1er Semestre',
            promedio: 9.2,
            avatar: 'C',
        },
    ];

    const stats = [
        {
            title: 'Promedio General',
            value: '8.8',
            icon: TrendingUp,
            trend: { value: 3.2, isPositive: true },
            iconColor: 'text-emerald-600',
            iconBgColor: 'bg-emerald-100',
        },
        {
            title: 'Asistencia',
            value: '96%',
            icon: Calendar,
            trend: { value: 1.5, isPositive: true },
            iconColor: 'text-blue-600',
            iconBgColor: 'bg-blue-100',
        },
        {
            title: 'Tareas Pendientes',
            value: '2',
            icon: BookOpen,
            iconColor: 'text-cyan-600',
            iconBgColor: 'bg-cyan-100',
        },
        {
            title: 'Adeudo',
            value: '$0',
            icon: DollarSign,
            iconColor: 'text-teal-600',
            iconBgColor: 'bg-teal-100',
        },
    ];

    const recentGrades = [
        { materia: 'Matemáticas', calificacion: 9.2, fecha: '15 Ene', tipo: 'Examen' },
        { materia: 'Química', calificacion: 8.7, fecha: '14 Ene', tipo: 'Tarea' },
        { materia: 'Historia', calificacion: 8.5, fecha: '13 Ene', tipo: 'Participación' },
    ];

    const proximasActividades = [
        {
            titulo: 'Examen de Física',
            fecha: '22 Ene 2026',
            tipo: 'Examen',
            importancia: 'alta',
        },
        {
            titulo: 'Entrega Proyecto Literatura',
            fecha: '24 Ene 2026',
            tipo: 'Tarea',
            importancia: 'media',
        },
        {
            titulo: 'Junta con Tutor',
            fecha: '26 Ene 2026',
            tipo: 'Reunión',
            importancia: 'media',
        },
    ];

    const notifications = [
        {
            tipo: 'alerta',
            mensaje: 'Próximo vencimiento de pago de colegiatura',
            fecha: 'Hoy',
        },
        {
            tipo: 'info',
            mensaje: 'Nueva calificación capturada en Matemáticas',
            fecha: 'Ayer',
        },
        {
            tipo: 'success',
            mensaje: 'Excelente participación en clase de Historia',
            fecha: 'Hace 2 días',
        },
    ];

    return (
        <ParentDashboardLayout>
            <div className="space-y-6">
                {/* Student Selector */}
                <div className="rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 p-6 text-white md:p-8">
                    <div className="mb-4">
                        <label className="mb-2 block text-sm font-medium text-emerald-100">
                            Seleccionar hijo(a)
                        </label>
                        <select className="w-full max-w-md rounded-lg bg-white/10 px-4 py-2 text-white backdrop-blur-sm">
                            {students.map((student) => (
                                <option key={student.id} value={student.id} className="text-gray-900">
                                    {student.nombre} - {student.grado}
                                </option>
                            ))}
                        </select>
                    </div>
                    <h1 className="text-3xl font-bold md:text-4xl">
                        Monitoreo de <span className="text-emerald-200">{selectedStudent.nombre}</span>
                    </h1>
                    <p className="mt-2 text-emerald-100">
                        {selectedStudent.grado} • Promedio: {selectedStudent.promedio}
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
                    {/* Calificaciones Recientes */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Calificaciones Recientes
                            </h2>
                            <a
                                href="/dashboard/padres/calificaciones"
                                className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                            >
                                Ver todas →
                            </a>
                        </div>
                        <div className="space-y-3">
                            {recentGrades.map((grade, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
                                >
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900">
                                            {grade.materia}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {grade.tipo} • {grade.fecha}
                                        </div>
                                    </div>
                                    <div
                                        className={`text-2xl font-bold ${grade.calificacion >= 9
                                                ? 'text-emerald-600'
                                                : grade.calificacion >= 8
                                                    ? 'text-blue-600'
                                                    : 'text-orange-600'
                                            }`}
                                    >
                                        {grade.calificacion}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Próximas Actividades */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Próximas Actividades
                            </h2>
                            <a
                                href="/dashboard/padres/calendario"
                                className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                            >
                                Ver calendario →
                            </a>
                        </div>
                        <div className="space-y-3">
                            {proximasActividades.map((actividad, index) => (
                                <div
                                    key={index}
                                    className="rounded-lg border border-gray-100 p-3"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">
                                                {actividad.titulo}
                                            </div>
                                            <div className="mt-1 text-sm text-gray-500">
                                                {actividad.tipo}
                                            </div>
                                        </div>
                                        <span
                                            className={`rounded-full px-2 py-1 text-xs font-medium ${actividad.importancia === 'alta'
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                                }`}
                                        >
                                            {actividad.importancia === 'alta' ? 'Urgente' : 'Pronto'}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                                        <Calendar className="h-4 w-4" />
                                        {actividad.fecha}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Notificaciones */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Notificaciones</h2>
                        <a
                            href="/dashboard/padres/notificaciones"
                            className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                        >
                            Ver todas →
                        </a>
                    </div>
                    <div className="space-y-3">
                        {notifications.map((notif, index) => (
                            <div
                                key={index}
                                className={`rounded-lg border p-3 ${notif.tipo === 'alerta'
                                        ? 'border-orange-200 bg-orange-50'
                                        : notif.tipo === 'success'
                                            ? 'border-emerald-200 bg-emerald-50'
                                            : 'border-blue-200 bg-blue-50'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <AlertTriangle
                                        className={`h-5 w-5 ${notif.tipo === 'alerta'
                                                ? 'text-orange-600'
                                                : notif.tipo === 'success'
                                                    ? 'text-emerald-600'
                                                    : 'text-blue-600'
                                            }`}
                                    />
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-900">
                                            {notif.mensaje}
                                        </div>
                                        <div className="text-xs text-gray-500">{notif.fecha}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </ParentDashboardLayout>
    );
}
