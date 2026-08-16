'use client';

import { useState, useEffect } from 'react';
import TeacherDashboardLayout from '@/components/TeacherDashboardLayout';
import { useTeacherClasses, useClassGrades, useSaveBulkGrades } from '@/hooks/useTeacher';
import { BookOpen, Save, Download, TrendingUp, TrendingDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface GradeEntry {
    estudiante_id: number;
    nombre: string;
    apellido_paterno: string;
    apellido_materno?: string;
    matricula: string;
    calificacion_id?: number;
    calificacion?: number | string;
    periodo: string;
    observaciones?: string;
    isModified?: boolean;
}

export default function CapturaCalificacionesPage() {
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [selectedPeriodo, setSelectedPeriodo] = useState('Parcial 1');
    const [grades, setGrades] = useState<GradeEntry[]>([]);

    const { data: clasesData, isLoading: loadingClasses } = useTeacherClasses();
    const { data: gradesData, isLoading: loadingGrades } = useClassGrades(
        selectedClassId || 0,
        selectedPeriodo
    );
    const saveBulkGrades = useSaveBulkGrades();

    const clases = Array.isArray(clasesData) ? clasesData : ((clasesData as any)?.clases || []);

    // Periodos académicos
    const periodos = ['Parcial 1', 'Parcial 2', 'Parcial 3', 'Final'];

    // Inicializar con la primera clase
    useEffect(() => {
        if (clases.length > 0 && !selectedClassId) {
            setSelectedClassId(clases[0].id);
        }
    }, [clases, selectedClassId]);

    // Cargar calificaciones cuando cambia la clase o periodo
    useEffect(() => {
        const gradesList = Array.isArray(gradesData) ? gradesData : ((gradesData as any)?.data || []);
        if (gradesList.length > 0) {
            setGrades(
                gradesList.map((g: any) => ({
                    estudiante_id: g.estudiante_id,
                    nombre: g.nombre,
                    apellido_paterno: g.apellido_paterno,
                    apellido_materno: g.apellido_materno,
                    matricula: g.matricula,
                    calificacion_id: g.calificacion_id,
                    calificacion: g.calificacion || '',
                    periodo: selectedPeriodo,
                    observaciones: g.observaciones || '',
                    isModified: false,
                }))
            );
        }
    }, [gradesData, selectedPeriodo]);

    const updateGrade = (estudianteId: number, field: 'calificacion' | 'observaciones', value: string | number) => {
        setGrades((prev) =>
            prev.map((g) =>
                g.estudiante_id === estudianteId
                    ? { ...g, [field]: value, isModified: true }
                    : g
            )
        );
    };

    const handleSaveGrades = async () => {
        if (!selectedClassId) {
            toast.error('Selecciona una clase');
            return;
        }

        // Filtrar solo las calificaciones modificadas y válidas
        const modifiedGrades = grades.filter(
            (g) => g.isModified && g.calificacion !== '' && g.calificacion !== null
        );

        if (modifiedGrades.length === 0) {
            toast.warning('No hay calificaciones para guardar');
            return;
        }

        // Validar todas las calificaciones
        const invalidGrades = modifiedGrades.filter((g) => {
            const cal = parseFloat(g.calificacion as string);
            return isNaN(cal) || cal < 0 || cal > 10;
        });

        if (invalidGrades.length > 0) {
            toast.error('Hay calificaciones inválidas. Deben estar entre 0 y 10');
            return;
        }

        // Preparar datos para envío
        const gradesToSave = modifiedGrades.map((g) => ({
            estudiante_id: g.estudiante_id,
            materia_id: selectedClassId,
            calificacion: parseFloat(g.calificacion as string),
            periodo: selectedPeriodo,
            observaciones: g.observaciones || undefined,
        }));

        try {
            await saveBulkGrades.mutateAsync(gradesToSave);
            toast.success(`${gradesToSave.length} calificaciones guardadas`);

            // Limpiar el estado de modificado
            setGrades((prev) =>
                prev.map((g) => ({ ...g, isModified: false }))
            );
        } catch (error) {
            toast.error('Error al guardar calificaciones');
            console.error(error);
        }
    };

    const getGradeColor = (calificacion: number | string | undefined): string => {
        if (!calificacion || calificacion === '') return 'text-gray-400';
        const cal = parseFloat(calificacion as string);
        if (isNaN(cal)) return 'text-gray-400';
        if (cal >= 9) return 'text-emerald-600 font-bold';
        if (cal >= 8) return 'text-blue-600 font-semibold';
        if (cal >= 7) return 'text-yellow-600 font-medium';
        if (cal >= 6) return 'text-orange-600 font-medium';
        return 'text-red-600 font-bold';
    };

    const getGradeBadge = (calificacion: number | string | undefined) => {
        if (!calificacion || calificacion === '') {
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                    <AlertCircle className="h-3 w-3" />
                    Sin calif.
                </span>
            );
        }

        const cal = parseFloat(calificacion as string);
        if (isNaN(cal)) return null;

        if (cal >= 6) {
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700">
                    <CheckCircle2 className="h-3 w-3" />
                    Aprobado
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">
                    <AlertCircle className="h-3 w-3" />
                    Reprobado
                </span>
            );
        }
    };

    const stats = {
        total: grades.length,
        captured: grades.filter((g) => g.calificacion !== '' && g.calificacion !== null).length,
        approved: grades.filter((g) => {
            const cal = parseFloat(g.calificacion as string);
            return !isNaN(cal) && cal >= 6;
        }).length,
        failed: grades.filter((g) => {
            const cal = parseFloat(g.calificacion as string);
            return !isNaN(cal) && cal < 6;
        }).length,
        average:
            grades.filter((g) => g.calificacion !== '' && g.calificacion !== null).length > 0
                ? (
                    grades.reduce((sum, g) => {
                        const cal = parseFloat(g.calificacion as string);
                        return sum + (isNaN(cal) ? 0 : cal);
                    }, 0) /
                    grades.filter((g) => {
                        const cal = parseFloat(g.calificacion as string);
                        return !isNaN(cal);
                    }).length
                ).toFixed(2)
                : '0.00',
    };

    if (loadingClasses) {
        return (
            <TeacherDashboardLayout>
                <div className="flex items-center justify-center py-12">
                    <div className="text-gray-500">Cargando clases...</div>
                </div>
            </TeacherDashboardLayout>
        );
    }

    if (clases.length === 0) {
        return (
            <TeacherDashboardLayout>
                <div className="flex items-center justify-center py-12">
                    <div className="text-gray-500">No tienes clases asignadas</div>
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
                        <h1 className="text-2xl font-bold text-gray-900">Captura de Calificaciones</h1>
                        <p className="text-gray-500">Registra las calificaciones de tus estudiantes</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                            <Download className="h-4 w-4" />
                            Exportar
                        </button>
                        <button
                            onClick={handleSaveGrades}
                            disabled={saveBulkGrades.isPending || !grades.some((g) => g.isModified)}
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {saveBulkGrades.isPending ? 'Guardando...' : 'Guardar Calificaciones'}
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="flex-1">
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Clase / Materia
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
                                Periodo
                            </label>
                            <select
                                value={selectedPeriodo}
                                onChange={(e) => setSelectedPeriodo(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                {periodos.map((p) => (
                                    <option key={p} value={p}>
                                        {p}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                                <BookOpen className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Capturadas</p>
                                <p className="text-2xl font-bold text-blue-600">{stats.captured}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                                <CheckCircle2 className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Aprobados</p>
                                <p className="text-2xl font-bold text-emerald-600">{stats.approved}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                                <TrendingUp className="h-6 w-6 text-emerald-600" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Reprobados</p>
                                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                                <TrendingDown className="h-6 w-6 text-red-600" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Promedio</p>
                                <p className={`text-2xl font-bold ${getGradeColor(stats.average)}`}>
                                    {stats.average}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                                <BookOpen className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabla de Calificaciones */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    {loadingGrades ? (
                        <div className="py-12 text-center text-gray-500">Cargando calificaciones...</div>
                    ) : grades.length === 0 ? (
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
                                            Calificación
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Estado
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Observaciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {grades.map((grade, index) => (
                                        <tr
                                            key={grade.estudiante_id}
                                            className={`hover:bg-gray-50 ${grade.isModified ? 'bg-blue-50' : ''
                                                }`}
                                        >
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                {index + 1}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-sm font-bold text-white">
                                                        {grade.nombre[0]}
                                                        {grade.apellido_paterno[0]}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {grade.nombre} {grade.apellido_paterno}{' '}
                                                            {grade.apellido_materno}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                {grade.matricula}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-center">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="10"
                                                    step="0.1"
                                                    value={grade.calificacion}
                                                    onChange={(e) =>
                                                        updateGrade(
                                                            grade.estudiante_id,
                                                            'calificacion',
                                                            e.target.value
                                                        )
                                                    }
                                                    className={`w-20 rounded-lg border-2 px-3 py-2 text-center font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 ${grade.isModified
                                                            ? 'border-blue-400 bg-blue-50'
                                                            : 'border-gray-300'
                                                        } ${getGradeColor(grade.calificacion)}`}
                                                    placeholder="0.0"
                                                />
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-center">
                                                {getGradeBadge(grade.calificacion)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="text"
                                                    value={grade.observaciones}
                                                    onChange={(e) =>
                                                        updateGrade(
                                                            grade.estudiante_id,
                                                            'observaciones',
                                                            e.target.value
                                                        )
                                                    }
                                                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${grade.isModified
                                                            ? 'border-blue-400 bg-blue-50'
                                                            : 'border-gray-300'
                                                        }`}
                                                    placeholder="Observaciones opcionales..."
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Indicador de cambios sin guardar */}
                {grades.some((g) => g.isModified) && (
                    <div className="fixed bottom-6 right-6 rounded-lg bg-blue-600 px-6 py-3 text-white shadow-lg">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            <span className="font-medium">
                                Tienes {grades.filter((g) => g.isModified).length} cambios sin guardar
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </TeacherDashboardLayout>
    );
}
