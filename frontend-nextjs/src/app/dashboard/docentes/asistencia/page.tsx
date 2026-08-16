'use client';

import { Calendar, CheckCircle, XCircle, AlertCircle, Download, Clock, Save } from 'lucide-react';
import TeacherDashboardLayout from '@/components/TeacherDashboardLayout';
import { useState, useEffect } from 'react';
import { useTeacherClasses } from '@/hooks/useTeacher';
import { useClassAttendance, useMarkBulkAttendance } from '@/hooks/useAttendance';
import { toast } from 'sonner';

type AttendanceStatus = 'presente' | 'ausente' | 'retardo' | null;

interface StudentAttendance {
    id: number;
    nombre: string;
    apellido: string;
    matricula: string;
    asistencia: AttendanceStatus;
}

export default function AsistenciaPage() {
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [estudiantes, setEstudiantes] = useState<StudentAttendance[]>([]);

    const { data: clasesData, isLoading: loadingClasses } = useTeacherClasses();
    const { data: attendanceData, isLoading: loadingAttendance } = useClassAttendance(
        selectedClassId || 0,
        selectedDate
    );
    const markBulkAttendance = useMarkBulkAttendance();

    const clases = Array.isArray(clasesData) ? clasesData : ((clasesData as any)?.clases || []);

    // Inicializar con la primera clase disponible
    useEffect(() => {
        if (clases.length > 0 && !selectedClassId) {
            setSelectedClassId(clases[0].id);
        }
    }, [clases, selectedClassId]);

    // Actualizar estudiantes cuando se carga la asistencia
    useEffect(() => {
        if (attendanceData?.data) {
            const estudiantesConAsistencia: StudentAttendance[] = (attendanceData.data.estudiantes || []).map((est: any) => ({
                id: est.id,
                nombre: est.nombre,
                apellido: est.apellido || '',
                matricula: est.matricula || `EST-${est.id}`,
                asistencia: (est.presente === true ? 'presente' :
                    est.presente === false ? 'ausente' : null) as AttendanceStatus
            }));
            setEstudiantes(estudiantesConAsistencia);
        }
    }, [attendanceData]);

    const stats = {
        total: estudiantes.length,
        presentes: estudiantes.filter(e => e.asistencia === 'presente').length,
        ausentes: estudiantes.filter(e => e.asistencia === 'ausente').length,
        retardos: estudiantes.filter(e => e.asistencia === 'retardo').length,
    };

    const toggleAsistencia = (id: number, newStatus: AttendanceStatus) => {
        setEstudiantes(prev =>
            prev.map(est =>
                est.id === id ? { ...est, asistencia: newStatus } : est
            )
        );
    };

    const handleSaveAttendance = async () => {
        if (!selectedClassId) {
            toast.error('Selecciona una clase');
            return;
        }

        // Preparar datos para envío masivo
        const attendanceRecords = estudiantes
            .filter(est => est.asistencia !== null)
            .map(est => ({
                estudiante_id: est.id,
                materia_id: selectedClassId,
                fecha: selectedDate,
                presente: est.asistencia === 'presente',
                justificada: false,
            }));

        if (attendanceRecords.length === 0) {
            toast.warning('No hay asistencias para guardar');
            return;
        }

        try {
            await markBulkAttendance.mutateAsync(attendanceRecords);
            toast.success(`${attendanceRecords.length} asistencias guardadas`);
        } catch (error) {
            toast.error('Error al guardar asistencia');
            console.error(error);
        }
    };

    const getStatusBadge = (asistencia: AttendanceStatus) => {
        if (!asistencia) {
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    <AlertCircle className="h-3 w-3" />
                    Sin registrar
                </span>
            );
        }

        const badgeConfig = {
            presente: {
                bg: 'bg-emerald-100',
                text: 'text-emerald-700',
                icon: CheckCircle,
                label: 'Presente'
            },
            ausente: {
                bg: 'bg-red-100',
                text: 'text-red-700',
                icon: XCircle,
                label: 'Ausente'
            },
            retardo: {
                bg: 'bg-yellow-100',
                text: 'text-yellow-700',
                icon: Clock,
                label: 'Retardo'
            }
        };

        const config = badgeConfig[asistencia];
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center gap-1 rounded-full ${config.bg} ${config.text} px-3 py-1 text-xs font-medium`}>
                <Icon className="h-3 w-3" />
                {config.label}
            </span>
        );
    };

    if (loadingClasses) {
        return (
            <TeacherDashboardLayout>
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="text-gray-500">Cargando clases...</div>
                    </div>
                </div>
            </TeacherDashboardLayout>
        );
    }

    if (clases.length === 0) {
        return (
            <TeacherDashboardLayout>
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="text-gray-500">No tienes clases asignadas</div>
                    </div>
                </div>
            </TeacherDashboardLayout>
        );
    }

    return (
        <TeacherDashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Control de Asistencia</h1>
                        <p className="text-gray-500">Registra la asistencia de tus estudiantes</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                            <Download className="h-4 w-4" />
                            Exportar
                        </button>
                        <button
                            onClick={handleSaveAttendance}
                            disabled={markBulkAttendance.isPending}
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {markBulkAttendance.isPending ? 'Guardando...' : 'Guardar Asistencia'}
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="flex-1">
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Clase
                            </label>
                            <select
                                value={selectedClassId || ''}
                                onChange={(e) => setSelectedClassId(Number(e.target.value))}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                {clases.map((clase: any) => (
                                    <option key={clase.id} value={clase.id}>
                                        {clase.materia || clase.nombre} - {clase.grupo || 'Sin grupo'}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Fecha
                            </label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                                <Calendar className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Presentes</p>
                                <p className="text-2xl font-bold text-emerald-600">{stats.presentes}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                                <CheckCircle className="h-6 w-6 text-emerald-600" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Ausentes</p>
                                <p className="text-2xl font-bold text-red-600">{stats.ausentes}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                                <XCircle className="h-6 w-6 text-red-600" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
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
                </div>

                {/* Lista de Estudiantes */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    {loadingAttendance ? (
                        <div className="py-12 text-center text-gray-500">
                            Cargando asistencia...
                        </div>
                    ) : estudiantes.length === 0 ? (
                        <div className="py-12 text-center text-gray-500">
                            No hay estudiantes en esta clase
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            #
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Estudiante
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Matrícula
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Estado
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {estudiantes.map((estudiante, index) => (
                                        <tr key={estudiante.id} className="hover:bg-gray-50">
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                {index + 1}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-sm font-bold text-white">
                                                        {estudiante.nombre[0]}{estudiante.apellido[0] || ' '}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {estudiante.nombre} {estudiante.apellido}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                {estudiante.matricula}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-center">
                                                {getStatusBadge(estudiante.asistencia)}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => toggleAsistencia(estudiante.id, 'presente')}
                                                        className={`rounded-lg border px-2 py-1 text-xs font-medium ${estudiante.asistencia === 'presente'
                                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        ✓
                                                    </button>
                                                    <button
                                                        onClick={() => toggleAsistencia(estudiante.id, 'ausente')}
                                                        className={`rounded-lg border px-2 py-1 text-xs font-medium ${estudiante.asistencia === 'ausente'
                                                                ? 'border-red-500 bg-red-50 text-red-700'
                                                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        ✗
                                                    </button>
                                                    <button
                                                        onClick={() => toggleAsistencia(estudiante.id, 'retardo')}
                                                        className={`rounded-lg border px-2 py-1 text-xs font-medium ${estudiante.asistencia === 'retardo'
                                                                ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                                                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        R
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </TeacherDashboardLayout>
    );
}
